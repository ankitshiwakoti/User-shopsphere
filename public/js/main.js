// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    updateCartCount(data.cartCount);
                    showNotification('Product added to cart successfully!');
                } else {
                    showNotification('Failed to add product to cart', 'error');
                }
            } catch (error) {
                showNotification('An error occurred', 'error');
            }
        });
    });

    // Newsletter subscription
    const newsletterForm = document.querySelector('form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            try {
                const response = await fetch('/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                if (response.ok) {
                    showNotification('Successfully subscribed to newsletter!');
                    this.reset();
                } else {
                    showNotification('Failed to subscribe', 'error');
                }
            } catch (error) {
                showNotification('An error occurred', 'error');
            }
        });
    }

    // Navigation link click handler
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    // Set initial active state if there's a link with 'active' class
    const initialActiveLink = document.querySelector('.navbar-nav .nav-link.active');
    if (initialActiveLink) {
        initialActiveLink.style.color = 'var(--primary-color)';
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default navigation
            event.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // If you still want to navigate after setting the active state,
            // you can add a small delay before navigation
            setTimeout(() => {
                window.location.href = this.getAttribute('href');
            }, 100);
        });
    });

    // Sticky header behavior
    let lastScroll = 0;
    const announcementBar = document.querySelector('.announcement-bar');
    const stickyHeaderGroup = document.querySelector('.sticky-header-group');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Optional: Hide announcement bar on scroll down
        if (currentScroll > lastScroll && currentScroll > 200) {
            announcementBar.classList.add('hidden');
        } else {
            announcementBar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
});

// Update cart count in the navbar
function updateCartCount(count) {
    const cartBadge = document.querySelector('.badge');
    if (cartBadge) {
        cartBadge.textContent = count;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1000';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
}); 