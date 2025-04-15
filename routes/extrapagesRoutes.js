import express from 'express';
import { 
    showAbout, 
    showContact, 
    showPrivacyPolicy, 
    showTerms, 
    showRefundPolicy 
} from '../controllers/extrapagesController.js';

const router = express.Router();

// About Us page
router.get('/about', showAbout);

// Contact Us page
router.get('/contact', showContact);

// Privacy Policy page
router.get('/privacy-policy', showPrivacyPolicy);

// Terms and Conditions page
router.get('/terms', showTerms);

// Refund Policy page
router.get('/refund-policy', showRefundPolicy);

export default router; 