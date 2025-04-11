import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import {
    createOrder,
    getOrderHistory,
    getOrderDetails,
    updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

// Create a new order
router.post('/', isAuthenticated, createOrder);

// Get user's order history
router.get('/history', isAuthenticated, getOrderHistory);

// Get order details
router.get('/:orderId', isAuthenticated, getOrderDetails);

// Update order status (admin only)
router.put('/:orderId/status', isAdmin, updateOrderStatus);

export default router; 