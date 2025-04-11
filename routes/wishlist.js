// Get wishlist count
router.get('/count', async (req, res) => {
    try {
        let wishlistCount = 0;
        
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            wishlistCount = wishlist ? wishlist.items.length : 0;
        } else {
            wishlistCount = req.session.wishlist?.items?.length || 0;
        }
        
        res.json({
            success: true,
            wishlistCount
        });
    } catch (error) {
        console.error('Error getting wishlist count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}); 