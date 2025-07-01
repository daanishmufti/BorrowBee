// BorrowBee - Original JavaScript functionality from PHP project

// Global variables
let currentBookId = null;

// Ensure DOM is loaded before adding event listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    console.log('BorrowBee app initialized');
    setupEventListeners();
}

function setupEventListeners() {
    // Add click event listeners for modal close buttons
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Add click event listeners for modal backgrounds
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchModal(fromModal, toModal) {
    closeModal(fromModal);
    openModal(toModal);
}

// Rating functions
function highlightRating(element, rating) {
    const container = element.parentElement;
    const bees = container.querySelectorAll('.rating-bee');
    
    bees.forEach((bee, index) => {
        bee.style.opacity = (index < rating) ? '1' : '0.3';
    });
}

function resetRating(element, currentRating) {
    const container = element.parentElement;
    const bees = container.querySelectorAll('.rating-bee');
    
    bees.forEach((bee, index) => {
        bee.style.opacity = (index < currentRating) ? '1' : '0.3';
    });
}

function submitRating(bookId, rating) {
    fetch('/submit-rating', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            book_id: bookId,
            rating: rating
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the rating display
            const container = document.querySelector(`[data-book-id="${bookId}"]`);
            if (container) {
                const bees = container.querySelectorAll('.rating-bee');
                bees.forEach((bee, index) => {
                    bee.style.opacity = (index < rating) ? '1' : '0.3';
                });
                
                // Update the rating text
                const ratingText = container.parentElement.querySelector('span');
                if (ratingText && data.average_rating) {
                    ratingText.textContent = `${data.average_rating.toFixed(1)} (${data.rating_count})`;
                }
            }
        } else {
            alert('Failed to submit rating. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit rating. Please try again.');
    });
}

// Borrow request functions - exact replica of PHP project
function requestBorrow(bookId) {
    currentBookId = bookId;
    
    // Get book details and show modal
    const book = document.querySelector(`[data-book-id="${bookId}"]`);
    if (book) {
        const title = book.querySelector('.book-title')?.textContent || 'Unknown Title';
        const author = book.querySelector('.book-author')?.textContent || 'Unknown Author';
        
        document.getElementById('borrowBookInfo').innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h4>${title}</h4>
                <p>by ${author}</p>
            </div>
        `;
        
        openModal('borrowModal');
    }
}

function submitBorrowRequest() {
    const messageField = document.getElementById('borrowMessage');
    const message = messageField.value.trim();
    
    if (!message) {
        alert('Please include a message with your request');
        return;
    }
    
    if (!currentBookId) {
        alert('Invalid book selection');
        return;
    }
    
    // Create form data - exact same as PHP project
    const formData = new FormData();
    formData.append('book_id', currentBookId);
    formData.append('message', message);
    
    // Send request to API endpoint matching PHP structure
    fetch('/api/borrow-request', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeBorrowModal();
            // Optionally reload the page to update any UI state
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to send request. Please try again.');
    });
}

function closeBorrowModal() {
    closeModal('borrowModal');
    document.getElementById('borrowMessage').value = '';
    currentBookId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Handle form submissions
    const loginForm = document.querySelector('#loginModal form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                e.preventDefault();
                alert('Please enter both email and password.');
                return false;
            }
        });
    }
    
    const registerForm = document.querySelector('#registerModal form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value;
            const email = document.getElementById('reg_email').value;
            const password = document.getElementById('reg_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (!username || !email || !password || !confirmPassword) {
                e.preventDefault();
                alert('All fields are required.');
                return false;
            }
            
            if (username.length < 3) {
                e.preventDefault();
                alert('Username must be at least 3 characters long.');
                return false;
            }
            
            if (password.length < 6) {
                e.preventDefault();
                alert('Password must be at least 6 characters long.');
                return false;
            }
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match.');
                return false;
            }
        });
    }
    
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', function(e) {
            if (!currentBookId) {
                e.preventDefault();
                alert('Please select a book to borrow.');
                return false;
            }
        });
    }
    
    // Handle filter form submissions
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            const form = document.getElementById('filter-form');
            if (form) {
                // Update hidden search field
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    form.querySelector('input[name="search"]').value = searchInput.value;
                }
                
                // Add current filter values to form
                const genreSelect = document.querySelector('select[name="genre"]');
                const ratingSelect = document.querySelector('select[name="rating"]');
                
                if (genreSelect && genreSelect.value) {
                    let genreInput = form.querySelector('input[name="genre"]');
                    if (!genreInput) {
                        genreInput = document.createElement('input');
                        genreInput.type = 'hidden';
                        genreInput.name = 'genre';
                        form.appendChild(genreInput);
                    }
                    genreInput.value = genreSelect.value;
                }
                
                if (ratingSelect && ratingSelect.value) {
                    let ratingInput = form.querySelector('input[name="rating"]');
                    if (!ratingInput) {
                        ratingInput = document.createElement('input');
                        ratingInput.type = 'hidden';
                        ratingInput.name = 'rating';
                        form.appendChild(ratingInput);
                    }
                    ratingInput.value = ratingSelect.value;
                }
                
                form.submit();
            }
        });
    });
});

// Utility functions
function shareBook() {
    if (navigator.share) {
        navigator.share({
            title: 'BorrowBee Digital Library',
            text: 'Check out this amazing book collection!',
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        }).catch(() => {
            alert('Unable to share. Please copy the URL manually.');
        });
    }
}

// Initialize page
window.addEventListener('load', function() {
    // Add loading animations
    const bookCards = document.querySelectorAll('.simple-book-card');
    bookCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});