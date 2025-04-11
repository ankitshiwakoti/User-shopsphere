import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';
import connectDB from './config/database.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use(async (req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };

    // Check for JWT token in cookies or Authorization header
    let token = null;
    
    // Safely check for token in cookies
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('Token found in cookies');
    } 
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token found in Authorization header');
    }
    
    if (token) {
        try {
            console.log('Verifying token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified, user ID:', decoded.id);
            
            // Import Customer model dynamically to avoid OverwriteModelError
            const Customer = (await import('./models/Customer.js')).default;
            const user = await Customer.findById(decoded.id).select('-password');
            
            if (user) {
                console.log('User found:', user.name);
                res.locals.user = user;
                req.user = user; // Add user to request object
                
                // Get cart count
                const Cart = (await import('./models/Cart.js')).default;
                const cart = await Cart.findOne({ user: user._id });
                res.locals.cartCount = cart ? cart.items.length : 0;
                
                // Get wishlist count
                const Wishlist = (await import('./models/Wishlist.js')).default;
                const wishlist = await Wishlist.findOne({ user: user._id });
                res.locals.wishlistCount = wishlist ? wishlist.items.length : 0;
            } else {
                console.log('User not found for ID:', decoded.id);
            }
        } catch (error) {
            console.error('Token verification failed:', error.message);
        }
    } else {
        console.log('No token found in request');
    }

    next();
});

// Import routes
import indexRouter from './routes/index.js';
import productsRouter from './routes/products.js';
import usersRouter from './routes/users.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import shopRouter from './routes/shop.js';
import authRouter from './routes/authRoutes.js';
import wishlistRouter from './routes/wishlistRoutes.js';

// API routes
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);

// Web routes
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/users', usersRouter);
app.use('/cart', cartRouter);
app.use('/orders', ordersRouter);
app.use('/shop', shopRouter);
app.use('/wishlist', wishlistRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        message: 'Page not found',
        error: {}
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 