import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Wishlist from '../models/Wishlist.js';
import mongoose from 'mongoose';

// Get home page
export const getHomePage = async (req, res) => {
    try {
        // Initialize activeCategory
        let activeCategory = null;

        // Get filter parameters from query
        const categoryIds = req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) : [];
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 1000;

        // Build the query
        let query = { status: 'published' };

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
        if (minPrice > 0 || maxPrice < 1000) {
            query.price = {};
            if (minPrice > 0) {
                query.price.$gte = minPrice;
            }
            if (maxPrice < 1000) {
                query.price.$lte = maxPrice;
            }
        }

        // Log the query for debugging
        console.log('Product query:', JSON.stringify(query));

        // Fetch products based on query
        let products = await Product.find(query)
            .populate('category')
            .sort({ createdAt: -1 });

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

        // Log the number of products found
        console.log(`Found ${products.length} products matching the criteria`);

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
            activeCategory: activeCategory || null, // Ensure it's explicitly set to null if undefined
            filters: {
                minPrice,
                maxPrice,
                inStock: false,
                onSale: false,
                sort: 'newest',
                categories: categoryIds || [] // Ensure categories is always an array
            },
            pagination: {
                page: 1,
                limit: 20,
                total: products.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        res.render('shop', viewData);
    } catch (error) {
        console.error('Error fetching home page data:', error);
        res.status(500).render('error', {
            message: 'Error loading home page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get shop page with all categories
export const getShopPage = async (req, res) => {
    try {
        const { category, sort = 'newest', page = 1 } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (category) {
            query.category = category;
        }

        // Build sort options
        let sortOptions = {};
        switch (sort) {
            case 'price-low':
                sortOptions = { price: 1 };
                break;
            case 'price-high':
                sortOptions = { price: -1 };
                break;
            case 'name-asc':
                sortOptions = { name: 1 };
                break;
            case 'name-desc':
                sortOptions = { name: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // Get products
        const products = await Product.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Product.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Get all categories
        const categories = await Product.distinct('category');

        res.render('shop', {
            title: 'Shop - ShopSphere',
            products,
            categories,
            currentCategory: category,
            currentSort: sort,
            currentPage: page,
            totalPages: pages,
            total
        });
    } catch (error) {
        console.error('Error fetching shop page:', error);
        res.status(500).render('error', {
            message: 'Error loading shop page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get beverages category page
export const getBeveragesPage = async (req, res) => {
    try {
        const beverages = await Product.find({ category: 'Beverages' });

        res.render('categories/beverages', {
            title: 'Beverages - ShopSphere',
            products: beverages
        });
    } catch (error) {
        console.error('Error fetching beverages:', error);
        res.status(500).render('error', {
            message: 'Error fetching beverages',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get fruits and vegetables category page
export const getFruitsAndVegetablesPage = async (req, res) => {
    try {
        const products = await Product.find({ category: 'Fruits & Vegetables' });

        res.render('categories/fruits-vegetables', {
            title: 'Fruits & Vegetables - ShopSphere',
            products
        });
    } catch (error) {
        console.error('Error fetching fruits and vegetables:', error);
        res.status(500).render('error', {
            message: 'Error fetching fruits and vegetables',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get trending products page
export const getTrendingPage = async (req, res) => {
    try {
        const trendingProducts = await Product.find({ trending: true })
            .sort({ views: -1 })
            .limit(12);

        res.render('trending', {
            title: 'Trending Products - ShopSphere',
            products: trendingProducts
        });
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).render('error', {
            message: 'Error fetching trending products',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get almost finished products page
export const getAlmostFinishedPage = async (req, res) => {
    try {
        const almostFinished = await Product.find({ stock: { $lte: 10, $gt: 0 } })
            .sort({ stock: 1 })
            .limit(12);

        res.render('almost-finished', {
            title: 'Almost Finished Products - ShopSphere',
            products: almostFinished
        });
    } catch (error) {
        console.error('Error fetching almost finished products:', error);
        res.status(500).render('error', {
            message: 'Error fetching almost finished products',
            error: process.env.NODE_ENV === 'development' ? error : {}
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
        const discountedPrice = product.price * (1 - discount / 100);

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