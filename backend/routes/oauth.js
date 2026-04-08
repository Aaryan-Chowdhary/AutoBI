import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import admin from '../firebaseAdmin.js';

const router = express.Router();

/**
 * Verify Firebase ID Token and handle User Session
 */
router.post('/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if email is verified (unless it's a Google sign-in which is auto-verified)
    if (!decodedToken.email_verified && decodedToken.firebase.sign_in_provider !== 'google.com') {
        return res.status(403).json({ error: 'Email has not been verified yet. Please check your inbox.' });
    }

    const { email, name, uid } = decodedToken;
    const displayName = name || email.split('@')[0];

    // Check if user exists in PostgreSQL
    let result = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (result.rows.length === 0) {
      // Create new user 
      result = await query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [displayName, email, `FIREBASE_${uid}`]
      );
    } else {
        // If user logged in previously with standard password, but now uses Google/Firebase
        // ensure their password_hash reflects the Firebase migration if empty or old format
        if(!result.rows[0].password_hash.startsWith('FIREBASE_')) {
             await query('UPDATE users SET password_hash = $1 WHERE email = $2', [`FIREBASE_${uid}`, email]);
        }
    }

    user = result.rows[0];

    // Generate our standard JWT Session Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '14d' });

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });

  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({ error: 'Invalid or expired token', details: error.message });
  }
});

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// In-memory store for OTPs: { email: { otp: string, expiresAt: number } }
const otpStore = new Map();

router.post('/send-otp', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email, { otp, expiresAt });

  try {
    await transporter.sendMail({
      from: `"AutoBI Studio" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your AutoBI Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111318;">Welcome to AutoBI Studio${name ? `, ${name}` : ''}!</h2>
          <p style="color: #666;">Please use the following verification code to complete your registration:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #1a56db; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `
    });
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP email. Make sure SMTP credentials are correct.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code.' });
  }

  try {
    // 1. Mark Firebase user as verified
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { emailVerified: true });

    // 2. Clear OTP
    otpStore.delete(email);
    
    // 3. Create or update user in Postgres
    let result = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (result.rows.length === 0) {
      const displayName = userRecord.displayName || email.split('@')[0];
      result = await query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [displayName, email, `FIREBASE_${userRecord.uid}`]
      );
    } else {
        if(!result.rows[0].password_hash.startsWith('FIREBASE_')) {
             await query('UPDATE users SET password_hash = $1 WHERE email = $2', [`FIREBASE_${userRecord.uid}`, email]);
        }
    }
    user = result.rows[0];
    
    // 4. Issue standard JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '14d' });

    res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
  }
});

router.post('/reset-password-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // 1. Verify user exists in Firebase
    await admin.auth().getUserByEmail(email);

    // 2. Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { otp, expiresAt });

    // 3. Send email
    await transporter.sendMail({
      from: `"AutoBI Studio" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Password Reset Code - AutoBI Studio',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111318;">Password Reset Request</h2>
          <p style="color: #666;">We received a request to reset your password. Please use the following code:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #1a56db; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Password reset code sent successfully' });
  } catch (error) {
    console.error('Reset Password OTP Error:', error);
    if (error.code === 'auth/user-not-found') {
      // For security, don't explicitly reveal if email exists or not depending on strictness
      // But for a better UX, it's fine to tell them no account found
      return res.status(404).json({ error: 'No account found with that email address.' });
    }
    res.status(500).json({ error: 'Failed to send reset code', details: error.message });
  }
});

router.post('/verify-reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Reset code expired. Please request a new one.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid reset code.' });
  }

  try {
    // 1. Get User
    const userRecord = await admin.auth().getUserByEmail(email);

    // 2. Update Firebase Password
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });

    // 3. Clear OTP
    otpStore.delete(email);

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('Verify Reset Password Error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

export default router;
