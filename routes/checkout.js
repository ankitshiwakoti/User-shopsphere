import express from 'express';
import { getCheckoutPage, processContactInfo, processPayment } from '../controllers/checkoutController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get checkout page
router.get('/', isAuthenticated, getCheckoutPage);

// Process contact info and show payment page
router.post('/contact-info', isAuthenticated, processContactInfo);

// Process payment and create order
router.post('/payment', isAuthenticated, processPayment);

export default router; 