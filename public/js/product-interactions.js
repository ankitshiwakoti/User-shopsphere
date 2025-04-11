// Get token from localStorage or cookie
function getToken() {
    return localStorage.getItem('token') || (document.cookie.match(/token=([^;]+)/) || [])[1];
}

// Add authorization headers to fetch requests
function getFetchOptions(method, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    return options;
}

// Show toast notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateCartCount(count) {
    const cartBadge = document.querySelector('.cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
    }
}

function updateWishlistCount(count) {
    const wishlistBadge = document.querySelector('.wishlist-count');
    if (wishlistBadge) {
        wishlistBadge.textContent = count;
    }
}

async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Only update cart count, not wishlist
            updateCartCount(data.cartCount);
            showToast('Product added to cart successfully!');
        } else {
            showToast(data.message || 'Failed to add product to cart', true);
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('An error occurred while adding to cart', true);
    }
}

async function addToWishlist(productId) {
    try {
        const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Only update wishlist count
            updateWishlistCount(data.wishlistCount);
            showToast('Product added to wishlist successfully!');
            
            // Update wishlist icon
            const wishlistBtn = document.querySelector(`.btn-wishlist[data-product-id="${productId}"] i`);
            if (wishlistBtn) {
                wishlistBtn.classList.add('text-danger');
            }
        } else {
            showToast(data.message || 'Failed to add product to wishlist', true);
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showToast('An error occurred while adding to wishlist', true);
    }
}

async function removeFromWishlist(productId) {
    try {
        const response = await fetch(`/api/wishlist/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            // Only update wishlist count
            updateWishlistCount(data.wishlistCount);
            showToast('Product removed from wishlist');
            
            // Update wishlist icon
            const wishlistBtn = document.querySelector(`.btn-wishlist[data-product-id="${productId}"] i`);
            if (wishlistBtn) {
                wishlistBtn.classList.remove('text-danger');
            }
        } else {
            showToast(data.message || 'Failed to remove product from wishlist', true);
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showToast('An error occurred while removing from wishlist', true);
    }
}

// Handle wishlist button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Handle wishlist button clicks
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Get product ID from data attribute or closest product card
            const productId = this.dataset.productId || this.closest('.product-card')?.dataset.productId;
            if (!productId) {
                console.error('No product ID found');
                return;
            }

            // Check if product is already in wishlist
            const icon = this.querySelector('i');
            const isInWishlist = icon?.classList.contains('text-danger');

            try {
                if (isInWishlist) {
                    await removeFromWishlist(productId);
                } else {
                    await addToWishlist(productId);
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error updating wishlist', true);
            }
        });
    });

    // Handle add to cart button clicks
    const addToCartButtons = document.querySelectorAll('.btn-add');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Skip if disabled
            if (this.disabled) {
                return;
            }

            // Get product ID from data attribute or closest product card
            const productId = this.dataset.productId || this.closest('.product-card')?.dataset.productId;
            if (!productId) {
                console.error('No product ID found');
                return;
            }

            try {
                await addToCart(productId);
            } catch (error) {
                console.error('Error:', error);
                showToast('Error adding to cart', true);
            }
        });
    });
}); 