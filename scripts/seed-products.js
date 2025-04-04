import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

// Load environment variables
dotenv.config();

// Sample products data
const products = [
    {
        name: "Fresh Orange Premium",
        description: "Sweet and juicy oranges, perfect for fresh juice or healthy snacking.",
        price: 4.99,
        oldPrice: 6.99,
        discount: 29,
        image: "/images/products/orange.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: 50,
        rating: 4.5,
        numReviews: 12
    },
    {
        name: "Fresh Red Tomatoes",
        description: "Ripe and fresh tomatoes, perfect for salads and cooking.",
        price: 2.99,
        oldPrice: 3.99,
        discount: 25,
        image: "/images/products/tomatoes.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: 75,
        rating: 4.0,
        numReviews: 8
    },
    {
        name: "Fresh Bananas",
        description: "Sweet and ripe bananas, perfect for snacking or baking.",
        price: 1.99,
        oldPrice: 2.49,
        discount: 20,
        image: "/images/products/bananas.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: 100,
        rating: 4.8,
        numReviews: 15
    },
    {
        name: "Fresh Salmon Fillet",
        description: "Premium quality salmon fillet, rich in omega-3.",
        price: 12.99,
        oldPrice: 15.99,
        discount: 19,
        image: "/images/products/salmon.jpg",
        category: "Meat & Fish",
        badges: ["COLD SALE"],
        stock: 25,
        rating: 4.7,
        numReviews: 20
    },
    {
        name: "Organic Broccoli",
        description: "Fresh and crispy broccoli, locally sourced.",
        price: 2.49,
        oldPrice: 2.99,
        discount: 17,
        image: "/images/products/broccoli.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: 60,
        rating: 4.3,
        numReviews: 10
    },
    {
        name: "Fresh Apple",
        description: "Crispy and sweet apples, perfect for healthy snacking.",
        price: 0.99,
        image: "/images/products/apple.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: 150,
        rating: 4.6,
        numReviews: 25
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // Clear existing products
            await Product.deleteMany({});
            console.log('Cleared existing products');

            // Insert new products
            await Product.insertMany(products);
            console.log('Sample products added successfully');

            // Generate product images
            console.log('Note: Make sure to add actual product images in the public/images/products directory');

        } catch (error) {
            console.error('Error seeding products:', error);
        } finally {
            // Close the connection
            mongoose.connection.close();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err)); 