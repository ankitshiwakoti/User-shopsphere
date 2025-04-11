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
        // Get productId from either params or body for backward compatibility
        const productId = req.params.productId || req.body.productId;
        const quantity = parseInt(req.body.quantity) || 1; // Default to 1 if not specified

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product has enough stock
        if (product.stock < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not enough stock available'
            });
        }

        if (req.user) {
            // For logged-in users
            let cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                cart = new Cart({ 
                    user: req.user._id, 
                    items: []
                });
            }

            // Check if product is already in cart
            const existingItemIndex = cart.items.findIndex(item => 
                item.product && item.product.toString() === productId
            );
            
            if (existingItemIndex > -1) {
                // Product exists, increase quantity
                cart.items[existingItemIndex].quantity += quantity;
                
                // Check if the new quantity exceeds stock
                if (cart.items[existingItemIndex].quantity > product.stock) {
                    cart.items[existingItemIndex].quantity = product.stock;
                }
                
                await cart.save();
                
                return res.json({ 
                    success: true, 
                    message: 'Product quantity updated in cart',
                    cartCount: cart.items.length 
                });
            }

            // Add new product to cart
            cart.items.push({
                product: productId,
                quantity: quantity
            });
            
            await cart.save();
            
            res.json({ 
                success: true, 
                message: 'Product added to cart', 
                cartCount: cart.items.length 
            });
        } else {
            // For non-logged-in users
            if (!req.session.cart) {
                req.session.cart = { items: [] };
            }
            
            // Check if product is already in cart
            const existingItemIndex = req.session.cart.items.findIndex(item => 
                item.productId === productId
            );
            
            if (existingItemIndex > -1) {
                // Product exists, increase quantity
                req.session.cart.items[existingItemIndex].quantity += quantity;
                
                // Check if the new quantity exceeds stock
                if (req.session.cart.items[existingItemIndex].quantity > product.stock) {
                    req.session.cart.items[existingItemIndex].quantity = product.stock;
                }
                
                return res.json({ 
                    success: true, 
                    message: 'Product quantity updated in cart',
                    cartCount: req.session.cart.items.length 
                });
            }

            // Add new product to cart
            req.session.cart.items.push({
                productId: productId,
                quantity: quantity,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0].url : null
            });
            
            res.json({ 
                success: true, 
                message: 'Product added to cart', 
                cartCount: req.session.cart.items.length 
            });
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

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            // Remove item where item.product matches productId
            cart.items = cart.items.filter(item => 
                !item.product || item.product.toString() !== productId
            );
            
            await cart.save();
            
            res.json({ 
                success: true, 
                message: 'Product removed from cart', 
                cartCount: cart.items.length 
            });
        } else {
            // For non-logged-in users
            if (!req.session.cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }
            
            // Remove item where item.productId matches productId
            req.session.cart.items = req.session.cart.items.filter(item => 
                item.productId !== productId
            );
            
            res.json({ 
                success: true, 
                message: 'Product removed from cart', 
                cartCount: req.session.cart.items.length 
            });
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
        const quantity = parseInt(req.body.quantity) || 1;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product has enough stock
        if (product.stock < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not enough stock available' 
            });
        }

        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            // Find the item in the cart
            const itemIndex = cart.items.findIndex(item => 
                item.product && item.product.toString() === productId
            );
            
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found in cart' });
            }

            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            
            await cart.save();
            
            res.json({ 
                success: true, 
                message: 'Cart updated', 
                cartCount: cart.items.length 
            });
        } else {
            // For non-logged-in users
            if (!req.session.cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }
            
            // Find the item in the cart
            const itemIndex = req.session.cart.items.findIndex(item => 
                item.productId === productId
            );
            
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found in cart' });
            }

            // Update quantity
            req.session.cart.items[itemIndex].quantity = quantity;
            
            res.json({ 
                success: true, 
                message: 'Cart updated', 
                cartCount: req.session.cart.items.length 
            });
        }
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 