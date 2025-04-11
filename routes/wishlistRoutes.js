import express from 'express';
import {
    getWishlistPage,
    addToWishlist,
    removeFromWishlist
} from '../controllers/wishlistController.js';
import { isAuthenticated } from '../middleware/auth.js';
import Wishlist from '../models/Wishlist.js';

const router = express.Router();

// Web route - Get wishlist page
router.get('/', getWishlistPage);

// API routes
router.post('/add', addToWishlist);
router.post('/add/:productId', addToWishlist); // Keep for backward compatibility
router.delete('/remove/:productId', removeFromWishlist);

// Get wishlist count
router.get('/count', async (req, res) => {
    try {
        let wishlistCount = 0;
        
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            wishlistCount = wishlist ? wishlist.items.length : 0;
        } else {
            wishlistCount = req.session.wishlist?.items?.length || 0;
        }
        
        res.json({
            success: true,
            wishlistCount
        });
    } catch (error) {
        console.error('Error getting wishlist count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get wishlist items
router.get('/items', async (req, res) => {
    try {
        let items = [];
        const isLoggedIn = !!req.user;
        
        if (isLoggedIn) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            if (wishlist) {
                items = wishlist.items.map(item => item.toString());
            }
        } else {
            items = req.session.wishlist?.items || [];
        }
        
        res.json({
            success: true,
            items,
            isLoggedIn
        });
    } catch (error) {
        console.error('Error getting wishlist items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router; 