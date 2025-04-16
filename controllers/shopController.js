import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Wishlist from '../models/Wishlist.js';
import mongoose from 'mongoose';

export const getShopPage = async (req, res) => {
    try {
        // Initialize activeCategory
        let activeCategory = null;
        
        // Get filter parameters from query
        const categoryIds = req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) : [];
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 0;
        const searchQuery = req.query.search || '';
        const sortBy = req.query.sort || 'newest';
        const page = parseInt(req.query.page) || 1;
        const limit = 100; // Products per page
        
        // Get the highest price in the database
        const highestPriceProduct = await Product.findOne({ status: 'published' })
            .sort({ price: -1 })
            .select('price');
        
        const maxPriceLimit = highestPriceProduct ? highestPriceProduct.price : 1000;
        const currentMaxPrice = maxPrice || maxPriceLimit;

        // Build the query
        let query = { status: 'published' };
        
        // Add search query if provided
        if (searchQuery) {
            query.$text = { $search: searchQuery };
        }
        
        // Fetch all categories and organize them
        const allCategories = await Category.find({ status: 'active' }).populate('parent');
        
        // Create a map of parent categories and their child categories
        const parentChildMap = new Map();
        allCategories.forEach(category => {
            if (category.parent) {
                const parentId = category.parent._id.toString();
                if (!parentChildMap.has(parentId)) {
                    parentChildMap.set(parentId, []);
                }
                parentChildMap.get(parentId).push(category._id.toString());
            }
        });
        
        // Add category filter if categories are selected
        if (categoryIds.length > 0) {
            // Filter out invalid category IDs
            const validCategoryIds = categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id));
            
            if (validCategoryIds.length > 0) {
                // Create a set to store all category IDs to include (parent + children)
                const allCategoryIdsToInclude = new Set();
                
                // For each selected category
                validCategoryIds.forEach(categoryId => {
                    // Add the selected category
                    allCategoryIdsToInclude.add(categoryId);
                    
                    // Check if this is a parent category
                    if (parentChildMap.has(categoryId)) {
                        // Add all child categories
                        parentChildMap.get(categoryId).forEach(childId => {
                            allCategoryIdsToInclude.add(childId);
                        });
                    }
                });
                
                // Convert the set to an array for the query
                query.category = { $in: Array.from(allCategoryIdsToInclude) };
            }
        }

        // Add price filter - only add if minPrice or maxPrice is provided
        if (minPrice > 0 || currentMaxPrice < maxPriceLimit) {
            query.price = {};
            if (minPrice > 0) {
                query.price.$gte = minPrice;
            }
            if (currentMaxPrice < maxPriceLimit) {
                query.price.$lte = currentMaxPrice;
            }
        }

        // Determine sort order
        let sortOptions = {};
        switch (sortBy) {
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            case 'price-low':
                sortOptions = { price: 1 };
                break;
            case 'price-high':
                sortOptions = { price: -1 };
                break;
            case 'popular':
                sortOptions = { salesCount: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // If there's a search query, add text score to sort options
        if (searchQuery) {
            sortOptions = { score: { $meta: "textScore" }, ...sortOptions };
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get total count of products matching the query
        const totalProducts = await Product.countDocuments(query);

        // Fetch products based on query with pagination
        let products = await Product.find(query)
            .populate('category')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        
        // If user is logged in, check which products are in their wishlist
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            const wishlistItems = wishlist ? wishlist.items.map(item => item.toString()) : [];
            
            // Add isInWishlist property to each product
            products = products.map(product => {
                const productObj = product.toObject();
                productObj.isInWishlist = wishlistItems.includes(product._id.toString());
                return productObj;
            });
        }

        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // If this is an API request (for infinite scroll)
        if (req.path === '/api/products') {
            return res.json({
                products,
                isLastPage: !hasNextPage,
                currentPage: page,
                totalPages,
                totalProducts
            });
        }

        // For regular page load, continue with the rest of the code...
        
        // Organize categories into a tree structure
        const categoryTree = [];
        const categoryMap = new Map();

        // First pass: create category objects and add them to the map
        allCategories.forEach(category => {
            categoryMap.set(category._id.toString(), {
                ...category.toObject(),
                children: []
            });
        });

        // Second pass: build the tree structure
        allCategories.forEach(category => {
            const categoryObj = categoryMap.get(category._id.toString());
            if (category.parent) {
                const parentObj = categoryMap.get(category.parent._id.toString());
                if (parentObj) {
                    parentObj.children.push(categoryObj);
                }
            } else {
                categoryTree.push(categoryObj);
            }
        });

        // Get all selected categories' details
        const activeCategories = await Category.find({
            _id: { $in: categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id)) }
        });

        // Set activeCategory for breadcrumb (use the first selected category if multiple)
        if (activeCategories.length > 0) {
            activeCategory = activeCategories[0];
        }

        // Static data for filters
        const brands = ['Fresh', 'Organic', 'Natural'];
        const colors = ['Green', 'Red', 'Yellow', 'Orange'];

        // Ensure activeCategory is properly defined for the view
        const viewData = {
            products,
            categories: categoryTree,
            brands,
            colors,
            activeCategories,
            activeCategory: activeCategory || null,
            filters: {
                minPrice,
                maxPrice: currentMaxPrice,
                maxPriceLimit,
                inStock: false,
                onSale: false,
                sort: sortBy,
                categories: categoryIds || [],
                search: searchQuery
            },
            pagination: {
                page: page,
                limit: limit,
                total: totalProducts,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage
            }
        };

        res.render('shop', viewData);
    } catch (error) {
        console.error('Error in getShopPage:', error);
        res.status(500).render('error', {
            message: 'Failed to load shop page',
            error: {}
        });
    }
};

export const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        console.log('Fetching product with ID:', productId);
        
        // Find the product without population first
        const product = await Product.findOne({ 
            _id: productId,
            status: 'published'
        });
        
        if (!product) {
            console.log(`Product not found with ID: ${productId}`);
            return res.status(404).render('product-details', {
                product: null,
                relatedProducts: []
            });
        }
        
        // Log the raw product data
        console.log('Product found:', product.name);
        console.log('Product category ID:', product.category);
        
        // Fetch the category separately
        let category = null;
        let parentCategory = null;
        
        if (product.category) {
            try {
                // Fetch the category with its parent
                category = await Category.findById(product.category).populate('parent');
                console.log('Category found in database:', category ? category.name : 'Not found');
                
                // If the category has a parent, fetch it
                if (category && category.parent) {
                    parentCategory = category.parent;
                    console.log('Parent category found:', parentCategory.name);
                }
            } catch (categoryError) {
                console.error('Error fetching category:', categoryError);
            }
        }
        
        // Create a category object for the product
        const categoryObj = category ? {
            _id: category._id,
            name: category.name,
            parent: parentCategory ? {
                _id: parentCategory._id,
                name: parentCategory.name
            } : null
        } : {
            _id: product.category || 'unknown',
            name: 'Uncategorized',
            parent: null
        };
        
        // Attach the category object to the product
        product.category = categoryObj;

        // Get related products (same category, published only)
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            status: 'published'
        })
        .limit(4)
        .select('name price images shortDescription');

        // Calculate fixed discount (15%)
        const discount = 15;
        const discountedPrice = product.price * (1 - discount/100);

        // Convert product to plain object
        const productObj = product.toObject();
        
        // Ensure category is properly included in the plain object
        if (!productObj.category && product.category) {
            productObj.category = {
                _id: product.category._id,
                name: product.category.name,
                parent: product.category.parent
            };
        }

        // Prepare the data for the view
        const viewData = {
            title: `${product.name} - ShopSphere`,
            product: {
                ...productObj,
                discount,
                discountedPrice,
                // Explicitly set the category to ensure it's properly formatted
                category: {
                    _id: categoryObj._id,
                    name: categoryObj.name,
                    parent: categoryObj.parent
                }
            },
            relatedProducts: relatedProducts.map(p => p.toObject())
        };

        // Log the final data being sent to the view
        console.log('Final product category being sent to view:', viewData.product.category);

        res.render('product-details', viewData);
    } catch (error) {
        console.error('Error in getProductDetails:', error);
        res.status(500).render('product-details', {
            product: null,
            relatedProducts: [],
            error: 'Error fetching product details. Please try again later.'
        });
    }
};

// Search products
export const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            });
        }

        // Use text search with the weighted index
        const products = await Product.find(
            { 
                $text: { $search: query },
                status: 'published'
            },
            { 
                score: { $meta: "textScore" } 
            }
        )
        .sort({ score: { $meta: "textScore" } })
        .populate('category');

        // If user is logged in, check which products are in their wishlist
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            const wishlistItems = wishlist ? wishlist.items.map(item => item.toString()) : [];
            
            // Add isInWishlist property to each product
            products.forEach(product => {
                product.isInWishlist = wishlistItems.includes(product._id.toString());
            });
        }

        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error searching products' 
        });
    }
}; 