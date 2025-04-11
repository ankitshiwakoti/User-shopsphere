// Wishlist functionality
window.Wishlist = {
    // Initialize wishlist count
    async init() {
        try {
            const response = await fetch('/api/wishlist/count');
            const data = await response.json();
            
            if (data.success) {
                UI.updateWishlistCount(data.wishlistCount);
            } else {
                // If API call fails, use localStorage
                const items = Storage.getWishlistItems();
                UI.updateWishlistCount(items.length);
            }
        } catch (error) {
            console.error('Error initializing wishlist:', error);
            // Fallback to localStorage
            const items = Storage.getWishlistItems();
            UI.updateWishlistCount(items.length);
        }
    },

    // Add item to wishlist
    async addItem(productId) {
        try {
            const response = await fetch('/api/wishlist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (data.success) {
                UI.updateWishlistCount(data.wishlistCount);
                UI.showToast('Product added to wishlist successfully!');
            } else {
                // If API call fails, use localStorage
                const items = Storage.addToWishlist(productId);
                UI.updateWishlistCount(items.length);
                UI.showToast('Product added to wishlist successfully!');
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            // Fallback to localStorage on network error
            const items = Storage.addToWishlist(productId);
            UI.updateWishlistCount(items.length);
            UI.showToast('Product added to wishlist');
        }
    },
    
    // Initialize wishlist buttons
    initButtons() {
        const wishlistButtons = document.querySelectorAll('.btn-wishlist:not([data-initialized])');
        wishlistButtons.forEach(button => {
            button.setAttribute('data-initialized', 'true');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productCard = this.closest('.product-card');
                const productId = productCard.dataset.productId;
                
                Wishlist.addItem(productId);
            });
        });
    }
};

// Initialize wishlist on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load wishlist count
    Wishlist.init();

    // Initialize wishlist buttons
    Wishlist.initButtons();
}); 