import express from 'express';
import { 
    getProducts, 
    getProduct, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    searchProducts
} from '../controllers/productController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Protected routes (admin only)
router.post('/', isAuthenticated, isAdmin, createProduct);
router.put('/:id', isAuthenticated, isAdmin, updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

export default router; 