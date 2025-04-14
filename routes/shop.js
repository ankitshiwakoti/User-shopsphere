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

// GET /api/shop/products - Get paginated products with search and filters
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const category = req.query.category;
        const minPrice = parseFloat(req.query.minPrice);
        const maxPrice = parseFloat(req.query.maxPrice);
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        // Build filter object
        const filter = { status: 'published' };
        
        // Enhanced search functionality
        if (search) {
            // Split search terms and create a case-insensitive regex pattern
            const searchTerms = search.split(/\s+/).map(term => 
                term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            );
            
            // Create a regex pattern that matches any of the search terms
            const searchPattern = new RegExp(searchTerms.join('|'), 'i');
            
            // First try to find exact category match
            const categoryMatch = await Product.findOne({ 
                category: { $regex: new RegExp(`^${search}$`, 'i') },
                status: 'published'
            });

            if (categoryMatch) {
                // If exact category match found, filter by category
                filter.category = categoryMatch.category;
            } else {
                // Otherwise search across all fields
                filter.$or = [
                    { name: { $regex: searchPattern } },
                    { description: { $regex: searchPattern } },
                    { shortDescription: { $regex: searchPattern } },
                    { category: { $regex: searchPattern } },
                    { 'attributes.color': { $regex: searchPattern } },
                    { 'attributes.size': { $regex: searchPattern } }
                ];
            }
        }

        // Add category filter if provided (this takes precedence over search category)
        if (category) {
            filter.category = category;
        }

        // Add price range filter if provided
        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            filter.price = {};
            if (!isNaN(minPrice)) filter.price.$gte = minPrice;
            if (!isNaN(maxPrice)) filter.price.$lte = maxPrice;
        }

        // Build sort object
        const sort = {};
        if (search) {
            // Sort by relevance when searching
            sort.name = 1; // Sort alphabetically by name
        } else {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        const skip = (page - 1) * limit;

        // Get products with filters and sorting
        const [products, total] = await Promise.all([
            Product.find(filter)
                .select('name price images category shortDescription status attributes')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            searchValue: search // Return the search value to maintain it in the frontend
        });
    } catch (error) {
        console.error('Error in shop products route:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

export default router; 