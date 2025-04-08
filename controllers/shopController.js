import Product from '../models/Product.js';

export const getShopPage = async (req, res) => {
    try {
        // Static data for design purposes
        const products = [
            {
                name: "Fresh Organic Apples",
                price: 4.99,
                oldPrice: 5.99,
                discount: 17,
                thumbnail: "/images/products/apple.jpg",
                rating: { average: 4.5, count: 45 },
                stock: { status: "IN_STOCK" }
            },
            {
                name: "Whole Grain Bread",
                price: 3.99,
                oldPrice: 4.99,
                discount: 20,
                thumbnail: "/images/products/bread.jpg",
                rating: { average: 4.8, count: 32 },
                stock: { status: "IN_STOCK" }
            },
            {
                name: "Organic Green Tea",
                price: 6.99,
                oldPrice: 8.99,
                discount: 22,
                thumbnail: "/images/products/tea.jpg",
                rating: { average: 4.7, count: 58 },
                stock: { status: "IN_STOCK" }
            }
        ];

        const categories = [
            { name: 'Fruits & Vegetables', icon: 'fas fa-apple-alt' },
            { name: 'Meat & Fish', icon: 'fas fa-fish' },
            { name: 'Snacks', icon: 'fas fa-cookie' },
            { name: 'Beverages', icon: 'fas fa-wine-bottle' },
            { name: 'Beauty & Health', icon: 'fas fa-heart' },
            { name: 'Bread & Bakery', icon: 'fas fa-bread-slice' }
        ];

        const brands = ['Fresh', 'Organic', 'Natural'];
        const colors = ['Green', 'Red', 'Yellow', 'Orange'];

        res.render('shop', {
            products,
            categories,
            brands,
            colors,
            filters: {
                minPrice: 0,
                maxPrice: 1000,
                inStock: false,
                onSale: false,
                sort: 'newest'
            },
            pagination: {
                page: 1,
                limit: 20,
                total: products.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        });
    } catch (error) {
        console.error('Error in getShopPage:', error);
        res.status(500).render('error', {
            message: 'Failed to load shop page',
            error: {}
        });
    }
}; 