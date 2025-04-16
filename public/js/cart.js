// Cart functionality
window.Cart = {
    // Initialize cart count
    async init() {
        try {
            const response = await fetch('/api/cart/count');
            const data = await response.json();
            
            if (data.success) {
                this.updateCartCount(data.cartCount);
            } else {
                // If API call fails, use localStorage
                const items = Storage.getCartItems();
                this.updateCartCount(items.length);
            }
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Fallback to localStorage
            const items = Storage.getCartItems();
            this.updateCartCount(items.length);
        }
    },

    // Update cart count
    updateCartCount(count) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
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
                this.updateCartCount(data.cartCount);
                
                if (data.message === 'Product already in cart') {
                    UI.showToast('Product already in cart. Quantity updated!');
                } else {
                    UI.showToast('Product added to cart successfully!');
                }
            } else {
                // If API call fails, use localStorage
                const items = Storage.addToCart(productId);
                this.updateCartCount(items.length);
                UI.showToast('Product added to cart successfully!');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            // Fallback to localStorage on network error
            const items = Storage.addToCart(productId);
            this.updateCartCount(items.length);
            UI.showToast('Product added to cart');
        }
    },
    
    // Initialize cart buttons
    initButtons() {
        const addToCartButtons = document.querySelectorAll('.btn-add');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                if (productId) {
                    this.addItem(productId);
                }
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