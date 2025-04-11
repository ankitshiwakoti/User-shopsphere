const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get cart page
exports.getCartPage = async (req, res) => {
    try {
        // Get user's cart or create a new one
        let cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            });
            
        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: [],
                subtotal: 0,
                shipping: 0,
                tax: 0,
                total: 0
            });
        }
        
        // Calculate cart totals
        cart.subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
        
        // Apply shipping and tax
        cart.shipping = cart.subtotal > 100 ? 0 : 10; // Free shipping over $100
        cart.tax = cart.subtotal * 0.1; // 10% tax
        cart.total = cart.subtotal + cart.shipping + cart.tax;
        
        // Save updated cart
        await cart.save();
        
        res.render('cart', { cart });
    } catch (error) {
        console.error('Error in getCartPage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;

        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product is already in cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        
        // Get unique item count (number of different products)
        const uniqueItemCount = cart.items.length;

        res.json({ 
            success: true, 
            message: 'Product added to cart successfully',
            cartCount: uniqueItemCount
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Error adding product to cart' });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Get cart
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        // Find and update item
        const item = cart.items.find(item => 
            item.product.toString() === productId
        );
        
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }
        
        item.quantity = quantity;
        
        // Calculate totals
        cart.subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
        
        cart.shipping = cart.subtotal > 100 ? 0 : 10;
        cart.tax = cart.subtotal * 0.1;
        cart.total = cart.subtotal + cart.shipping + cart.tax;
        
        await cart.save();
        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Get cart
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        // Remove item
        cart.items = cart.items.filter(item => 
            item.product.toString() !== productId
        );
        
        // Calculate totals
        cart.subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
        
        cart.shipping = cart.subtotal > 100 ? 0 : 10;
        cart.tax = cart.subtotal * 0.1;
        cart.total = cart.subtotal + cart.shipping + cart.tax;
        
        await cart.save();
        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get cart summary
exports.getCartSummary = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Error in getCartSummary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 