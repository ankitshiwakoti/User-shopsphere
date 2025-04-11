import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// View cart (web route)
router.get('/', (req, res) => {
    // Get cart from session or initialize empty cart
    const cartItems = (req.session.cart || []).map(item => ({
        _id: item.productId,
        quantity: item.quantity,
        product: {
            _id: item.productId,
            name: item.name,
            price: item.price,
            images: [item.image],
            category: {
                name: 'Uncategorized'
            }
        }
    }));

    // Calculate subtotal
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);

    res.render('cart', {
        title: 'Shopping Cart - ShopSphere',
        cart: {
            items: cartItems,
            subtotal: subtotal,
            total: subtotal // Use subtotal as total (no tax or shipping)
        }
    });
});

// API routes
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

        // Calculate total items in cart (unique items)
        const cartCount = req.session.cart.length;

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

    // Calculate total items in cart (unique items)
    const cartCount = req.session.cart ? req.session.cart.length : 0;

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
        
        console.log('Updating cart item:', { productId, quantity });

        // Validate product exists and check stock
        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found:', productId);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            console.log('Not enough stock:', { productId, quantity, stock: product.stock });
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available'
            });
        }

        // Update quantity in cart
        if (req.session.cart) {
            const itemIndex = req.session.cart.findIndex(item => item.productId === productId);
            console.log('Found item at index:', itemIndex);
            
            if (itemIndex > -1) {
                req.session.cart[itemIndex].quantity = quantity;
                console.log('Updated quantity to:', quantity);
            } else {
                console.log('Item not found in cart:', productId);
                return res.status(404).json({
                    success: false,
                    message: 'Item not found in cart'
                });
            }
        } else {
            console.log('Cart not found');
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Calculate total items in cart (unique items)
        const cartCount = req.session.cart ? req.session.cart.length : 0;
        console.log('Updated cart count:', cartCount);

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

// Get cart summary
router.get('/summary', (req, res) => {
    try {
        const cartItems = req.session.cart || [];
        
        // Calculate subtotal
        const subtotal = cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        
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

export default router; 