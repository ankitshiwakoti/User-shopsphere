// Wishlist functionality
window.Wishlist = {
    // Track wishlist items locally
    wishlistItems: [],
    
    // Initialize wishlist count
    async init() {
        try {
            const response = await fetch('/api/wishlist/count');
            const data = await response.json();
            
            if (data.success) {
                UI.updateWishlistCount(data.wishlistCount);
                
                // Get the current wishlist items from server or local storage
                await this.syncWishlistItems();
                
                // Highlight wishlist items
                this.highlightWishlistItems();
            } else {
                // If API call fails, use localStorage
                this.wishlistItems = Storage.getWishlistItems();
                UI.updateWishlistCount(this.wishlistItems.length);
                this.highlightWishlistItems();
            }
        } catch (error) {
            console.error('Error initializing wishlist:', error);
            // Fallback to localStorage
            this.wishlistItems = Storage.getWishlistItems();
            UI.updateWishlistCount(this.wishlistItems.length);
            this.highlightWishlistItems();
        }
    },
    
    // Sync wishlist items with server and localStorage
    async syncWishlistItems() {
        try {
            const response = await fetch('/api/wishlist/items');
            const data = await response.json();
            
            if (data.success && data.items) {
                this.wishlistItems = data.items;
                
                // Update localStorage to match server
                Storage.saveItems('wishlist', this.wishlistItems);
            } else {
                this.wishlistItems = Storage.getWishlistItems();
            }
            
            return this.wishlistItems;
        } catch (error) {
            console.error('Error syncing wishlist items:', error);
            this.wishlistItems = Storage.getWishlistItems();
            return this.wishlistItems;
        }
    },

    // Toggle item in wishlist (add or remove)
    async toggleItem(productId, button) {
        const icon = button.querySelector('i');
        const isInWishlist = icon.classList.contains('text-danger');
        
        try {
            let response;
            
            if (isInWishlist) {
                // Remove from wishlist
                response = await fetch(`/api/wishlist/remove/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update UI
                    icon.classList.remove('text-danger');
                    UI.updateWishlistCount(data.wishlistCount);
                    UI.showToast('Product removed from wishlist');
                    
                    // Update localStorage and local array
                    Storage.removeFromWishlist(productId);
                    this.wishlistItems = this.wishlistItems.filter(id => id !== productId);
                    
                    // Update all other heart icons for this product
                    this.updateAllHeartIcons(productId, false);
                }
            } else {
                // Add to wishlist
                response = await fetch('/api/wishlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update UI
                    icon.classList.add('text-danger');
                    UI.updateWishlistCount(data.wishlistCount);
                    UI.showToast('Product added to wishlist successfully!');
                    
                    // Update localStorage and local array
                    Storage.addToWishlist(productId);
                    if (!this.wishlistItems.includes(productId)) {
                        this.wishlistItems.push(productId);
                    }
                    
                    // Update all other heart icons for this product
                    this.updateAllHeartIcons(productId, true);
                } else {
                    UI.showToast(data.message || 'Failed to add to wishlist', true);
                }
            }
        } catch (error) {
            console.error('Error toggling wishlist item:', error);
            
            // Fallback to localStorage
            if (isInWishlist) {
                icon.classList.remove('text-danger');
                const items = Storage.removeFromWishlist(productId);
                this.wishlistItems = items;
                UI.updateWishlistCount(items.length);
                UI.showToast('Product removed from wishlist');
                this.updateAllHeartIcons(productId, false);
            } else {
                icon.classList.add('text-danger');
                const items = Storage.addToWishlist(productId);
                this.wishlistItems = items;
                UI.updateWishlistCount(items.length);
                UI.showToast('Product added to wishlist');
                this.updateAllHeartIcons(productId, true);
            }
        }
    },
    
    // Update all heart icons for a specific product
    updateAllHeartIcons(productId, isInWishlist) {
        const allButtons = document.querySelectorAll(`.btn-wishlist[data-product-id="${productId}"], .product-card[data-product-id="${productId}"] .btn-wishlist`);
        
        allButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                if (isInWishlist) {
                    icon.classList.add('text-danger');
                } else {
                    icon.classList.remove('text-danger');
                }
            }
        });
    },
    
    // Highlight wishlist items with red hearts
    highlightWishlistItems() {
        if (!this.wishlistItems || !this.wishlistItems.length) return;
        
        // Find all product cards and highlight if in wishlist
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productId = card.dataset.productId;
            if (productId && this.wishlistItems.includes(productId)) {
                const icon = card.querySelector('.btn-wishlist i');
                if (icon) {
                    icon.classList.add('text-danger');
                }
            }
        });
        
        // Also check for standalone wishlist buttons
        const wishlistButtons = document.querySelectorAll('.btn-wishlist[data-product-id]');
        wishlistButtons.forEach(button => {
            const productId = button.dataset.productId;
            if (productId && this.wishlistItems.includes(productId)) {
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.add('text-danger');
                }
            }
        });
    },
    
    // Initialize wishlist buttons
    initButtons() {
        const wishlistButtons = document.querySelectorAll('.btn-wishlist:not([data-initialized])');
        wishlistButtons.forEach(button => {
            button.setAttribute('data-initialized', 'true');
            
            // Get product ID from button or parent card
            let productId = button.dataset.productId;
            if (!productId) {
                const productCard = button.closest('.product-card');
                if (productCard) {
                    productId = productCard.dataset.productId;
                    // Also add productId to button for easier reference
                    button.dataset.productId = productId;
                }
            }
            
            if (productId) {
                // Check if this product is already in the wishlist and highlight it
                if (this.wishlistItems.includes(productId)) {
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.classList.add('text-danger');
                    }
                }
                
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    Wishlist.toggleItem(productId, this);
                });
            }
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