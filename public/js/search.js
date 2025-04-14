// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('.search-bar form');
    const searchInput = document.querySelector('.search-bar input[type="search"]');

    // Handle form submission and redirect to shop page with search query
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `/shop?search=${encodeURIComponent(query)}`;
        }
    });

    // Optional: Submit search on enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/shop?search=${encodeURIComponent(query)}`;
            }
        }
    });
}); 