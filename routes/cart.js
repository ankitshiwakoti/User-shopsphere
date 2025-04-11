import express from 'express';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

const router = express.Router();

// View cart (web route)
router.get('/', async (req, res) => {
    try {
        let cartItems = [];
        
        if (req.user) {
            // For logged-in users, get cart from database
            const cart = await Cart.findOne({ user: req.user._id }).populate('items');
            if (cart && cart.items) {
                // Map populated items to the format expected by the template
                cartItems = cart.items.map(item => ({
                    _id: item._id,
                    quantity: 1, // Default quantity, adjust as needed
                    product: item
                }));
            }
        } else {
            // For non-logged-in users, get cart from session
            if (req.session.cart && req.session.cart.items) {
                cartItems = req.session.cart.items.map(item => ({
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
            }
        }

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
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).render('error', { 
            message: 'Error loading cart',
            error: {}
        });
    }
});

// API routes
// Add item to cart - accept both formats for backward compatibility
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

        let cartCount = 0;

        if (req.user) {
            // For logged-in users, use database cart
            let cart = await Cart.findOne({ user: req.user._id });
            
            if (!cart) {
                // Create new cart if it doesn't exist
                cart = new Cart({ 
                    user: req.user._id, 
                    items: [] 
                });
            }

            // Check if product already in cart (compare as strings)
            const alreadyInCart = cart.items.some(item => item.toString() === productId);
            if (!alreadyInCart) {
                cart.items.push(productId);
                await cart.save();
            }
            
            cartCount = cart.items.length;
        } else {
            // For non-logged-in users, use session cart
            if (!req.session.cart) {
                req.session.cart = { items: [] };
            }

            // Check if product already in cart based on productId
            const existingItem = req.session.cart.items.find(item => item.productId === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                req.session.cart.items.push({
                    productId,
                    quantity,
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0].url : null
                });
            }
            
            cartCount = req.session.cart.items.length;
        }

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

// Also support the older format with productId in URL for backward compatibility
router.post('/add/:productId', async (req, res) => {
    req.body.productId = req.params.productId;
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

        let cartCount = 0;

        if (req.user) {
            // For logged-in users, use database cart
            let cart = await Cart.findOne({ user: req.user._id });
            
            if (!cart) {
                // Create new cart if it doesn't exist
                cart = new Cart({ 
                    user: req.user._id, 
                    items: [] 
                });
            }

            // Check if product already in cart (compare as strings)
            const alreadyInCart = cart.items.some(item => item.toString() === productId);
            if (!alreadyInCart) {
                cart.items.push(productId);
                await cart.save();
            }
            
            cartCount = cart.items.length;
        } else {
            // For non-logged-in users, use session cart
            if (!req.session.cart) {
                req.session.cart = { items: [] };
            }

            // Check if product already in cart based on productId
            const existingItem = req.session.cart.items.find(item => item.productId === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                req.session.cart.items.push({
                    productId,
                    quantity,
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0].url : null
                });
            }
            
            cartCount = req.session.cart.items.length;
        }

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
router.delete('/remove/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        let cartCount = 0;

        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id });
            if (cart) {
                cart.items = cart.items.filter(item => item.toString() !== productId);
                await cart.save();
                cartCount = cart.items.length;
            }
        } else {
            // For non-logged-in users
            if (req.session.cart && req.session.cart.items) {
                req.session.cart.items = req.session.cart.items.filter(item => item.productId !== productId);
                cartCount = req.session.cart.items.length;
            }
        }

        res.json({
            success: true,
            message: 'Product removed from cart',
            cartCount
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing product from cart'
        });
    }
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

        let cartCount = 0;

        if (req.user) {
            // For logged-in users, database cart update
            // This requires changing the Cart model to support quantities
            // For now, we'll just update presence in cart
            const cart = await Cart.findOne({ user: req.user._id });
            if (cart) {
                // We would need to modify the Cart model to store quantity
                // For now, just ensure the item is in the cart
                if (!cart.items.includes(productId)) {
                    cart.items.push(productId);
                    await cart.save();
                }
                cartCount = cart.items.length;
            }
        } else {
            // For non-logged-in users, session cart update
            if (req.session.cart && req.session.cart.items) {
                const itemIndex = req.session.cart.items.findIndex(item => item.productId === productId);
                
                if (itemIndex > -1) {
                    req.session.cart.items[itemIndex].quantity = quantity;
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'Item not found in cart'
                    });
                }
                
                cartCount = req.session.cart.items.length;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }
        }

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
router.get('/summary', async (req, res) => {
    try {
        let cartItems = [];
        
        if (req.user) {
            // For logged-in users
            const cart = await Cart.findOne({ user: req.user._id }).populate('items');
            if (cart && cart.items) {
                cartItems = cart.items.map(item => ({
                    productId: item._id,
                    price: item.price,
                    quantity: 1 // Default quantity
                }));
            }
        } else {
            // For non-logged-in users
            cartItems = req.session.cart?.items || [];
        }
        
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