import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Create a new order
export const createOrder = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Please login to complete your order',
                requireLogin: true 
            });
        }

        let cartItems = [];
        let total = 0;

        // Get cart items from session
        if (req.session.cart && req.session.cart.length > 0) {
            cartItems = req.session.cart.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price
            }));

            total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        } else {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Create order
        const order = new Order({
            user: req.user._id,
            items: cartItems,
            shippingAddress: req.body.shippingAddress,
            paymentMethod: req.body.paymentMethod,
            subtotal: total,
            total: total
        });

        await order.save();

        // Clear the session cart
        req.session.cart = [];

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
};

// Get user's order history
export const getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'name price images')
            .sort('-createdAt');

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ message: 'Error fetching order history' });
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        }).populate('items.product', 'name price images description stock');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        await order.save();

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
}; 