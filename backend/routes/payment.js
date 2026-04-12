import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lazy Razorpay initialization — only created when first needed
// Prevents server crash if keys are not yet configured
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET
        || process.env.RAZORPAY_KEY_ID === 'rzp_test_YOUR_KEY_HERE') {
      throw new Error('Razorpay API keys are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your backend .env file.');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

/**
 * Create a Razorpay Order for Pro Plan upgrade
 * POST /api/payment/create-order
 */
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    // Check if user is already on Pro plan
    const userRes = await query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length > 0 && userRes.rows[0].plan === 'pro') {
      return res.status(400).json({ error: 'You are already on the Pro plan.' });
    }

    const options = {
      amount: 9900, // ₹99 in paise
      currency: 'INR',
      receipt: `autobi_pro_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
        plan: 'pro',
        description: 'AutoBI Studio Pro Plan Upgrade',
      },
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
});

/**
 * Verify Razorpay Payment Signature and upgrade user to Pro
 * POST /api/payment/verify
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data.' });
    }

    // Verify signature using HMAC SHA256
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Signature is valid — upgrade user to Pro
    const result = await query(
      `UPDATE users SET plan = 'pro', plan_updated_at = NOW() WHERE id = $1 
       RETURNING id, name, email, plan, photo_url as "photoURL", bio, theme, language`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log(`🎉 User ${req.user.id} upgraded to Pro plan! Payment: ${razorpay_payment_id}`);

    res.json({
      success: true,
      message: 'Payment verified! You are now a Pro subscriber.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Payment Verify Error:', error);
    res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
  }
});

export default router;
