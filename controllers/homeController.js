import Product from '../models/Product.js';
import Promotion from '../models/Promotion.js';
import Category from '../models/Category.js';

// Helper function to organize categories into a tree structure
const organizeCategoriesIntoTree = (categories) => {
    const categoryMap = {};
    const rootCategories = [];

    // First, map all categories by their ID
    categories.forEach(category => {
        categoryMap[category._id.toString()] = {
            ...category.toObject(),
            children: []
        };
    });

    // Then, build the tree structure
    categories.forEach(category => {
        const categoryId = category._id.toString();
        const categoryWithChildren = categoryMap[categoryId];

        if (category.parent) {
            const parentId = category.parent.toString();
            if (categoryMap[parentId]) {
                categoryMap[parentId].children.push(categoryWithChildren);
            }
        } else {
            rootCategories.push(categoryWithChildren);
        }
    });

    return rootCategories;
};

export const getHomePage = async (req, res) => {
    try {
        // Get user's device type
        const userAgent = req.headers['user-agent'];
        const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
        
        // Get all categories and organize them into a tree
        const allCategories = await Category.find({ status: 'active' }).populate('parent');
        
        // Create a map of parent categories and their subcategories
        const categoryMap = new Map();
        allCategories.forEach(category => {
            if (category.parent) {
                const parentId = category.parent._id.toString();
                if (!categoryMap.has(parentId)) {
                    categoryMap.set(parentId, []);
                }
                categoryMap.set(parentId, [...categoryMap.get(parentId), category]);
            }
        });

        // Filter root categories (those without parents)
        const rootCategories = allCategories.filter(category => !category.parent);
        
        // Add hasParent flag to each category
        const processedCategories = allCategories.map(category => ({
            ...category.toObject(),
            hasParent: !!category.parent,
            parentId: category.parent ? category.parent._id : null,
            subcategories: categoryMap.get(category._id.toString()) || []
        }));
        
        // Get featured promotions
        let promotions = [];
        try {
            promotions = await Promotion.findFeatured(3);
        } catch (error) {
            console.error('Error fetching promotions:', error);
            promotions = [
                {
                    title: 'Weekend Special',
                    description: 'Get up to 50% off on selected items',
                    image: '/images/promos/banner1.jpg',
                    link: '/shop'
                },
                {
                    title: 'Fresh Produce',
                    description: 'Fresh fruits and vegetables at great prices',
                    image: '/images/promos/banner-02.jpg',
                    link: '/shop?category=fruits-vegetables'
                },
                {
                    title: 'New Arrivals',
                    description: 'Check out our latest products',
                    image: '/images/promos/banner-08.jpg',
                    link: '/shop'
                }
            ];
        }
        
        // Get new arrivals with populated categories
        let newArrivals = [];
        try {
            newArrivals = await Product.findNewArrivals(6);
        } catch (error) {
            console.error('Error fetching new arrivals:', error);
            newArrivals = [
                {
                    _id: '1',
                    name: 'Organic Bananas',
                    price: 2.99,
                    images: [{ url: '/images/products/bananas.jpg' }],
                    category: { name: 'Fruits & Vegetables' }
                },
                {
                    _id: '2',
                    name: 'Fresh Milk',
                    price: 3.49,
                    images: [{ url: '/images/products/milk.jpg' }],
                    category: { name: 'Dairy' }
                },
                {
                    _id: '3',
                    name: 'Whole Grain Bread',
                    price: 4.99,
                    images: [{ url: '/images/products/bread.jpg' }],
                    category: { name: 'Bakery' }
                }
            ];
        }
        
        // Get best sellers with populated categories
        let bestSellers = [];
        try {
            bestSellers = await Product.findBestSellers(6);
        } catch (error) {
            console.error('Error fetching best sellers:', error);
            bestSellers = [
                {
                    _id: '4',
                    name: 'Organic Eggs',
                    price: 5.99,
                    images: [{ url: '/images/products/eggs.jpg' }],
                    category: { name: 'Dairy' }
                },
                {
                    _id: '5',
                    name: 'Fresh Tomatoes',
                    price: 1.99,
                    images: [{ url: '/images/products/tomatoes.jpg' }],
                    category: { name: 'Fruits & Vegetables' }
                },
                {
                    _id: '6',
                    name: 'Greek Yogurt',
                    price: 4.49,
                    images: [{ url: '/images/products/yogurt.jpg' }],
                    category: { name: 'Dairy' }
                }
            ];
        }
        
        // Get featured products with populated categories
        let featuredProducts = [];
        try {
            featuredProducts = await Product.findFeatured(6);
        } catch (error) {
            console.error('Error fetching featured products:', error);
            featuredProducts = [
                {
                    _id: '7',
                    name: 'Organic Honey',
                    price: 8.99,
                    images: [{ url: '/images/products/honey.jpg' }],
                    category: { name: 'Grocery' }
                },
                {
                    _id: '8',
                    name: 'Fresh Salmon',
                    price: 12.99,
                    images: [{ url: '/images/products/salmon.jpg' }],
                    category: { name: 'Seafood' }
                },
                {
                    _id: '9',
                    name: 'Avocado',
                    price: 3.99,
                    images: [{ url: '/images/products/avocado.jpg' }],
                    category: { name: 'Fruits & Vegetables' }
                }
            ];
        }

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
            categories: rootCategories,
            categoryMap,
            promotions,
            newArrivals,
            bestSellers,
            featuredProducts,
            features,
            trendingSearches,
            getCategoryIcon,
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

// Helper function to get the appropriate icon for a category
function getCategoryIcon(categoryName) {
    const iconMap = {
        'Fruits & Vegetables': 'fas fa-apple-alt',
        'Meat & Fish': 'fas fa-fish',
        'Snacks': 'fas fa-cookie',
        'Beverages': 'fas fa-wine-bottle',
        'Beauty & Health': 'fas fa-heart',
        'Bread & Bakery': 'fas fa-bread-slice',
        'Fashion': 'fas fa-tshirt',
        'Electronics': 'fas fa-laptop',
        'Home & Kitchen': 'fas fa-home',
        'Grocery & Essentials': 'fas fa-shopping-basket',
        'Toys & Games': 'fas fa-gamepad',
        'Sports & Outdoors': 'fas fa-running',
        'Books & Stationery': 'fas fa-book',
        'Pet Supplies': 'fas fa-paw',
        'Baby Products': 'fas fa-baby',
        'Health & Wellness': 'fas fa-heartbeat',
        'Automotive': 'fas fa-car',
        'Jewelry & Watches': 'fas fa-gem',
        'Musical Instruments': 'fas fa-music',
        'Office Products': 'fas fa-briefcase'
    };
    
    return iconMap[categoryName] || 'fas fa-tag'; // Default icon if category not found
} 