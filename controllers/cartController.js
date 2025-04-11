import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get cart page
export const getCartPage = async (req, res) => {
    try {
        let cart;
        if (req.user) {
            // For logged-in users
            cart = await Cart.findOne({ user: req.user._id }).populate('items');
        } else {
            // For non-logged-in users, get cart from session
            cart = req.session.cart || { items: [] };
        }
            
        res.render('cart', { cart });
    } catch (error) {
        console.error('Error in getCartPage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (req.user) {
            // For logged-in users
            let cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                cart = new Cart({ user: req.user._id, items: [] });
            }

            if (cart.items.includes(productId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Product already in cart',
                    cartCount: cart.items.length
                });
            }

            cart.items.push(productId);
            await cart.save();
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Product added to cart', cartCount });
        } else {
            // For non-logged-in users
            let cart = req.session.cart || { items: [] };
            
            if (cart.items.includes(productId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Product already in cart',
                    cartCount: cart.items.length
                });
            }

            cart.items.push(productId);
            req.session.cart = cart;
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Product added to cart', cartCount });
        }
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            cart.items = cart.items.filter(item => item.toString() !== productId);
            await cart.save();
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Product removed from cart', cartCount });
        } else {
            // For non-logged-in users
            let cart = req.session.cart || { items: [] };
            cart.items = cart.items.filter(item => item !== productId);
            req.session.cart = cart;
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Product removed from cart', cartCount });
        }
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            const item = cart.items.find(item => item.product.toString() === productId);
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found in cart' });
            }

            item.quantity = quantity;
            await cart.save();
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Cart updated', cartCount });
        } else {
            // For non-logged-in users
            let cart = req.session.cart || { items: [] };
            const item = cart.items.find(item => item.product === productId);
            
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found in cart' });
            }

            item.quantity = quantity;
            req.session.cart = cart;
            const cartCount = cart.items.length;
            res.json({ success: true, message: 'Cart updated', cartCount });
        }
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 