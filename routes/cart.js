import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import Product from '../models/Product.js';

const router = express.Router();

// View cart
router.get('/', (req, res) => {
    res.render('cart/index', {
        title: 'Shopping Cart - ShopSphere',
        cart: req.session.cart || []
    });
});

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check stock
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available'
            });
        }

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if product already in cart
        const existingItemIndex = req.session.cart.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            // Update quantity if product already in cart
            req.session.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            req.session.cart.push({
                productId,
                quantity,
                name: product.name,
                price: product.price,
                image: product.image
            });
        }

        // Calculate total items in cart
        const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

        res.json({
            success: true,
            message: 'Product added to cart',
            cartCount
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart'
        });
    }
});

// Remove item from cart
router.delete('/remove/:productId', (req, res) => {
    const { productId } = req.params;

    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
    }

    // Calculate total items in cart
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

    res.json({
        success: true,
        message: 'Product removed from cart',
        cartCount
    });
});

// Update cart item quantity
router.put('/update/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        // Validate product exists and check stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available'
            });
        }

        // Update quantity in cart
        if (req.session.cart) {
            const itemIndex = req.session.cart.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                req.session.cart[itemIndex].quantity = quantity;
            }
        }

        // Calculate total items in cart
        const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

        res.json({
            success: true,
            message: 'Cart updated successfully',
            cartCount
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart'
        });
    }
});

export default router; 