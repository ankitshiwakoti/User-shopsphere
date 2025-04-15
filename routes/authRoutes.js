import express from 'express';
import { 
    showLogin, 
    showRegister, 
    register, 
    login, 
    getProfile, 
    updateProfile, 
    show2FAVerification, 
    verify2FA, 
    setup2FA, 
    disable2FA 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Show pages
router.get('/login', showLogin);
router.get('/register', showRegister);

// Auth actions
router.post('/login', login);
router.post('/register', register);
router.post('/logout', (req, res) => {
    res.clearCookie('token', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// 2FA Routes
router.get('/verify-2fa', show2FAVerification);
router.post('/verify-2fa', verify2FA);
router.post('/setup-2fa', protect, setup2FA);
router.post('/disable-2fa', protect, disable2FA);

export default router; 