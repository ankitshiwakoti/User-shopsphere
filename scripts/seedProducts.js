import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const sampleProducts = [
    {
        name: "Fresh Organic Apples",
        slug: "fresh-organic-apples",
        description: "Sweet and crispy organic apples fresh from local farms",
        shortDescription: "Fresh organic apples",
        price: 4.99,
        oldPrice: 5.99,
        discount: 17,
        images: [{ url: "/images/products/apple.jpg", alt: "Fresh Apples" }],
        thumbnail: "/images/products/apple.jpg",
        category: "Fruits & Vegetables",
        badges: ["ORGANIC"],
        stock: {
            quantity: 100,
            status: "IN_STOCK"
        },
        rating: {
            average: 4.5,
            count: 45
        }
    },
    {
        name: "Whole Grain Bread",
        slug: "whole-grain-bread",
        description: "Freshly baked whole grain bread",
        shortDescription: "Fresh whole grain bread",
        price: 3.99,
        oldPrice: 4.99,
        discount: 20,
        images: [{ url: "/images/products/bread.jpg", alt: "Whole Grain Bread" }],
        thumbnail: "/images/products/bread.jpg",
        category: "Bread & Bakery",
        badges: ["FEATURED"],
        stock: {
            quantity: 50,
            status: "IN_STOCK"
        },
        rating: {
            average: 4.8,
            count: 32
        }
    },
    {
        name: "Organic Green Tea",
        slug: "organic-green-tea",
        description: "Premium organic green tea leaves",
        shortDescription: "Organic green tea",
        price: 6.99,
        oldPrice: 8.99,
        discount: 22,
        images: [{ url: "/images/products/tea.jpg", alt: "Green Tea" }],
        thumbnail: "/images/products/tea.jpg",
        category: "Beverages",
        badges: ["ORGANIC", "BEST SELLER"],
        stock: {
            quantity: 75,
            status: "IN_STOCK"
        },
        rating: {
            average: 4.7,
            count: 58
        }
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere');
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample products
        await Product.insertMany(sampleProducts);
        console.log('Sample products inserted successfully');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts(); 