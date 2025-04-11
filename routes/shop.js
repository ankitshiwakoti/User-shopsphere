import express from 'express';
import { getShopPage, getProductDetails } from '../controllers/shopController.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', getShopPage);

// Product details route
router.get('/product/:id', getProductDetails);

// API endpoint for paginated products
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Products per page
        const skip = (page - 1) * limit;
        
        // Get total count of published products
        const totalProducts = await Product.countDocuments({ status: 'published' });
        
        // Get published products for current page with populated category
        const products = await Product.find({ status: 'published' })
            .populate('category', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        // Check if this is the last page
        const isLastPage = skip + products.length >= totalProducts;
        
        res.json({
            products,
            isLastPage,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        console.error('Error fetching paginated products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router; 