import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

class AuthService {
    async register(userData) {
        try {
            // Check if customer already exists
            const existingCustomer = await Customer.findOne({ email: userData.email });
            if (existingCustomer) {
                throw new Error('Customer already exists with this email');
            }

            // Create new customer
            const customer = await Customer.create({
                name: userData.fullName,
                email: userData.email,
                password: userData.password
            });

            // Generate JWT token
            const token = jwt.sign(
                { id: customer._id },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            return {
                token,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        try {
            // Find customer
            const customer = await Customer.findOne({ email });
            if (!customer) {
                throw new Error('Invalid credentials');
            }

            // Check password
            const isMatch = await customer.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            customer.lastLogin = Date.now();
            await customer.save();

            // Generate JWT token
            const token = jwt.sign(
                { id: customer._id },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            return {
                token,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

export default new AuthService(); 