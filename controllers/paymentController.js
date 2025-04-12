import { createOrder, captureOrder } from '../services/paypalService.js';
import Order from '../models/Order.js';

export const getCheckoutPage = async (req, res) => {
    try {
        const cart = req.session.cart || { items: [] };
        const cartTotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        res.render('checkout', {
            cart,
            cartTotal,
            title: 'Checkout',
            paypalClientId: process.env.PAYPAL_CLIENT_ID
        });
    } catch (error) {
        console.error('Error getting checkout page:', error);
        res.status(500).render('error', { message: 'Error loading checkout page' });
    }
};

export const createOrderAndPayment = async (req, res) => {
    try {
        console.log('=== Starting Order Creation ===');
        console.log('Request Body:', req.body);
        
        const { shippingInfo, totalAmount } = req.body;
        const cart = req.session.cart || { items: [] };
        
        console.log('Cart Items:', cart.items);
        console.log('Total Amount from request:', totalAmount);

        // Generate order number
        const orderCount = await Order.countDocuments();
        const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;
        
        console.log('Generated Order Number:', orderNumber);

        // Create order first
        const orderData = {
            orderNumber,
            user: req.user._id,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            })),
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress: {
                street: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                country: shippingInfo.country
            }
        };

        console.log('Order Data to be saved:', orderData);

        const order = new Order(orderData);
        await order.save();
        
        console.log('Order saved successfully:', order);

        // Create PayPal order
        const paypalOrder = await createOrder(totalAmount);
        console.log('PayPal Order created:', paypalOrder);
        
        res.json({ 
            success: true, 
            orderId: order._id,
            paypalOrderId: paypalOrder.id 
        });
    } catch (error) {
        console.error('Error creating order and payment:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            errors: error.errors
        });
        res.status(500).json({ error: 'Failed to create order and payment' });
    }
};

export const capturePayment = async (req, res) => {
    try {
        console.log('=== Starting Payment Capture ===');
        console.log('Request Body:', req.body);
        
        const { orderId, paypalOrderId, paymentDetails } = req.body;
        
        if (!orderId || !paypalOrderId) {
            console.log('Missing required IDs:', { orderId, paypalOrderId });
            return res.status(400).json({ error: 'Order ID and PayPal Order ID are required' });
        }

        // First update the order with payment details
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found with ID:', orderId);
            return res.status(404).json({ error: 'Order not found' });
        }

        try {
            // Capture PayPal payment
            const capture = await captureOrder(paypalOrderId);
            console.log('PayPal Capture Response:', capture);

            // Update order status
            order.paymentStatus = 'completed';
            order.status = 'completed';
            order.paymentId = capture.id;
            order.paymentDetails = paymentDetails;
            await order.save();

            console.log('Order updated successfully:', order);

            // Clear cart
            req.session.cart = { items: [] };
            await req.session.save();

            res.json({ success: true, order });
        } catch (paypalError) {
            console.error('PayPal Capture Error:', paypalError);
            console.error('PayPal Error Details:', {
                message: paypalError.message,
                statusCode: paypalError.statusCode,
                details: paypalError.details
            });

            // Update order with failed payment status
            order.paymentStatus = 'failed';
            order.status = 'pending';
            await order.save();

            throw new Error(`PayPal payment failed: ${paypalError.message}`);
        }
    } catch (error) {
        console.error('Error capturing payment:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            errors: error.errors
        });
        res.status(500).json({ 
            error: 'Failed to capture payment',
            details: error.message 
        });
    }
};

// New function to handle direct PayPal payment
export const createDirectPayment = async (req, res) => {
    try {
        const cart = req.session.cart || { items: [] };
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        // Create PayPal order directly
        const paypalOrder = await createOrder(totalAmount);
        
        res.json({ 
            success: true, 
            paypalOrderId: paypalOrder.id 
        });
    } catch (error) {
        console.error('Error creating direct payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
}; 