/**
 * BorrowBee - Main JavaScript functionality
 * Handles interactive features, form validation, and UI enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Initialize all functionality
    initializeSearchFilters();
    initializeFormValidation();
    initializeFileUpload();
    initializeConfirmations();
    initializeTooltips();
    initializeImagePreview();
    initializeDateValidation();
    initializeAutoSearch();
});

/**
 * Search and filter functionality
 */
function initializeSearchFilters() {
    const searchForm = document.querySelector('form[method="GET"]');
    const searchInput = document.querySelector('input[name="search"]');
    const categorySelect = document.querySelector('select[name="category"]');

    if (searchForm && (searchInput || categorySelect)) {
        // Auto-submit form when category changes
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                searchForm.submit();
            });
        }

        // Add search keyboard shortcuts
        if (searchInput) {
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    this.value = '';
                    searchForm.submit();
                }
            });

            // Focus search input with '/' key
            document.addEventListener('keydown', function(e) {
                if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        }
    }
}

/**
 * Form validation enhancements
 */
function initializeFormValidation() {
    // Password confirmation validation
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm_password');

    if (passwordField && confirmPasswordField) {
        function validatePasswords() {
            if (passwordField.value !== confirmPasswordField.value) {
                confirmPasswordField.setCustomValidity("Passwords don't match");
                confirmPasswordField.classList.add('is-invalid');
            } else {
                confirmPasswordField.setCustomValidity('');
                confirmPasswordField.classList.remove('is-invalid');
                confirmPasswordField.classList.add('is-valid');
            }
        }

        passwordField.addEventListener('input', validatePasswords);
        confirmPasswordField.addEventListener('input', validatePasswords);
    }

    // ISBN format validation
    const isbnField = document.getElementById('isbn');
    if (isbnField) {
        isbnField.addEventListener('input', function() {
            const isbn = this.value.replace(/[^0-9X]/g, '');
            if (isbn.length === 10 || isbn.length === 13) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else if (isbn.length > 0) {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            } else {
                this.classList.remove('is-invalid', 'is-valid');
            }
        });
    }

    // Publication year validation
    const yearField = document.getElementById('publication_year');
    if (yearField) {
        const currentYear = new Date().getFullYear();
        yearField.max = currentYear;
        
        yearField.addEventListener('input', function() {
            const year = parseInt(this.value);
            if (year && (year < 1000 || year > currentYear)) {
                this.setCustomValidity(`Year must be between 1000 and ${currentYear}`);
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
                if (this.value) this.classList.add('is-valid');
            }
        });
    }

    // Total copies validation
    const totalCopiesField = document.getElementById('total_copies');
    if (totalCopiesField) {
        totalCopiesField.addEventListener('input', function() {
            const copies = parseInt(this.value);
            if (copies && copies < 1) {
                this.setCustomValidity('Total copies must be at least 1');
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
                if (this.value) this.classList.add('is-valid');
            }
        });
    }
}

/**
 * File upload enhancements
 */
function initializeFileUpload() {
    const fileInput = document.getElementById('cover_image');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (16MB max)
                const maxSize = 16 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('File size must be less than 16MB');
                    this.value = '';
                    return;
                }

                // Validate file type
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Please select a valid image file (PNG, JPG, JPEG, GIF)');
                    this.value = '';
                    return;
                }

                // Show file info
                const fileInfo = document.createElement('div');
                fileInfo.className = 'mt-2 text-success small';
                fileInfo.innerHTML = `<i data-feather="check-circle"></i> Selected: ${file.name} (${formatFileSize(file.size)})`;
                
                // Remove any existing file info
                const existingInfo = this.parentNode.querySelector('.file-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                fileInfo.className += ' file-info';
                this.parentNode.appendChild(fileInfo);
                
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        });
    }
}

/**
 * Confirmation dialogs for dangerous actions
 */
function initializeConfirmations() {
    // Delete confirmations
    const deleteButtons = document.querySelectorAll('button[onclick*="confirm"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Borrow confirmations
    const borrowForms = document.querySelectorAll('form[action*="borrow_book"]');
    borrowForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to borrow this book?')) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Return confirmations
    const returnForms = document.querySelectorAll('form[action*="return_book"]');
    returnForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to return this book?')) {
                e.preventDefault();
                return false;
            }
        });
    });
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length > 0 && typeof bootstrap !== 'undefined') {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
}

/**
 * Image preview functionality
 */
function initializeImagePreview() {
    const coverInput = document.getElementById('cover_image');
    if (coverInput) {
        coverInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Create or update preview
                    let preview = document.getElementById('cover-preview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.id = 'cover-preview';
                        preview.className = 'mt-3';
                        coverInput.parentNode.appendChild(preview);
                    }
                    
                    preview.innerHTML = `
                        <div class="card" style="max-width: 200px;">
                            <img src="${e.target.result}" class="card-img-top" alt="Cover preview" style="height: 250px; object-fit: cover;">
                            <div class="card-body p-2">
                                <small class="text-muted">Preview</small>
                            </div>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

/**
 * Date validation for forms
 */
function initializeDateValidation() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today && this.name !== 'publication_date') {
                this.setCustomValidity('Date cannot be in the past');
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
            }
        });
    });
}

/**
 * Auto-search functionality with debounce
 */
function initializeAutoSearch() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput && searchInput.getAttribute('data-auto-search') !== 'false') {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.value.length >= 3 || this.value.length === 0) {
                    this.form.submit();
                }
            }, 500);
        });
    }
}

/**
 * Utility function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Loading state management
 */
function showLoading(element) {
    if (element) {
        element.innerHTML = '<span class="loading"></span> Loading...';
        element.disabled = true;
    }
}

function hideLoading(element, originalText) {
    if (element) {
        element.innerHTML = originalText;
        element.disabled = false;
    }
}

/**
 * Theme management
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
}

/**
 * Enhanced search functionality
 */
function enhanceSearch() {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        // Add recent searches
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Create search suggestions dropdown
        const searchInput = searchContainer.querySelector('input[name="search"]');
        if (searchInput && recentSearches.length > 0) {
            const dropdown = document.createElement('div');
            dropdown.className = 'search-suggestions position-absolute w-100 bg-dark border rounded mt-1 d-none';
            dropdown.style.zIndex = '1000';
            
            recentSearches.slice(0, 5).forEach(search => {
                const item = document.createElement('div');
                item.className = 'p-2 border-bottom cursor-pointer';
                item.textContent = search;
                item.addEventListener('click', () => {
                    searchInput.value = search;
                    searchInput.form.submit();
                });
                dropdown.appendChild(item);
            });
            
            searchContainer.style.position = 'relative';
            searchContainer.appendChild(dropdown);
            
            // Show/hide suggestions
            searchInput.addEventListener('focus', () => {
                if (recentSearches.length > 0) {
                    dropdown.classList.remove('d-none');
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target)) {
                    dropdown.classList.add('d-none');
                }
            });
        }
        
        // Save search on form submit
        const searchForm = searchContainer.querySelector('form');
        if (searchForm) {
            searchForm.addEventListener('submit', () => {
                const searchValue = searchInput.value.trim();
                if (searchValue && !recentSearches.includes(searchValue)) {
                    recentSearches.unshift(searchValue);
                    localStorage.setItem('recentSearches', JSON.stringify(recentSearches.slice(0, 10)));
                }
            });
        }
    }
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', function(e) {
    // Alt + H - Go to home
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
    }
    
    // Alt + B - Go to books
    if (e.altKey && e.key === 'b') {
        e.preventDefault();
        window.location.href = '/books';
    }
    
    // Alt + D - Go to dashboard (if logged in)
    if (e.altKey && e.key === 'd') {
        e.preventDefault();
        const dashboardLink = document.querySelector('a[href="/dashboard"]');
        if (dashboardLink) {
            window.location.href = '/dashboard';
        }
    }
    
    // Escape - Close any open modals or clear search
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal.show');
        if (activeModals.length === 0) {
            const searchInput = document.querySelector('input[name="search"]');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    }
});

/**
 * Enhanced table functionality
 */
function enhanceDataTables() {
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
        // Add sorting capability to table headers
        const headers = table.querySelectorAll('th[data-sortable="true"]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                // Basic client-side sorting (for small datasets)
                console.log('Sorting by:', this.textContent);
            });
        });
        
        // Add row selection for bulk actions (future enhancement)
        const checkboxes = table.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length > 1) {
            const selectAll = checkboxes[0];
            const rowCheckboxes = Array.from(checkboxes).slice(1);
            
            selectAll.addEventListener('change', function() {
                rowCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
            });
        }
    });
}

/**
 * Error handling and user feedback
 */
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // Could implement error reporting here
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Skip if href is just "#" or empty
        if (!href || href === '#') {
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
    enhanceSearch();
    enhanceDataTables();
});

// Export functions for use in other scripts if needed
window.BorrowBee = {
    showLoading,
    hideLoading,
    toggleTheme,
    formatFileSize
};
