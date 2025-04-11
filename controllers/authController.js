import authService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

// Generate JWT token
const generateToken = (customerId) => {
    return jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register a new customer
export const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Register user
        const result = await authService.register({ fullName, email, password });

        res.status(201).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Login customer
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Login user
        const result = await authService.login(email, password);

        res.json({
            success: true,
            token: result.token,
            customer: {
                id: result.customer.id,
                name: result.customer.name,
                email: result.customer.email,
                address: result.customer.address,
                phone: result.customer.phone
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
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