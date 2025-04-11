// Cart functionality
window.Cart = {
    // Initialize cart count
    async init() {
        try {
            const response = await fetch('/api/cart/count');
            const data = await response.json();
            
            if (data.success) {
                UI.updateCartCount(data.cartCount);
            } else {
                // If API call fails, use localStorage
                const items = Storage.getCartItems();
                UI.updateCartCount(items.length);
            }
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Fallback to localStorage
            const items = Storage.getCartItems();
            UI.updateCartCount(items.length);
        }
    },

    // Add item to cart
    async addItem(productId) {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (data.success) {
                UI.updateCartCount(data.cartCount);
                
                if (data.message === 'Product already in cart') {
                    UI.showToast('Product already in cart. Quantity updated!');
                } else {
                    UI.showToast('Product added to cart successfully!');
                }
            } else {
                // If API call fails, use localStorage
                const items = Storage.addToCart(productId);
                UI.updateCartCount(items.length);
                UI.showToast('Product added to cart successfully!');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            // Fallback to localStorage on network error
            const items = Storage.addToCart(productId);
            UI.updateCartCount(items.length);
            UI.showToast('Product added to cart');
        }
    },
    
    // Initialize cart buttons
    initButtons() {
        const addToCartButtons = document.querySelectorAll('.btn-add:not([data-initialized])');
        addToCartButtons.forEach(button => {
            button.setAttribute('data-initialized', 'true');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productCard = this.closest('.product-card');
                const productId = productCard.dataset.productId;
                
                Cart.addItem(productId);
            });
        });
    }
};

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load cart count
    Cart.init();

    // Initialize cart buttons
    Cart.initButtons();
}); 