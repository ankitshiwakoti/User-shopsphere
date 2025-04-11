import authService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import bcrypt from 'bcrypt';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';

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
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new Customer({
            name,
            email,
            password: hashedPassword
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
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password'
            });
        }
        
        // Find user by email
        const user = await Customer.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials'
            });
        }
        
        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
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