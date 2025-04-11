import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import authService from '../services/authService.js';

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    res.render('users/login', { title: 'Login - ShopSphere' });
});

// Login form submission
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            req.flash('error_msg', 'Please provide email and password');
            return res.redirect('/users/login');
        }
        
        // Login user
        const result = await authService.login(email, password);
        
        // Store user in session
        req.session.userId = result.customer.id;
        req.session.user = result.customer;
        
        // Store token in cookie
        res.cookie('token', result.token, { 
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        
        req.flash('success_msg', 'You have been logged in successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error_msg', error.message || 'Login failed');
        res.redirect('/users/login');
    }
});

// Register page
router.get('/register', (req, res) => {
    res.render('users/register', { title: 'Register - ShopSphere' });
});

// Register form submission
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        // Validate input
        if (!fullName || !email || !password) {
            req.flash('error_msg', 'Please provide all required fields');
            return res.redirect('/users/register');
        }
        
        // Register user
        const result = await authService.register({ fullName, email, password });
        
        // Store user in session
        req.session.userId = result.customer.id;
        req.session.user = result.customer;
        
        // Store token in cookie
        res.cookie('token', result.token, { 
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        
        req.flash('success_msg', 'You have been registered successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error_msg', error.message || 'Registration failed');
        res.redirect('/users/register');
    }
});

// Profile page (protected route)
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('users/profile', { 
        title: 'My Profile - ShopSphere',
        user: req.session.user 
    });
});

// Orders page (protected route)
router.get('/orders', isAuthenticated, (req, res) => {
    res.render('users/orders', { 
        title: 'My Orders - ShopSphere',
        user: req.session.user 
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('token');
    req.flash('success_msg', 'You have been logged out');
    res.redirect('/users/login');
});

export default router; 