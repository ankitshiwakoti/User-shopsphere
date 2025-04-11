// Storage utility functions for cart and wishlist
const Storage = {
    CART_KEY: 'cart_items',
    WISHLIST_KEY: 'wishlist_items',
    
    // Get items from local storage
    getItems(key) {
        try {
            const items = localStorage.getItem(key);
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error(`Error getting ${key} from localStorage:`, error);
            return [];
        }
    },

    // Save items to local storage
    saveItems(key, items) {
        try {
            localStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    },

    // Add item to storage if it doesn't exist
    addItem(key, itemId) {
        try {
            const items = this.getItems(key);
            if (!items.includes(itemId)) {
                items.push(itemId);
                this.saveItems(key, items);
            }
            return items;
        } catch (error) {
            console.error(`Error adding item to ${key}:`, error);
            return this.getItems(key);
        }
    },

    // Remove item from storage
    removeItem(key, itemId) {
        try {
            const items = this.getItems(key);
            const filteredItems = items.filter(id => id !== itemId);
            this.saveItems(key, filteredItems);
            return filteredItems;
        } catch (error) {
            console.error(`Error removing item from ${key}:`, error);
            return this.getItems(key);
        }
    },
    
    // Get cart items
    getCartItems() {
        return this.getItems(this.CART_KEY);
    },
    
    // Get wishlist items
    getWishlistItems() {
        return this.getItems(this.WISHLIST_KEY);
    },
    
    // Add to cart
    addToCart(productId) {
        return this.addItem(this.CART_KEY, productId);
    },
    
    // Add to wishlist
    addToWishlist(productId) {
        return this.addItem(this.WISHLIST_KEY, productId);
    },
    
    // Remove from cart
    removeFromCart(productId) {
        return this.removeItem(this.CART_KEY, productId);
    },
    
    // Remove from wishlist
    removeFromWishlist(productId) {
        return this.removeItem(this.WISHLIST_KEY, productId);
    }
}; 