import Product from '../models/Product.js';
import Promotion from '../models/Promotion.js';

export const getHomePage = async (req, res) => {
    try {
        // Get user's device type
        const userAgent = req.headers['user-agent'];
        const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
        
        // Get featured promotions
        const promotions = await Promotion.findFeatured(3);
        
        // Get new arrivals
        const newArrivals = await Product.findNewArrivals(6);
        
        // Get best sellers
        const bestSellers = await Product.findBestSellers(6);
        
        // Get featured products
        const featuredProducts = await Product.findFeatured(6);

        // Get categories with their product counts
        const categories = [
            { 
                id: 1, 
                name: "Fruits & Vegetables",
                icon: "fas fa-apple-alt",
                count: await Product.countDocuments({ 
                    category: 'Fruits & Vegetables',
                    status: 'ACTIVE'
                })
            },
            { 
                id: 2, 
                name: "Meat & Fish",
                icon: "fas fa-fish",
                count: await Product.countDocuments({ 
                    category: 'Meat & Fish',
                    status: 'ACTIVE'
                })
            },
            { 
                id: 3, 
                name: "Snacks",
                icon: "fas fa-cookie",
                count: await Product.countDocuments({ 
                    category: 'Snacks',
                    status: 'ACTIVE'
                })
            },
            { 
                id: 4, 
                name: "Beverages",
                icon: "fas fa-wine-bottle",
                count: await Product.countDocuments({ 
                    category: 'Beverages',
                    status: 'ACTIVE'
                })
            },
            { 
                id: 5, 
                name: "Beauty & Health",
                icon: "fas fa-heart",
                count: await Product.countDocuments({ 
                    category: 'Beauty & Health',
                    status: 'ACTIVE'
                })
            },
            { 
                id: 6, 
                name: "Bread & Bakery",
                icon: "fas fa-bread-slice",
                count: await Product.countDocuments({ 
                    category: 'Bread & Bakery',
                    status: 'ACTIVE'
                })
            }
        ];

        // Service features
        const features = [
            {
                id: 1,
                title: "Free Shipping",
                description: "Orders over $200",
                icon: "fas fa-truck"
            },
            {
                id: 2,
                title: "Quick Payment",
                description: "100% secure payment",
                icon: "fas fa-credit-card"
            },
            {
                id: 3,
                title: "24/7 Support",
                description: "Ready for you",
                icon: "fas fa-headset"
            }
        ];

        // Get trending searches
        const trendingSearches = [
            "Organic Fruits",
            "Fresh Vegetables",
            "Whole Grain Bread",
            "Healthy Snacks",
            "Natural Juice"
        ];

        res.render('index', {
            isMobile,
            promotions,
            newArrivals,
            bestSellers,
            featuredProducts,
            categories,
            features,
            trendingSearches,
            meta: {
                title: "ShopSphere - Your One-Stop Grocery Shop",
                description: "Shop fresh groceries, household essentials, and more with fast delivery and great prices.",
                keywords: "grocery, fresh food, organic, delivery, supermarket"
            }
        });
    } catch (error) {
        console.error('Error in getHomePage:', error);
        res.status(500).render('error', {
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
}; 