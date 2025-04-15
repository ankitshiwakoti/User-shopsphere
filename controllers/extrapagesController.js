// Show About Us page
export const showAbout = (req, res) => {
    res.render('extrapages/about', {
        title: 'About Us - ShopSphere',
        user: req.user
    });
};

// Show Contact Us page
export const showContact = (req, res) => {
    res.render('extrapages/contact', {
        title: 'Contact Us - ShopSphere',
        user: req.user
    });
};

// Show Privacy Policy page
export const showPrivacyPolicy = (req, res) => {
    res.render('extrapages/privacy-policy', {
        title: 'Privacy Policy - ShopSphere',
        user: req.user
    });
};

// Show Terms and Conditions page
export const showTerms = (req, res) => {
    res.render('extrapages/terms', {
        title: 'Terms and Conditions - ShopSphere',
        user: req.user
    });
};

// Show Refund Policy page
export const showRefundPolicy = (req, res) => {
    res.render('extrapages/refund-policy', {
        title: 'Refund Policy - ShopSphere',
        user: req.user
    });
}; 