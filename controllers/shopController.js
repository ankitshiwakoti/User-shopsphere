import Product from '../models/Product.js';

// Get home page
export const getHomePage = async (req, res) => {
    try {
        // Fetch featured products
        const featuredProducts = await Product.find({ featured: true }).limit(8);

        // Fetch products on sale
        const saleProducts = await Product.find({ discount: { $gt: 0 } }).limit(8);

        res.render('home', {
            title: 'ShopSphere - Your Online Shopping Destination',
            featuredProducts,
            saleProducts
        });
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