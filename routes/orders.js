import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import Order from '../models/Order.js';
import { generateInvoice } from '../controllers/orderController.js';

const router = express.Router();

// View all orders
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');
            
        res.render('orders/index', {
            title: 'My Orders - ShopSphere',
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('error', { message: 'Error loading orders' });
    }
});

// View single order
router.get('/:orderId', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        res.render('orders/show', {
            title: 'Order Details - ShopSphere',
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('error', { message: 'Error loading order details' });
    }
});

// Create new order
router.post('/', isAuthenticated, (req, res) => {
    // Simplified version - normally would save to database
    res.json({
        success: true,
        message: 'Order created successfully'
    });
});

// Generate invoice for an order
router.get('/:orderId/invoice', isAuthenticated, generateInvoice);

export default router; 