export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/users/login');
};

export const isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.isAdmin) {
        return next();
    }
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    res.redirect('/');
}; 