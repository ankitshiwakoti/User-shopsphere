// Authentication functionality
const Auth = {
    // Initialize auth
    init() {
        this.setupLoginForm();
        this.setupRegisterForm();
    },

    // Set up login form
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                try {
                    // Show loading state
                    this.showLoading(loginForm);
                    
                    // Send login request
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Save token to localStorage
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        // Sync localStorage cart and wishlist with server
                        this.syncLocalStorageWithServer();
                        
                        // Redirect to home page
                        window.location.href = '/';
                    } else {
                        // Show error message
                        this.showError(loginForm, data.message || 'Invalid credentials');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    this.showError(loginForm, 'An error occurred. Please try again.');
                } finally {
                    // Remove loading state
                    this.hideLoading(loginForm);
                }
            });
        }
    },

    // Set up register form
    setupRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                
                try {
                    // Show loading state
                    this.showLoading(registerForm);
                    
                    // Send register request
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Save token to localStorage
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        // Sync localStorage cart and wishlist with server
                        this.syncLocalStorageWithServer();
                        
                        // Redirect to home page
                        window.location.href = '/';
                    } else {
                        // Show error message
                        this.showError(registerForm, data.message || 'Registration failed');
                    }
                } catch (error) {
                    console.error('Register error:', error);
                    this.showError(registerForm, 'An error occurred. Please try again.');
                } finally {
                    // Remove loading state
                    this.hideLoading(registerForm);
                }
            });
        }
    },

    // Sync localStorage cart and wishlist with server
    async syncLocalStorageWithServer() {
        try {
            // Sync localStorage cart with server
            if (window.Storage) {
                const cartItems = Storage.getCartItems();
                if (cartItems && cartItems.length > 0) {
                    // Add each item to the server cart
                    for (const productId of cartItems) {
                        await fetch('/api/cart/add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ productId, quantity: 1 })
                        });
                    }
                    
                    // Clear localStorage cart
                    localStorage.removeItem(Storage.CART_KEY);
                }
                
                // Sync localStorage wishlist with server
                const wishlistItems = Storage.getWishlistItems();
                if (wishlistItems && wishlistItems.length > 0) {
                    // Add each item to the server wishlist
                    for (const productId of wishlistItems) {
                        await fetch('/api/wishlist/add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ productId })
                        });
                    }
                    
                    // Clear localStorage wishlist
                    localStorage.removeItem(Storage.WISHLIST_KEY);
                }
            }
        } catch (error) {
            console.error('Error syncing localStorage with server:', error);
        }
    },

    // Show loading state
    showLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        }
    },

    // Hide loading state
    hideLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
        }
    },

    // Show error message
    showError(form, message) {
        const errorDiv = form.querySelector('.alert-danger');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        } else {
            const newErrorDiv = document.createElement('div');
            newErrorDiv.className = 'alert alert-danger mt-3';
            newErrorDiv.textContent = message;
            form.appendChild(newErrorDiv);
        }
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    Auth.init();
}); 