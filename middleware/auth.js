export const isAuthenticated = (req, res, next) => {
    // Check if user is authenticated via JWT
    if (req.user) {
        return next();
    }
    
    // Check if user is authenticated via session
    if (req.session && req.session.userId) {
        return next();
    }

    // If not authenticated, redirect to login
    req.flash('error', 'Please log in to access this page');
    res.redirect('/auth/login');
};

export const isAdmin = (req, res, next) => {
    // Check if user is authenticated and is admin via JWT
    if (req.user && req.user.isAdmin) {
        return next();
    }
    
    // Check if user is authenticated and is admin via session
    if (req.session && req.session.userId && req.session.isAdmin) {
        return next();
    }

    // If not admin, redirect to home
    req.flash('error', 'Access denied. Admin privileges required.');
    res.redirect('/');
}; 