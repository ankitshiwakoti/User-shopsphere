import express from 'express';
import {
    getWishlistPage,
    addToWishlist,
    removeFromWishlist
} from '../controllers/wishlistController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Web route - Get wishlist page
router.get('/', isAuthenticated, getWishlistPage);

// API routes
router.post('/add/:productId', isAuthenticated, addToWishlist);
router.delete('/remove/:productId', isAuthenticated, removeFromWishlist);

export default router; 