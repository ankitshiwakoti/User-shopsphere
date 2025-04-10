import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

export const getShopPage = async (req, res) => {
    try {
        // Fetch only published products from database
        const products = await Product.find({ status: 'published' })
            .populate('category')
            .sort({ createdAt: -1 });

        // Fetch categories for sidebar
        const categories = await Category.find({ status: 'active' });

        // Static data for filters (can be replaced with database data later)
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
        if (product.category) {
            try {
                category = await Category.findById(product.category);
                console.log('Category found in database:', category ? category.name : 'Not found');
            } catch (categoryError) {
                console.error('Error fetching category:', categoryError);
            }
        }
        
        // Create a category object for the product
        const categoryObj = category ? {
            _id: category._id,
            name: category.name
        } : {
            _id: product.category || 'unknown',
            name: 'Uncategorized'
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
                name: product.category.name
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
                    name: categoryObj.name
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