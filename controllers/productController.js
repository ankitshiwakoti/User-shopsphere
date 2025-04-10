import Product from '../models/Product.js';

// Get all products with filters
export const getProducts = async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            sort,
            onSale,
            inStock,
            organic,
            page = 1,
            limit = 12
        } = req.query;

        // Build filter object
        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        if (onSale === 'true') {
            filter.discount = { $gt: 0 };
        }

        if (inStock === 'true') {
            filter.stock = { $gt: 0 };
        }

        if (organic === 'true') {
            filter.badges = 'ORGANIC';
        }

        // Build sort object
        let sortObj = {};
        switch (sort) {
            case 'price_asc':
                sortObj = { price: 1 };
                break;
            case 'price_desc':
                sortObj = { price: -1 };
                break;
            case 'name_asc':
                sortObj = { name: 1 };
                break;
            case 'name_desc':
                sortObj = { name: -1 };
                break;
            default:
                sortObj = { createdAt: -1 }; // Default sort by newest
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // Get products
        const products = await Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        // Get all categories for sidebar
        const categories = await Product.distinct('category');

        res.render('products/index', {
            title: 'All Products - ShopSphere',
            products,
            categories,
            currentPage: page,
            totalPages,
            total,
            query: req.query
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('error', {
            message: 'Error fetching products',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get single product
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', {
                message: 'Product not found',
                error: {}
            });
        }
        res.render('product-details', {
            title: `${product.name} - ShopSphere`,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).render('error', {
            message: 'Error fetching product details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Create product (admin only)
export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update product (admin only)
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

export const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).render('error', {
                message: 'Product not found'
            });
        }

        // Get related products (same category)
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId }
        }).limit(4);

        // Calculate rating breakdown
        const ratingBreakdown = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        product.reviews.forEach(review => {
            ratingBreakdown[review.rating]++;
        });

        res.render('product-details', {
            product: {
                ...product.toObject(),
                ratingBreakdown
            },
            relatedProducts
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).render('error', {
            message: 'Error fetching product details'
        });
    }
}; 