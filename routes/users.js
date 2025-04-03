import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    res.render('users/login', { title: 'Login - ShopSphere' });
});

// Register page
router.get('/register', (req, res) => {
    res.render('users/register', { title: 'Register - ShopSphere' });
});

// Profile page (protected route)
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('users/profile', { 
        title: 'My Profile - ShopSphere',
        user: req.user 
    });
});

// Orders page (protected route)
router.get('/orders', isAuthenticated, (req, res) => {
    res.render('users/orders', { 
        title: 'My Orders - ShopSphere',
        user: req.user 
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You have been logged out');
    res.redirect('/users/login');
});

export default router; 