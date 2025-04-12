import express from 'express';
import { getCheckoutPage, createOrderAndPayment, capturePayment, createDirectPayment } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get checkout page
router.get('/checkout', isAuthenticated, getCheckoutPage);

// Create a PayPal order and payment
router.post('/create', isAuthenticated, createOrderAndPayment);

// Create direct PayPal payment
router.post('/direct', isAuthenticated, createDirectPayment);

// Capture a PayPal payment
router.post('/capture', isAuthenticated, capturePayment);

export default router; 