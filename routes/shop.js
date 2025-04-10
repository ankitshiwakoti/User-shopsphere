import express from 'express';
import { getShopPage } from '../controllers/shopController.js';

const router = express.Router();

router.get('/', getShopPage);

// Product details route
router.get('/product/:id', (req, res) => {
    res.render('product-details', {
        product: {
            name: "Fresh Orange Juice",
            price: 3.99,
            originalPrice: 4.69,
            discount: 15,
            description: "Fresh and healthy orange juice made from handpicked oranges. Rich in Vitamin C and natural flavors.",
            category: "Beverages",
            sku: "BEV001",
            stock: 50,
            rating: 4.5,
            reviewCount: 128,
            image: "/images/products/orangejuice.jpg",
            thumbnails: [
                "/images/products/orangejuice.jpg",
                "/images/products/applejuice.png",
                "/images/products/creamspread.png",
                "/images/products/lays.png"
            ],
            tags: ["Beverages", "Juice", "Healthy", "Fresh"],
            additionalInfo: [
                { label: "Weight", value: "1 Liter" },
                { label: "Type", value: "Natural Juice" },
                { label: "Packaging", value: "Tetra Pack" },
                { label: "Ingredients", value: "100% Pure Orange Juice" }
            ],
            fullDescription: "Our Fresh Orange Juice is made from carefully selected, sun-ripened oranges. Each bottle contains the juice of 8-10 fresh oranges, with no added sugar or preservatives. Perfect for breakfast or as a refreshing drink any time of the day. Rich in Vitamin C and natural antioxidants."
        },
        relatedProducts: [
            {
                name: "Apple Juice",
                price: 4.29,
                originalPrice: 5.39,
                discount: 20,
                image: "/images/products/applejuice.png"
            },
            {
                name: "Cream Spread",
                price: 5.49,
                originalPrice: 6.09,
                discount: 10,
                image: "/images/products/creamspread.png"
            },
            {
                name: "Lays Chips",
                price: 2.99,
                originalPrice: 3.99,
                discount: 25,
                image: "/images/products/lays.png"
            },
            {
                name: "Fresh Pizza",
                price: 8.99,
                originalPrice: 12.99,
                discount: 30,
                image: "/images/products/pizza.png"
            }
        ]
    });
});

export default router; 