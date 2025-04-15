import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Get checkout page
export const getCheckoutPage = async (req, res) => {
    try {
        let cart;
        if (req.user) {
            // For logged-in users
            cart = await Cart.findOne({ user: req.user._id })
                .populate({
                    path: 'items.product',
                    select: 'name price images'
                });
        } else {
            // For non-logged-in users, get cart from session
            cart = req.session.cart || { items: [] };
            
            // Format session cart data
            if (cart.items && cart.items.length > 0) {
                const products = await Product.find({
                    _id: { $in: cart.items.map(item => item.product) }
                }).select('name price images');
                
                cart.items = cart.items.map(item => {
                    const product = products.find(p => p._id.toString() === item.product.toString());
                    return {
                        ...item,
                        product: product ? product.toObject() : null
                    };
                });
            }
        }

        // Calculate totals
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        const total = subtotal; // No tax or shipping for now

        res.render('checkout/contact-info', { 
            cart,
            subtotal,
            total,
            user: req.user || null
        });
    } catch (error) {
        console.error('Error in getCheckoutPage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Process contact info and show payment page
export const processContactInfo = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            address, 
            city, 
            state, 
            zipCode, 
            country 
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !address || !city || !state || !zipCode || !country) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Store contact info in session
        req.session.checkoutData = {
            contactInfo: {
                firstName,
                lastName,
                email,
                phone
            },
            shippingAddress: {
                address,
                city,
                state,
                zipCode,
                country
            }
        };

        // Get cart data
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user._id })
                .populate({
                    path: 'items.product',
                    select: 'name price images'
                });
        } else {
            cart = req.session.cart || { items: [] };
        }

        // Calculate totals
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        const total = subtotal; // No tax or shipping for now

        res.render('checkout/payment', { 
            cart,
            subtotal,
            total,
            contactInfo: req.session.checkoutData.contactInfo,
            shippingAddress: req.session.checkoutData.shippingAddress
        });
    } catch (error) {
        console.error('Error in processContactInfo:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Process payment and create order
export const processPayment = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment method is required' 
            });
        }

        // Get cart data
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user._id })
                .populate({
                    path: 'items.product',
                    select: 'name price images'
                });
        } else {
            cart = req.session.cart || { items: [] };
        }

        // Calculate totals
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        const totalAmount = subtotal; // No tax or shipping for now
        const total = totalAmount; // Same as totalAmount for now

        // Generate order number
        const orderCount = await Order.countDocuments();
        const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

        // Create order
        const order = new Order({
            orderNumber,
            user: req.user ? req.user._id : null,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            })),
            contactInfo: req.session.checkoutData.contactInfo,
            shippingAddress: req.session.checkoutData.shippingAddress,
            paymentMethod,
            subtotal,
            totalAmount,
            total,
            status: 'pending',
            paymentStatus: 'pending'
        });

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Save the order
            await order.save({ session });

            // Update stock for each product
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { stock: -item.quantity } },
                    { session }
                );
            }

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            // Clear cart
            if (req.user) {
                await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    { $set: { items: [] } }
                );
            } else {
                req.session.cart = { items: [] };
            }

            // Clear checkout data from session
            delete req.session.checkoutData;

            res.redirect(`/orders/${order._id}`);
        } catch (error) {
            // If there's an error, abort the transaction
            await session.abortTransaction();
            session.endSession();
            console.error('Error in processPayment:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    } catch (error) {
        console.error('Error in processPayment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 