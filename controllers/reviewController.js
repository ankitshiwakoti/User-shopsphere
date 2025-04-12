import Review from '../models/Review.js';
import Product from '../models/Product.js';

export const addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user._id;

        console.log('Adding review:', { productId, userId, rating, title, comment });

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: userId
        });

        if (existingReview) {
            console.log('User has already reviewed this product');
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this product'
            });
        }

        // Create new review
        const review = new Review({
            product: productId,
            user: userId,
            rating,
            title,
            comment,
            verifiedPurchase: false
        });

        await review.save();
        console.log('Review saved successfully:', review);

        // Update product's reviews and average rating
        const product = await Product.findById(productId);
        product.reviews.push(review._id);
        
        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        product.averageRating = totalRating / reviews.length;
        
        await product.save();
        console.log('Product updated with new review:', product);

        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add review'
        });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ product: productId });

        res.json({
            success: true,
            reviews,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({
            error: 'Failed to get reviews'
        });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({
            _id: reviewId,
            user: userId
        });

        if (!review) {
            return res.status(404).json({
                error: 'Review not found'
            });
        }

        review.rating = rating;
        review.title = title;
        review.comment = comment;
        await review.save();

        // Update product's average rating
        await updateProductRating(review.product);

        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            error: 'Failed to update review'
        });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOne({
            _id: reviewId,
            user: userId
        });

        if (!review) {
            return res.status(404).json({
                error: 'Review not found'
            });
        }

        const productId = review.product;
        await review.remove();

        // Update product's average rating
        await updateProductRating(productId);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            error: 'Failed to delete review'
        });
    }
};

// Helper function to update product's average rating
async function updateProductRating(productId) {
    const reviews = await Review.find({ product: productId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length
    });
} 