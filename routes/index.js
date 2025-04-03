import express from 'express';
import { getHomePage } from '../controllers/homeController.js';

const router = express.Router();

// Home page route
router.get('/', getHomePage);

export default router; 