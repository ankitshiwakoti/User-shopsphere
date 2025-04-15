import authService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import bcrypt from 'bcryptjs';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate JWT token
const generateToken = (customerId) => {
    return jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register customer
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields'
            });
        }
        
        // Check if email already exists
        const existingUser = await Customer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already in use'
            });
        }
        
        // Create new user (password will be hashed by the model's pre-save middleware)
        const newUser = new Customer({
            name,
            email,
            password  // Pass the plain password, it will be hashed by the model
        });
        
        // Save user to database
        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
        });
        
        // Sync cart and wishlist from session/localStorage to database
        await syncUserData(req, newUser._id);
        
        // Return success with user data
        res.json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error'
        });
    }
};

// Sync session cart and wishlist to database after login
const syncUserData = async (req, userId) => {
    try {
        // Sync cart items
        if (req.session.cart && req.session.cart.items && req.session.cart.items.length > 0) {
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
            }

            // Add session items to user's cart
            for (const item of req.session.cart.items) {
                const productId = item.productId;
                
                // Check if product already exists in cart
                const existingItemIndex = cart.items.findIndex(
                    cartItem => cartItem.product && cartItem.product.toString() === productId
                );

                if (existingItemIndex > -1) {
                    // Update quantity if product already exists
                    cart.items[existingItemIndex].quantity += (item.quantity || 1);
                } else {
                    // Add new product to cart
                    cart.items.push({
                        product: productId,
                        quantity: item.quantity || 1
                    });
                }
            }

            await cart.save();
            
            // Clear session cart
            req.session.cart = { items: [] };
        }

        // Sync wishlist items
        if (req.session.wishlist && req.session.wishlist.items && req.session.wishlist.items.length > 0) {
            let wishlist = await Wishlist.findOne({ user: userId });
            if (!wishlist) {
                wishlist = new Wishlist({ user: userId, items: [] });
            }

            // Add session items to user's wishlist
            for (const productId of req.session.wishlist.items) {
                // Only add if not already in wishlist
                if (!wishlist.items.some(item => item.toString() === productId)) {
                    wishlist.items.push(productId);
                }
            }

            await wishlist.save();
            
            // Clear session wishlist
            req.session.wishlist = { items: [] };
        }
    } catch (error) {
        console.error('Error syncing user data:', error);
    }
};

// Login customer
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt for:', email); // Debug log
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password'
            });
        }
        
        // Find user by email and include password
        const user = await Customer.findOne({ email }).select('+password');
        
        console.log('User found:', user ? 'yes' : 'no'); // Debug log
        if (user) {
            console.log('MFA enabled:', user.mfaEnabled); // Debug log
        }
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials'
            });
        }
        
        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch); // Debug log
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials'
            });
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            console.log('MFA required for user'); // Debug log
            // Get the MFA secret for verification
            const userWithMFA = await Customer.findById(user._id).select('+mfaSecret');
            
            // Store user ID in session for MFA verification
            req.session.customerId = user._id;
            req.session.require2FA = true;
            
            return res.json({
                success: true,
                requireTwoFactor: true,
                redirectUrl: '/auth/verify-2fa'
            });
        }
        
        console.log('Proceeding with non-MFA login'); // Debug log
        
        // If no MFA, generate token and proceed with login
        const token = generateToken(user._id);
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
        });

        // Set session data
        req.session.customerId = user._id;
        req.session.isAuthenticated = true;
        req.session.require2FA = false;
        
        // Sync cart and wishlist from session/localStorage to database
        await syncUserData(req, user._id);
        
        // Return success with user data
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error'
        });
    }
};

// Get current customer profile
export const getProfile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer.id).select('-password');
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update customer profile (including address)
export const updateProfile = async (req, res) => {
    try {
        const { name, email, address, phone } = req.body;
        
        const customer = await Customer.findById(req.customer.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Update fields
        if (name) customer.name = name;
        if (email) customer.email = email;
        if (phone) customer.phone = phone;
        if (address) customer.address = { ...customer.address, ...address };

        await customer.save();

        res.json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                address: customer.address,
                phone: customer.phone
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Show 2FA verification page
export const show2FAVerification = async (req, res) => {
    if (!req.session.customerId || !req.session.require2FA) {
        return res.redirect('/auth/login');
    }
    res.render('auth/verify-2fa');
};

// Verify 2FA code
export const verify2FA = async (req, res) => {
    try {
        if (!req.session.customerId || !req.session.require2FA) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const customer = await Customer.findById(req.session.customerId)
            .select('+mfaSecret +backupCodes');
        
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const { code, backupCode } = req.body;

        if (backupCode) {
            // Verify backup code
            const backupCodeIndex = customer.backupCodes.findIndex(bc => 
                bc.code === backupCode && !bc.used
            );
            
            if (backupCodeIndex === -1) {
                return res.status(400).json({ message: 'Invalid backup code' });
            }

            // Mark backup code as used
            customer.backupCodes[backupCodeIndex].used = true;
            await customer.save();
        } else {
            // Verify MFA code
            const verified = speakeasy.totp.verify({
                secret: customer.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 1 // Allow 30 seconds clock skew
            });

            if (!verified) {
                return res.status(400).json({ message: 'Invalid verification code' });
            }
        }

        // Clear MFA requirement and set customer as fully authenticated
        req.session.require2FA = false;
        req.session.isAuthenticated = true;

        // Generate token
        const token = generateToken(customer._id);
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
        });

        res.json({ 
            success: true,
            redirectUrl: '/'
        });
    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ message: 'An error occurred during verification' });
    }
};

// Setup 2FA for customer
export const setup2FA = async (req, res) => {
    try {
        const customer = await Customer.findById(req.session.customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Generate new secret
        const secret = speakeasy.generateSecret({
            name: `ShopSphere:${customer.email}`
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => 
            Math.random().toString(36).substring(2, 15).toUpperCase()
        );

        // Save secret and backup codes
        customer.mfaSecret = secret.base32;
        customer.backupCodes = backupCodes;
        customer.mfaEnabled = true;
        await customer.save();

        res.json({
            qrCode: qrCodeUrl,
            backupCodes,
            secret: secret.base32
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ message: 'An error occurred during 2FA setup' });
    }
};

// Disable 2FA for customer
export const disable2FA = async (req, res) => {
    try {
        const customer = await Customer.findById(req.session.customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        customer.mfaSecret = undefined;
        customer.backupCodes = [];
        customer.mfaEnabled = false;
        await customer.save();

        res.json({ message: '2FA has been disabled' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ message: 'An error occurred while disabling 2FA' });
    }
};

// Show login page
export const showLogin = (req, res) => {
    res.render('users/login', { 
        title: 'Login',
        error: req.flash('error'),
        success: req.flash('success')
    });
};

// Show register page
export const showRegister = (req, res) => {
    res.render('users/register', { 
        title: 'Register',
        error: req.flash('error'),
        success: req.flash('success')
    });
}; 