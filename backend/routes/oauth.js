import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import admin from '../firebaseAdmin.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const router = express.Router();

// Utilities and Configurations
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// In-memory store for OTPs: { email: { otp: string, expiresAt: number, type?: string } }
const otpStore = new Map();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

/**
 * Get current user profile (Session Restoration)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, photo_url as "photoURL", bio, plan,
       notif_email as "notifEmail", notif_data_alerts as "notifDataAlerts", 
       notif_report_schedule as "notifReportSchedule", theme, language 
       FROM users WHERE id = $1`, 
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Update Profile (Name and Bio)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, bio } = req.body;
  try {
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio) WHERE id = $3 RETURNING id, name, email, bio',
      [name, bio, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Update Settings (Notifications, Theme, Language)
 */
router.put('/settings', authenticateToken, async (req, res) => {
  const { notifEmail, notifDataAlerts, notifReportSchedule, theme, language } = req.body;
  try {
    const result = await query(
      `UPDATE users SET 
        notif_email = COALESCE($1, notif_email), 
        notif_data_alerts = COALESCE($2, notif_data_alerts), 
        notif_report_schedule = COALESCE($3, notif_report_schedule),
        theme = COALESCE($4, theme),
        language = COALESCE($5, language)
      WHERE id = $6 RETURNING id, theme, language`,
      [notifEmail, notifDataAlerts, notifReportSchedule, theme, language, req.user.id]
    );
    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * Profile Picture Upload
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  try {
    await query('UPDATE users SET photo_url = $1 WHERE id = $2', [photoUrl, req.user.id]);
    res.json({ success: true, photoURL: photoUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update avatar in database' });
  }
});

/**
 * Send OTP for Password Change
 */
router.post('/change-password-send-otp', authenticateToken, async (req, res) => {
  try {
    const userRes = await query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const { email, name } = userRes.rows[0];

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt, type: 'CHANGE_PASSWORD' });

    await transporter.sendMail({
      from: `"AutoBI Studio" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Verification Code for Password Change',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111318;">Change Password Verification</h2>
          <p style="color: #666;">Hi ${name}, please use the code below to verify your password change request:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #1a56db; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `
    });
    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * Verify OTP and Finalize Password Change
 */
router.post('/change-password-verify', authenticateToken, async (req, res) => {
  const { otp, newPassword } = req.body;
  
  try {
    const userRes = await query('SELECT email, password_hash, firebase_uid FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const { email, password_hash, firebase_uid } = userRes.rows[0];
    const record = otpStore.get(email);

    if (!record || record.otp !== otp || record.type !== 'CHANGE_PASSWORD' || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // 1. Update Firebase if user is a Firebase user
    let actualUid = firebase_uid;
    if (!actualUid && password_hash?.startsWith('FIREBASE_')) {
      actualUid = password_hash.replace('FIREBASE_', '');
    }

    if (actualUid) {
      try {
        await admin.auth().updateUser(actualUid, { password: newPassword });
        console.log(`✅ Synced password change to Firebase for UID: ${actualUid}`);
      } catch (fbError) {
        console.error('Firebase Password Sync Error:', fbError);
        // We continue because updating local DB is still important, 
        // but we might want to inform the user if it's a critical failure.
      }
    }

    // 2. Update local PostgreSQL password_hash
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    
    otpStore.delete(email);
    res.json({ success: true, message: 'Password updated successfully and synced with your account.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

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

    const { email, name, uid, picture } = decodedToken;
    const displayName = name || email.split('@')[0];

    // Check if user exists in PostgreSQL
    let result = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (result.rows.length === 0) {
      // Create new user with photo
      result = await query(
        'INSERT INTO users (name, email, password_hash, firebase_uid, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, photo_url as "photoURL"',
        [displayName, email, `FIREBASE_${uid}`, uid, picture]
      );
    } else {
        // Update name/photo if they've changed and migration if needed
        await query(
          'UPDATE users SET password_hash = CASE WHEN password_hash NOT LIKE $1 THEN $1 ELSE password_hash END, firebase_uid = COALESCE(firebase_uid, $2), photo_url = COALESCE(photo_url, $3) WHERE email = $4',
          [`FIREBASE_${uid}`, uid, picture, email]
        );
        // Refetch to get updated data
        result = await query(
          `SELECT id, name, email, photo_url as "photoURL", bio, plan,
           notif_email as "notifEmail", notif_data_alerts as "notifDataAlerts", 
           notif_report_schedule as "notifReportSchedule", theme, language 
           FROM users WHERE email = $1`, 
          [email]
        );
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
            email: user.email,
            photoURL: user.photoURL,
            plan: user.plan,
            bio: user.bio,
            notifEmail: user.notifEmail,
            notifDataAlerts: user.notifDataAlerts,
            notifReportSchedule: user.notifReportSchedule,
            theme: user.theme,
            language: user.language
        }
    });

  } catch (error) {
    console.error('Firebase Auth Error:', error);
    
    // Database connectivity issues
    if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
        return res.status(503).json({ error: 'Database connection failed. Please check your internet connection and try again.' });
    }
    
    // Firebase Admin SDK specific errors
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Your session has expired. Please try logging in again.' });
    }
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-credential') {
        return res.status(500).json({ error: 'Server authentication misconfigured. Please contact the administrator.', details: error.message });
    }
    
    res.status(401).json({ error: 'Authentication failed. Please try again.', details: error.message });
  }
});

// Endpoints for sending and verifying OTPs

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
        'INSERT INTO users (name, email, password_hash, firebase_uid) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
        [displayName, email, `FIREBASE_${userRecord.uid}`, userRecord.uid]
      );
    } else {
        if(!result.rows[0].password_hash.startsWith('FIREBASE_')) {
             await query('UPDATE users SET password_hash = $1, firebase_uid = $2 WHERE email = $3', [`FIREBASE_${userRecord.uid}`, userRecord.uid, email]);
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
