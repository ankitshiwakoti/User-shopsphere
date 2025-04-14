import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }

        res.render('orders/detail', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        req.flash('error', 'Failed to fetch order details');
        res.redirect('/orders');
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

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');
        
        res.render('orders/index', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Failed to fetch orders');
        res.redirect('/');
    }
};

export const searchOrders = async (req, res) => {
    try {
        const { orderNumber, status } = req.query;
        const query = { user: req.user._id };

        if (orderNumber) {
            query.orderNumber = new RegExp(orderNumber, 'i');
        }

        if (status) {
            query.orderStatus = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('items.product');

        res.render('orders/index', { orders, filters: req.query });
    } catch (error) {
        console.error('Error searching orders:', error);
        req.flash('error', 'Failed to search orders');
        res.redirect('/orders');
    }
};

export const generateInvoice = async (req, res) => {
    try {
        console.log('Starting invoice generation...');
        console.log('Order ID:', req.params.orderId);
        console.log('User ID:', req.user._id);

        if (!req.params.orderId) {
            console.error('No order ID provided');
            req.flash('error', 'Order ID is required');
            return res.redirect('/orders');
        }

        if (!req.user || !req.user._id) {
            console.error('No authenticated user found');
            req.flash('error', 'Authentication required');
            return res.redirect('/login');
        }

        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        }).populate([
            { path: 'items.product', select: 'name price' },
            { path: 'user', select: 'name email' }
        ]);

        console.log('Found order:', order ? 'Yes' : 'No');
        if (order) {
            console.log('Order number:', order.orderNumber);
            console.log('Order items:', order.items.length);
        }

        if (!order) {
            console.log('Order not found, redirecting...');
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }

        console.log('Creating PDF document...');
        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        console.log('Setting response headers...');
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);

        console.log('Piping PDF to response...');
        // Pipe the PDF to the response
        doc.pipe(res);

        console.log('Adding header content...');
        // Add header with company name
        doc.fontSize(24)
           .text('ShopSphere', 50, 50, { align: 'center' })
           .fontSize(10)
           .moveDown()
           .text('123 Commerce Street', { align: 'center' })
           .text('Business City, ST 12345', { align: 'center' })
           .text('(555) 555-5555', { align: 'center' })
           .moveDown(2);

        console.log('Adding invoice details...');
        // Add invoice details
        doc.fontSize(16)
           .text('INVOICE', { align: 'center' })
           .moveDown()
           .fontSize(10)
           .text(`Invoice Number: ${order.orderNumber}`)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
           .moveDown(2);

        console.log('Adding customer info...');
        // Add customer info
        doc.text('Bill To:')
           .moveDown(0.5)
           .text(order.user.name || 'Customer')
           .text(order.shippingAddress?.street || '')
           .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`)
           .text(order.shippingAddress?.country || '')
           .moveDown(2);

        console.log('Setting up items table...');
        // Add items table
        const tableTop = doc.y;
        const itemX = 50;
        const quantityX = 250;
        const priceX = 350;
        const totalX = 450;

        // Add table headers
        doc.font('Helvetica-Bold');
        doc.text('Item', itemX, tableTop)
           .text('Quantity', quantityX, tableTop)
           .text('Price', priceX, tableTop)
           .text('Total', totalX, tableTop);

        // Reset font
        doc.font('Helvetica');
        let y = tableTop + 20;

        console.log('Adding order items...');
        // Add table rows
        order.items.forEach((item, index) => {
            console.log(`Processing item ${index + 1}:`, {
                name: item.product?.name || 'Product',
                quantity: item.quantity,
                price: item.price
            });

            doc.text(item.product?.name || 'Product', itemX, y)
               .text(item.quantity.toString(), quantityX, y)
               .text(`$${(item.price || 0).toFixed(2)}`, priceX, y)
               .text(`$${((item.price || 0) * item.quantity).toFixed(2)}`, totalX, y);
            y += 20;
        });

        console.log('Adding totals section...');
        // Add line
        doc.moveTo(itemX, y)
           .lineTo(totalX + 50, y)
           .stroke();

        y += 20;

        // Add totals
        doc.text('Subtotal:', 350, y)
           .text(`$${(order.subtotal || 0).toFixed(2)}`, totalX, y);
        y += 20;

        doc.text('Shipping:', 350, y)
           .text(`$${(order.shippingCost || 0).toFixed(2)}`, totalX, y);
        y += 20;

        doc.text('Tax:', 350, y)
           .text(`$${(order.tax || 0).toFixed(2)}`, totalX, y);
        y += 20;

        console.log('Adding final total...');
        // Total
        doc.font('Helvetica-Bold')
           .text('Total:', 350, y)
           .text(`$${(order.total || 0).toFixed(2)}`, totalX, y);

        console.log('Adding footer...');
        // Add footer
        doc.font('Helvetica')
           .fontSize(10)
           .text(
                'Thank you for your business!',
                50,
                700,
                { align: 'center' }
            )
           .moveDown()
           .text(
                `Payment Status: ${order.paymentStatus || 'Pending'}`,
                { align: 'center' }
            )
           .moveDown()
           .fontSize(8)
           .text(
                'Terms and Conditions: This is a computer generated invoice, no signature required.',
                { align: 'center' }
            );

        console.log('Finalizing PDF...');
        // Finalize PDF
        doc.end();
        console.log('PDF generation completed successfully');

    } catch (error) {
        console.error('Error in invoice generation:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            path: error.path,
            syscall: error.syscall
        });
        req.flash('error', 'Failed to generate invoice');
        return res.redirect(`/orders/${req.params.orderId}`);
    }
}; 