import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
    createOrder,
    getOrderDetails,
    updateOrderStatus,
    getOrders,
    searchOrders,
    generateInvoice
} from '../controllers/orderController.js';

const router = express.Router();

// Order tracking routes
router.get('/', isAuthenticated, getOrders);
router.get('/search', isAuthenticated, searchOrders);
router.get('/:id', isAuthenticated, getOrderDetails);
router.get('/:id/invoice', isAuthenticated, generateInvoice);

// Order management routes
router.post('/create', isAuthenticated, createOrder);
router.patch('/:id/status', isAuthenticated, updateOrderStatus);

export default router; 