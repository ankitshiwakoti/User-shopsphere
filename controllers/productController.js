import Product from '../models/Product.js';

// Get all products
export const getProducts = async () => {
    try {
        return await Product.find({});
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

// Get single product
export const getProduct = async (id) => {
    try {
        return await Product.findById(id);
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

// Create product (admin only)
export const createProduct = async (productData) => {
    try {
        const product = new Product(productData);
        return await product.save();
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

// Update product (admin only)
export const updateProduct = async (id, productData) => {
    try {
        return await Product.findByIdAndUpdate(
            id,
            productData,
            { new: true, runValidators: true }
        );
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

// Delete product (admin only)
export const deleteProduct = async (id) => {
    try {
        return await Product.findByIdAndDelete(id);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}; 