import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Profile route
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        // Get user's recent orders
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.render('customers/profile', {
            title: 'My Profile',
            user: req.user,
            orders: orders
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/');
    }
});

// Profile update route
router.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const { name, email, phone, gender, dateOfBirth } = req.body;

        // Check if email is already taken by another user
        const existingUser = await Customer.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Update user profile
        const updatedUser = await Customer.findByIdAndUpdate(
            req.user._id,
            {
                name,
                email,
                phone,
                gender,
                dateOfBirth: dateOfBirth || undefined
            },
            { new: true }
        ).select('-password'); // Exclude password from the response

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Change password route (placeholder for now)
router.get('/change-password', isAuthenticated, (req, res) => {
    res.render('customers/change-password', {
        title: 'Change Password'
    });
});

// Generate 2FA setup
router.post('/2fa/generate', isAuthenticated, async (req, res) => {
    try {
        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `ShopSphere:${req.user.email}`
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => 
            Math.random().toString(36).substring(2, 8).toUpperCase()
        );

        // Store temporary setup data in session
        req.session.mfaSetup = {
            secret: secret.base32,
            backupCodes: backupCodes.map(code => ({
                code: code,
                used: false
            }))
        };

        res.json({
            qrCode,
            backupCodes
        });
    } catch (error) {
        console.error('Error generating 2FA:', error);
        res.status(500).json({ message: 'Error generating 2FA setup' });
    }
});

// Verify and enable 2FA
router.post('/2fa/verify', isAuthenticated, async (req, res) => {
    try {
        const { token } = req.body;
        const setupData = req.session.mfaSetup;

        if (!setupData) {
            return res.status(400).json({ message: 'No 2FA setup in progress' });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: setupData.secret,
            encoding: 'base32',
            token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Enable 2FA for user
        await Customer.findByIdAndUpdate(req.user._id, {
            mfaEnabled: true,
            mfaSecret: setupData.secret,
            backupCodes: setupData.backupCodes
        });

        // Clear setup data from session
        delete req.session.mfaSetup;

        res.json({ message: '2FA enabled successfully' });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ message: 'Error enabling 2FA' });
    }
});

// Disable 2FA
router.post('/2fa/disable', isAuthenticated, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password
        const user = await Customer.findById(req.user._id);
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Disable 2FA
        await Customer.findByIdAndUpdate(req.user._id, {
            mfaEnabled: false,
            mfaSecret: null,
            backupCodes: []
        });

        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ message: 'Error disabling 2FA' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await Customer.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const validPassword = await user.comparePassword(password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if 2FA is enabled
        if (user.mfaEnabled) {
            // Store login info in session
            req.session.mfaPending = {
                userId: user._id,
                email: user.email
            };
            
            return res.json({
                requireMfa: true,
                message: 'Please enter your 2FA code'
            });
        }

        // If no 2FA, complete login
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        res.json({
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});

// 2FA verification page
router.get('/2fa-verify', (req, res) => {
    if (!req.session.mfaPending) {
        return res.redirect('/users/login');
    }
    
    res.render('customers/2fa-verify', {
        title: 'Verify 2FA',
        messages: req.flash()
    });
});

// Verify 2FA during login
router.post('/2fa/verify-login', async (req, res) => {
    try {
        const { token } = req.body;
        const pendingLogin = req.session.mfaPending;

        if (!pendingLogin) {
            return res.status(400).json({ message: 'No login attempt in progress' });
        }

        // Find user
        const user = await Customer.findById(pendingLogin.userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify TOTP
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1
        });

        if (!verified) {
            // Check backup codes
            const backupCode = user.backupCodes.find(code => 
                code.code === token && !code.used
            );

            if (!backupCode) {
                return res.status(400).json({ message: 'Invalid verification code' });
            }

            // Mark backup code as used
            backupCode.used = true;
            await user.save();
        }

        // Complete login
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        // Clear pending login
        delete req.session.mfaPending;

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ message: 'Error verifying 2FA code' });
    }
});

export default router; 