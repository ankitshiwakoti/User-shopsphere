import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

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
            search,
            page = 1,
            limit = 12
        } = req.query;

        // Build filter object
        const filter = { status: 'published' };

        // Add text search if search query exists
        if (search) {
            filter.$text = { $search: search };
        }

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
        if (search) {
            // If searching, sort by text score first
            sortObj = { score: { $meta: 'textScore' } };
        } else {
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
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // Get products
        let productsQuery = Product.find(filter);
        
        if (search) {
            productsQuery = productsQuery.select({ score: { $meta: 'textScore' } });
        }

        const products = await productsQuery
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('category');

        // Get all categories for sidebar
        const categories = await Product.distinct('category');

        res.render('products/index', {
            title: search ? `Search Results for "${search}" - ShopSphere` : 'All Products - ShopSphere',
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
        const productId = req.params.id;
        console.log('Fetching product with ID:', productId);
        
        // Find product and populate category and reviews
        const product = await Product.findById(productId)
            .populate('category')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'user',
                    select: 'name email'
                },
                match: { user: { $ne: null } },
                options: { 
                    sort: { createdAt: -1 }
                }
            });

        if (!product) {
            console.log(`Product not found with ID: ${productId}`);
            return res.status(404).render('product-details', {
                product: null,
                relatedProducts: []
            });
        }

        console.log('Main product details:', {
            name: product.name,
            stock: product.stock,
            category: product.category?.name,
            categoryId: product.category?._id
        });

        // Get related products (same category, in stock only)
        const relatedProductsQuery = {
            category: product.category._id,
            _id: { $ne: productId },
            status: 'published',
            stock: { $gt: 0 }  // Only fetch products that are in stock
        };

        console.log('Related products query:', JSON.stringify(relatedProductsQuery, null, 2));

        // First, check if there are any products in the same category
        const categoryProductCount = await Product.countDocuments({
            category: product.category._id,
            status: 'published'
        });

        console.log('Total products in category:', categoryProductCount);

        let relatedProducts = await Product.find(relatedProductsQuery)
            .populate('category')
            .select('name price images stock category')
            .limit(4);

        // Log detailed information about each related product
        console.log('Related Products found:', relatedProducts.length);
        relatedProducts.forEach(p => {
            console.log('Product details:', {
                name: p.name,
                stock: p.stock,
                id: p._id,
                category: p.category?.name,
                status: p.status,
                isInStock: p.stock > 0,
                stockType: typeof p.stock,
                stockValue: p.stock
            });
        });

        // If no related products found, try to find any products in stock
        if (relatedProducts.length === 0) {
            console.log('No related products found, searching for any in-stock products');
            const fallbackProducts = await Product.find({
                _id: { $ne: productId },
                status: 'published',
                stock: { $gt: 0 }
            })
            .populate('category')
            .select('name price images stock category')
            .limit(4);

            console.log('Fallback products found:', fallbackProducts.length);
            fallbackProducts.forEach(p => {
                console.log('Fallback product details:', {
                    name: p.name,
                    stock: p.stock,
                    id: p._id,
                    category: p.category?.name,
                    status: p.status,
                    isInStock: p.stock > 0,
                    stockType: typeof p.stock,
                    stockValue: p.stock
                });
            });

            // Use fallback products if available
            if (fallbackProducts.length > 0) {
                relatedProducts = fallbackProducts;
            }
        }

        // Convert products to plain objects to ensure proper serialization
        const plainRelatedProducts = relatedProducts.map(p => p.toObject());
        console.log('Final related products after conversion:', plainRelatedProducts.map(p => ({
            name: p.name,
            stock: p.stock,
            isInStock: p.stock > 0
        })));

        // Calculate rating breakdown
        const ratingBreakdown = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        if (product.reviews && product.reviews.length > 0) {
            product.reviews.forEach(review => {
                if (review.rating >= 1 && review.rating <= 5) {
                    ratingBreakdown[review.rating]++;
                }
            });
        }

        // Calculate average rating
        const totalReviews = product.reviews ? product.reviews.length : 0;
        const averageRating = totalReviews > 0 
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

        res.render('product-details', {
            product: {
                ...product.toObject(),
                ratingBreakdown,
                averageRating: averageRating.toFixed(1)
            },
            relatedProducts: plainRelatedProducts,
            user: req.user,
            locals: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).render('product-details', {
            product: null,
            relatedProducts: [],
            error: 'Error fetching product details. Please try again later.'
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

// Search products
export const searchProducts = async (req, res) => {
    // Only accept AJAX requests
    if (!req.xhr && !req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request type'
        });
    }

    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        // Create search pipeline
        const searchPipeline = [
            {
                $search: {
                    index: "default",
                    compound: {
                        should: [
                            {
                                // Search in product name with highest priority
                                text: {
                                    query: q,
                                    path: "name",
                                    score: { boost: { value: 5 } },
                                    fuzzy: { maxEdits: 1 }
                                }
                            },
                            {
                                // Search in description
                                text: {
                                    query: q,
                                    path: "description",
                                    score: { boost: { value: 3 } },
                                    fuzzy: { maxEdits: 2 }
                                }
                            },
                            {
                                // Search in short description
                                text: {
                                    query: q,
                                    path: "shortDescription",
                                    score: { boost: { value: 4 } },
                                    fuzzy: { maxEdits: 2 }
                                }
                            }
                        ],
                        minimumShouldMatch: 1
                    }
                }
            },
            {
                $match: {
                    status: 'published'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $facet: {
                    // Main search results
                    searchResults: [
                        { $limit: 20 }
                    ],
                    // Category suggestions
                    categoryMatches: [
                        {
                            $group: {
                                _id: '$category._id',
                                category: { $first: '$category.name' },
                                count: { $sum: 1 }
                            }
                        },
                        { $limit: 5 }
                    ],
                    // Related products (products in the same categories as search results)
                    relatedProducts: [
                        {
                            $group: {
                                _id: '$category._id',
                                categoryId: { $first: '$category._id' }
                            }
                        },
                        {
                            $lookup: {
                                from: 'products',
                                let: { categoryId: '$categoryId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ['$category', '$$categoryId'] },
                                            status: 'published'
                                        }
                                    },
                                    { $limit: 4 }
                                ],
                                as: 'related'
                            }
                        },
                        { $unwind: '$related' },
                        { $replaceRoot: { newRoot: '$related' } },
                        { $limit: 8 }
                    ]
                }
            }
        ];

        const [results] = await Product.aggregate(searchPipeline);

        // Format the response
        const formattedResults = {
            success: true,
            products: results.searchResults.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 
                    ? (product.images.find(img => img.isMain)?.url || product.images[0]?.url)
                    : null,
                category: product.category?.name || '',
                averageRating: product.averageRating || 0,
                url: `/products/${product._id}`,
                shortDescription: product.shortDescription
            })),
            categories: results.categoryMatches.map(cat => ({
                id: cat._id,
                name: cat.category,
                count: cat.count,
                url: `/shop?category=${cat._id}`
            })),
            relatedProducts: results.relatedProducts.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 
                    ? (product.images.find(img => img.isMain)?.url || product.images[0]?.url)
                    : null,
                category: product.category?.name || '',
                url: `/products/${product._id}`
            }))
        };

        // Send JSON response
        res.setHeader('Content-Type', 'application/json');
        return res.json(formattedResults);
    } catch (error) {
        console.error('Error searching products:', error);
        // Send JSON error response
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error searching products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 