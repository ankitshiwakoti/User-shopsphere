// Function to update URL parameters
function updateURLParams(params) {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.location.href = url.toString();
}

// Handle price range filter
document.getElementById('price-range-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    updateURLParams({ minPrice, maxPrice });
});

// Handle category filter
document.querySelectorAll('.category-filter')?.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.currentTarget.dataset.category;
        updateURLParams({ category, page: 1 });
    });
});

// Handle checkbox filters
document.querySelectorAll('.filter-checkbox')?.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const filter = e.target.name;
        updateURLParams({ [filter]: e.target.checked, page: 1 });
    });
});

// Handle sort selection
document.getElementById('sort-select')?.addEventListener('change', (e) => {
    updateURLParams({ sort: e.target.value, page: 1 });
});

// Handle pagination
document.querySelectorAll('.pagination-link')?.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        updateURLParams({ page });
    });
});

// Initialize price range slider
const priceSlider = document.getElementById('price-slider');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');

if (priceSlider && minPriceInput && maxPriceInput) {
    noUiSlider.create(priceSlider, {
        start: [0, 100],
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });

    priceSlider.noUiSlider.on('update', (values, handle) => {
        const value = values[handle];
        if (handle === 0) {
            minPriceInput.value = Math.round(value);
        } else {
            maxPriceInput.value = Math.round(value);
        }
    });
}

// Handle wishlist toggle
document.querySelectorAll('.wishlist-button')?.forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = e.currentTarget.dataset.productId;
        const icon = e.currentTarget.querySelector('i');

        try {
            const response = await fetch('/wishlist/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();

            if (data.success) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
                icon.classList.toggle('text-red-500');
                showToast(data.message);
            } else {
                showToast(data.message, true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            showToast('Failed to update wishlist. Please try again.', true);
        }
    });
}); 