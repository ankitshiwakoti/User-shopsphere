import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Get wishlist page
export const getWishlistPage = async (req, res) => {
    try {
        let wishlistItems = [];
        
        if (req.user) {
            // If user is logged in, get wishlist from database
            const wishlist = await Wishlist.findOne({ user: req.user._id })
                .populate({
                    path: 'items',
                    select: 'name price images description stock category'
                });
            
            if (wishlist) {
                wishlistItems = wishlist.items;
            }
        } else {
            // If guest user, get wishlist from session
            const sessionWishlist = req.session.wishlist || [];
            if (sessionWishlist.length > 0) {
                const productIds = sessionWishlist.map(item => item.productId);
                const products = await Product.find({ _id: { $in: productIds } })
                    .select('name price images description stock category');
                wishlistItems = products;
            }
        }

        res.render('wishlist', {
            title: 'My Wishlist',
            wishlist: {
                items: wishlistItems
            }
        });
    } catch (error) {
        console.error('Error getting wishlist:', error);
        req.flash('error', 'Error loading wishlist');
        res.redirect('/');
    }
};

// Add item to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        // Check if product is already in wishlist
        const isProductInWishlist = wishlist.items.some(item => item.toString() === productId);
        if (isProductInWishlist) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product is already in wishlist',
                wishlistCount: wishlist.items.length 
            });
        }

        // Add product to wishlist
        wishlist.items.push(productId);
        await wishlist.save();

        // Return success with updated wishlist count
        res.json({ 
            success: true, 
            message: 'Product added to wishlist',
            wishlistCount: wishlist.items.length
        });

    } catch (error) {
        console.error('Error in addToWishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({ 
                success: false, 
                message: 'Wishlist not found',
                wishlistCount: 0 
            });
        }

        // Check if product is in wishlist
        const productIndex = wishlist.items.findIndex(item => item.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found in wishlist',
                wishlistCount: wishlist.items.length 
            });
        }

        // Remove product from wishlist
        wishlist.items.splice(productIndex, 1);
        await wishlist.save();

        // Return success with updated wishlist count
        res.json({ 
            success: true, 
            message: 'Product removed from wishlist',
            wishlistCount: wishlist.items.length
        });

    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 