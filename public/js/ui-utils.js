// UI Utility functions for cart and wishlist
const UI = {
    // Show toast message
    showToast(message, isError = false) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        toast.innerHTML = message;
        
        // Add to document
        document.body.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            
            // Remove from DOM after fade out
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },
    
    // Update element text content
    updateCount(selector, count) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = count;
        }
    },
    
    // Update cart count
    updateCartCount(count) {
        this.updateCount('.cart-count', count);
    },
    
    // Update wishlist count
    updateWishlistCount(count) {
        this.updateCount('.wishlist-count', count);
    }
}; 