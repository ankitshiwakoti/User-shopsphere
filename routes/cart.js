import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// View cart
router.get('/', isAuthenticated, (req, res) => {
    res.render('cart/index', {
        title: 'Shopping Cart - ShopSphere',
        cart: req.session.cart || []
    });
});

// Add item to cart
router.post('/add', isAuthenticated, (req, res) => {
    const { productId } = req.body;
    
    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
        req.session.cart = [];
    }
    
    // Add product to cart (simplified version)
    req.session.cart.push({ productId, quantity: 1 });
    
    res.json({ 
        success: true, 
        message: 'Product added to cart',
        cartCount: req.session.cart.length
    });
});

// Remove item from cart
router.delete('/remove/:productId', isAuthenticated, (req, res) => {
    const { productId } = req.params;
    
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
    }
    
    res.json({ 
        success: true, 
        message: 'Product removed from cart',
        cartCount: req.session.cart.length
    });
});

export default router; 