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
            rating: parseInt(rating),
            title,
            comment,
            createdAt: new Date()
        });

        await review.save();
        console.log('Review saved successfully:', review);

        // Update product's reviews and average rating
        const product = await Product.findById(productId);
        if (!product.reviews) {
            product.reviews = [];
        }
        product.reviews.push(review._id);
        
        const reviews = await Review.find({ product: productId });
        product.averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await product.save();
        console.log('Product updated with new review:', product);

        // Return the newly created review with user data
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'name email');

        res.json({
            success: true,
            review: {
                _id: populatedReview._id,
                rating: populatedReview.rating,
                title: populatedReview.title,
                comment: populatedReview.comment,
                createdAt: populatedReview.createdAt,
                user: {
                    name: populatedReview.user.name || populatedReview.user.email,
                    email: populatedReview.user.email
                }
            }
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
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ product: productId });

        // Format the reviews for response
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            createdAt: review.createdAt,
            user: {
                name: review.user.name || review.user.email,
                email: review.user.email
            }
        }));

        res.json({
            success: true,
            reviews: formattedReviews,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({
            success: false,
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