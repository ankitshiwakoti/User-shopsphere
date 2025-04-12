import express from 'express';
import { addReview, getProductReviews, updateReview, deleteReview } from '../controllers/reviewController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get product reviews
router.get('/product/:productId', getProductReviews);

// Add review (requires authentication)
router.post('/product/:productId', isAuthenticated, addReview);

// Update review (requires authentication)
router.put('/:reviewId', isAuthenticated, updateReview);

// Delete review (requires authentication)
router.delete('/:reviewId', isAuthenticated, deleteReview);

export default router; 