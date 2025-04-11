import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', (req, res) => {
    res.clearCookie('token', { 
        path: '/',
        httpOnly: false,
        sameSite: 'Lax'
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router; 