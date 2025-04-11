import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Get wishlist page
export const getWishlistPage = async (req, res) => {
    try {
        let wishlist;
        if (req.user) {
            // For logged-in users
            wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items');
        } else {
            // For non-logged-in users, get wishlist from session
            wishlist = req.session.wishlist || { items: [] };
        }
            
        res.render('wishlist', { wishlist });
    } catch (error) {
        console.error('Error in getWishlistPage:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add item to wishlist
export const addToWishlist = async (req, res) => {
    try {
        // Get productId from either params or body
        const productId = req.params.productId || req.body.productId;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (req.user) {
            // For logged-in users
            let wishlist = await Wishlist.findOne({ user: req.user._id });
            if (!wishlist) {
                wishlist = new Wishlist({ user: req.user._id, items: [] });
            }

            // Check if product already in wishlist
            const isInWishlist = wishlist.items.some(item => item.toString() === productId);
            if (isInWishlist) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Product already in wishlist',
                    wishlistCount: wishlist.items.length
                });
            }

            wishlist.items.push(productId);
            await wishlist.save();
            const wishlistCount = wishlist.items.length;
            res.json({ success: true, message: 'Product added to wishlist', wishlistCount });
        } else {
            // For non-logged-in users
            if (!req.session.wishlist) {
                req.session.wishlist = { items: [] };
            }
            
            // Check if product already in wishlist
            const isInWishlist = req.session.wishlist.items.includes(productId);
            if (isInWishlist) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Product already in wishlist',
                    wishlistCount: req.session.wishlist.items.length
                });
            }

            req.session.wishlist.items.push(productId);
            const wishlistCount = req.session.wishlist.items.length;
            res.json({ success: true, message: 'Product added to wishlist', wishlistCount });
        }
    } catch (error) {
        console.error('Error in addToWishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        if (req.user) {
            // For logged-in users
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            if (!wishlist) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }

            wishlist.items = wishlist.items.filter(item => item.toString() !== productId);
            await wishlist.save();
            const wishlistCount = wishlist.items.length;
            res.json({ success: true, message: 'Product removed from wishlist', wishlistCount });
        } else {
            // For non-logged-in users
            if (!req.session.wishlist) {
                req.session.wishlist = { items: [] };
            }
            
            req.session.wishlist.items = req.session.wishlist.items.filter(item => item !== productId);
            const wishlistCount = req.session.wishlist.items.length;
            res.json({ success: true, message: 'Product removed from wishlist', wishlistCount });
        }
    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 