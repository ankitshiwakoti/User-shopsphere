document.addEventListener('DOMContentLoaded', function() {
    // Price filter functionality
    const priceForm = document.getElementById('priceFilterForm');
    if (priceForm) {
        const minRange = priceForm.querySelector('.min-range');
        const maxRange = priceForm.querySelector('.max-range');
        const track = priceForm.querySelector('.slider-track');
        const minValue = priceForm.querySelector('.min-value');
        const maxValue = priceForm.querySelector('.max-value');

        let isDragging = false;
        let debounceTimer = null;

        function updateSlider() {
            const min = parseInt(minRange.value);
            const max = parseInt(maxRange.value);

            if (min > max) {
                const temp = min;
                minRange.value = max;
                maxRange.value = temp;
            }

            const percent1 = (min / minRange.max) * 100;
            const percent2 = (max / maxRange.max) * 100;

            track.style.left = percent1 + '%';
            track.style.width = (percent2 - percent1) + '%';

            minValue.textContent = '$' + min;
            maxValue.textContent = '$' + max;
        }

        function submitForm() {
            if (!isDragging) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    priceForm.submit();
                }, 1000); // Wait 1 second after the user stops dragging
            }
        }

        // Update visual state while dragging
        minRange.addEventListener('input', () => {
            isDragging = true;
            updateSlider();
        });

        maxRange.addEventListener('input', () => {
            isDragging = true;
            updateSlider();
        });

        // Submit form when user releases the slider
        minRange.addEventListener('change', () => {
            isDragging = false;
            submitForm();
        });

        maxRange.addEventListener('change', () => {
            isDragging = false;
            submitForm();
        });

        // Initial update
        updateSlider();
    }

    // Clear price filter
    const clearPriceFilterBtn = document.getElementById('clearPriceFilter');
    if (clearPriceFilterBtn) {
        clearPriceFilterBtn.addEventListener('click', function() {
            // Reset to default values
            const minRange = document.querySelector('.min-range');
            const maxRange = document.querySelector('.max-range');
            if (minRange && maxRange) {
                minRange.value = 0;
                maxRange.value = 1000;
                // Trigger update if slider function exists
                if (typeof updateSlider === 'function') {
                    updateSlider();
                }
            }
            
            // Remove price parameters from URL and submit
            const url = new URL(window.location.href);
            url.searchParams.delete('minPrice');
            url.searchParams.delete('maxPrice');
            window.location.href = url.toString();
        });
    }

    // Clear category filter
    const clearCategoryFilterBtn = document.getElementById('clearCategoryFilter');
    if (clearCategoryFilterBtn) {
        clearCategoryFilterBtn.addEventListener('click', function() {
            // Uncheck all checkboxes
            const checkboxes = document.querySelectorAll('#categoryForm input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Remove category parameters from URL and submit
            const url = new URL(window.location.href);
            url.searchParams.delete('category');
            window.location.href = url.toString();
        });
    }

    // Handle category expansion
    const expandButtons = document.querySelectorAll('.expand-btn');
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            const subcategoryList = document.querySelector(`.subcategory-list[data-parent="${categoryId}"]`);
            
            if (subcategoryList) {
                const isExpanded = this.classList.contains('expanded');
                this.classList.toggle('expanded');
                subcategoryList.style.display = isExpanded ? 'none' : 'block';
            }
        });
    });

    // Auto-submit form when checkbox changes
    const checkboxes = document.querySelectorAll('#categoryForm input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            document.getElementById('categoryForm').submit();
        });
    });

    // Show subcategories if any child category is selected
    const selectedSubcategories = document.querySelectorAll('.subcategory-item input[type="checkbox"]:checked');
    selectedSubcategories.forEach(checkbox => {
        const subcategoryList = checkbox.closest('.subcategory-list');
        if (subcategoryList) {
            subcategoryList.style.display = 'block';
            const expandBtn = document.querySelector(`.expand-btn[data-category="${subcategoryList.dataset.parent}"]`);
            if (expandBtn) {
                expandBtn.classList.add('expanded');
            }
        }
    });

    // Infinite scroll functionality
    const sentinel = document.querySelector('#sentinel');
    if (sentinel) {
        const loadingSpinner = document.querySelector('#loading-spinner');
        const noMoreProducts = document.querySelector('#no-more-products');
        const productsGrid = document.querySelector('#products-grid');
        let currentPage = 1;
        let isLoading = false;
        let hasMoreProducts = true;
        let loadedProductIds = new Set(); // Track loaded product IDs

        // Track initial products
        const initialProducts = document.querySelectorAll('.product-card');
        initialProducts.forEach(product => {
            loadedProductIds.add(product.dataset.productId);
        });

        // Function to load more products
        async function loadMoreProducts() {
            if (isLoading || !hasMoreProducts) {
                console.log('Skipping load - isLoading:', isLoading, 'hasMoreProducts:', hasMoreProducts);
                return;
            }
            
            try {
                isLoading = true;
                if (loadingSpinner) loadingSpinner.classList.remove('d-none');
                
                // Get current URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('page', currentPage + 1);
                
                console.log('Loading page:', currentPage + 1, 'with params:', urlParams.toString());
                
                // Fetch more products
                const response = await fetch(`/shop/api/products?${urlParams.toString()}`);
                const data = await response.json();
                
                console.log('Received data:', {
                    productsCount: data.products?.length || 0,
                    isLastPage: data.isLastPage,
                    currentPage: currentPage
                });
                
                if (data.products && data.products.length > 0) {
                    let newProductsAdded = false;

                    data.products.forEach(product => {
                        // Skip if product is already loaded
                        if (loadedProductIds.has(product._id)) {
                            console.log('Skipping duplicate product:', product._id);
                            return;
                        }
                        
                        loadedProductIds.add(product._id);
                        newProductsAdded = true;

                        const productHtml = `
                            <div class="col-md-6 col-lg-4 mb-4">
                                <a href="/shop/product/${product._id}" class="product-link">
                                    <div class="product-card" data-product-id="${product._id}">
                                        <div class="product-image">
                                            <img src="${product.images && product.images.length > 0 ? (product.images.find(img => img.isMain)?.url || product.images[0]?.url) : '/images/products/default-product.jpg'}" 
                                                alt="${product.name}">
                                            <div class="badge-overlay">
                                                <span class="badge bg-danger">-15%</span>
                                            </div>
                                        </div>
                                        <div class="product-info">
                                            <h3>${product.name}</h3>
                                            <div class="price">
                                                <span class="new-price">$${(product.price * 0.85).toFixed(2)}</span>
                                                <span class="old-price">$${product.price.toFixed(2)}</span>
                                            </div>
                                            <div class="button-group">
                                                <button class="btn-wishlist" data-product-id="${product._id}">
                                                    <i class="fas fa-heart${product.isInWishlist ? ' text-danger' : ''}"></i>
                                                </button>
                                                <button class="btn-add" data-product-id="${product._id}" ${product.stock <= 0 ? 'disabled' : ''}>
                                                    ${product.stock > 0 ? 'Add to cart' : 'Out of Stock'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        `;
                        productsGrid.insertAdjacentHTML('beforeend', productHtml);
                    });
                    
                    if (newProductsAdded) {
                        currentPage++;
                        console.log('Incremented page to:', currentPage);
                        // Attach event listeners to newly added buttons
                        attachEventListeners();
                    }
                    
                    hasMoreProducts = !data.isLastPage;
                    
                    if (!hasMoreProducts) {
                        console.log('No more products to load');
                        if (noMoreProducts) noMoreProducts.classList.remove('d-none');
                        if (sentinel) sentinel.style.display = 'none';
                    }
                } else {
                    console.log('No products received from server');
                    hasMoreProducts = false;
                    if (noMoreProducts) noMoreProducts.classList.remove('d-none');
                    if (sentinel) sentinel.style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading more products:', error);
                hasMoreProducts = false;
                if (noMoreProducts) noMoreProducts.classList.remove('d-none');
                if (sentinel) sentinel.style.display = 'none';
            } finally {
                isLoading = false;
                if (loadingSpinner) loadingSpinner.classList.add('d-none');
            }
        }
        
        // Reset loaded products when filters change
        function resetInfiniteScroll() {
            console.log('Resetting infinite scroll');
            currentPage = 1;
            hasMoreProducts = true;
            loadedProductIds.clear();
            if (noMoreProducts) noMoreProducts.classList.add('d-none');
            if (sentinel) sentinel.style.display = 'block';
            
            // Clear all existing products
            const products = document.querySelectorAll('.product-card');
            console.log('Found existing products:', products.length);
            
            products.forEach(product => {
                product.closest('.col-md-6').remove();
            });
        }

        // Listen for filter changes
        const filterForms = document.querySelectorAll('form[id$="FilterForm"], #categoryForm');
        filterForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                console.log('Filter form submitted');
                resetInfiniteScroll();
            });
        });

        // Attach event listeners to cart and wishlist buttons
        function attachEventListeners() {
            // Let Cart and Wishlist modules handle their own buttons
            // This ensures that dynamically loaded products have event listeners
            if (window.Cart && typeof window.Cart.initButtons === 'function') {
                window.Cart.initButtons();
            }
            
            if (window.Wishlist && typeof window.Wishlist.initButtons === 'function') {
                window.Wishlist.initButtons();
            }
        }
        
        // Infinite scroll handling
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading && hasMoreProducts) {
                    loadMoreProducts();
                }
            });
        }, {
            rootMargin: '100px'
        });
        
        // Start observing the sentinel element
        observer.observe(sentinel);

        // Initial event listeners
        attachEventListeners();
    }

    // Handle view options (grid/list view)
    const viewOptions = document.querySelectorAll('.view-options .btn');
    const productsGrid = document.querySelector('#products-grid');
    
    if (viewOptions && productsGrid) {
        viewOptions.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                viewOptions.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Toggle between grid and list view
                if (this.querySelector('i').classList.contains('fa-list')) {
                    productsGrid.classList.add('list-view');
                } else {
                    productsGrid.classList.remove('list-view');
                }
            });
        });
    }
}); 