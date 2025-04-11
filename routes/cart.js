import express from 'express';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { addToCart, removeFromCart, updateCartItem } from '../controllers/cartController.js';

const router = express.Router();

// View cart (web route)
router.get('/', async (req, res) => {
    try {
        let cartItems = [];
        let subtotal = 0;
        
        if (req.user) {
            // For logged-in users, get cart from database
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            if (cart && cart.items.length > 0) {
                // Map populated items to the format expected by the template
                cartItems = cart.items.filter(item => item.product).map(item => ({
                    _id: item.product._id,
                    quantity: item.quantity,
                    product: item.product
                }));
                
                // Calculate subtotal
                subtotal = cart.items.reduce((total, item) => {
                    if (item.product) {
                        return total + (item.product.price * item.quantity);
                    }
                    return total;
                }, 0);
            }
        } else {
            // For non-logged-in users, get cart from session
            if (req.session.cart && req.session.cart.items && req.session.cart.items.length > 0) {
                cartItems = req.session.cart.items.map(item => ({
                    _id: item.productId,
                    quantity: item.quantity,
                    product: {
                        _id: item.productId,
                        name: item.name,
                        price: item.price,
                        images: item.image ? [{ url: item.image }] : [],
                        category: {
                            name: 'Uncategorized'
                        }
                    }
                }));
                
                // Calculate subtotal
                subtotal = req.session.cart.items.reduce((total, item) => {
                    return total + (item.price * item.quantity);
                }, 0);
            }
        }

        res.render('cart', {
            title: 'Shopping Cart - ShopSphere',
            cart: {
                items: cartItems,
                subtotal: subtotal,
                total: subtotal // Use subtotal as total (no tax or shipping)
            }
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).render('error', { 
            message: 'Error loading cart',
            error: {}
        });
    }
});

// API routes
// Add item to cart
router.post('/add', addToCart);
router.post('/add/:productId', addToCart); // Keep for backward compatibility

// Remove item from cart
router.delete('/remove/:productId', removeFromCart);

// Update cart item quantity
router.put('/update/:productId', updateCartItem);

// Get cart summary
router.get('/summary', async (req, res) => {
    try {
        let subtotal = 0;
        
        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            if (cart && cart.items.length > 0) {
                subtotal = cart.items.reduce((total, item) => {
                    return total + (item.product.price * item.quantity);
                }, 0);
            }
        } else {
            // For non-logged-in users
            if (req.session.cart && req.session.cart.items && req.session.cart.items.length > 0) {
                subtotal = req.session.cart.items.reduce((total, item) => {
                    return total + (item.price * item.quantity);
                }, 0);
            }
        }
        
        res.json({
            success: true,
            cart: {
                subtotal: subtotal,
                total: subtotal // Use subtotal as total (no tax or shipping)
            }
        });
    } catch (error) {
        console.error('Error getting cart summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart summary'
        });
    }
});

// Get cart count
router.get('/count', async (req, res) => {
    try {
        let cartCount = 0;
        
        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            cartCount = cart ? cart.items.length : 0;
        } else {
            // For non-logged-in users
            cartCount = req.session.cart?.items?.length || 0;
        }
        
        res.json({
            success: true,
            cartCount
        });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart count'
        });
    }
});

export default router; 