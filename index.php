<?php
session_start();
require_once 'config/database.php';

// Handle login
$login_error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = sanitize_input($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $login_error = 'Please enter both email and password.';
    } else {
        $stmt = $pdo->prepare("SELECT id, username, email, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && verify_password($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            redirect('/dashboard/');
        } else {
            $login_error = 'Invalid email or password.';
        }
    }
}

// Handle registration
$registration_error = '';
$registration_success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    $username = sanitize_input($_POST['username'] ?? '');
    $email = sanitize_input($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Validation
    if (empty($username) || empty($email) || empty($password)) {
        $registration_error = 'All fields are required.';
    } elseif (strlen($username) < 3) {
        $registration_error = 'Username must be at least 3 characters long.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $registration_error = 'Please enter a valid email address.';
    } elseif (strlen($password) < 6) {
        $registration_error = 'Password must be at least 6 characters long.';
    } elseif ($password !== $confirm_password) {
        $registration_error = 'Passwords do not match.';
    } else {
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            $registration_error = 'Username or email already exists.';
        } else {
            // Create new user
            $hashed_password = hash_password($password);
            
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, datetime('now'))");
            
            if ($stmt->execute([$username, $email, $hashed_password])) {
                // Get the new user's ID
                $user_id = $pdo->lastInsertId();
                
                // Automatically log in the user
                $_SESSION['user_id'] = $user_id;
                $_SESSION['username'] = $username;
                $_SESSION['email'] = $email;
                
                // Send welcome email
                $subject = "Welcome to BorrowBee! 🐝";
                $message = "
                    <h2>Welcome to BorrowBee, $username!</h2>
                    <p>Your account has been created successfully. You can now:</p>
                    <ul>
                        <li>Browse our extensive book collection</li>
                        <li>Request to borrow books</li>
                        <li>Rate and review books</li>
                        <li>Connect with other book lovers</li>
                    </ul>
                    <p>Happy reading!</p>
                    <p>The BorrowBee Team 🐝</p>
                ";
                
                send_email($email, $subject, $message);
                
                // Redirect to dashboard
                redirect('/dashboard/');
            } else {
                $registration_error = 'Failed to create account. Please try again.';
            }
        }
    }
}

// Get search and filter parameters
$search_query = sanitize_input($_GET['search'] ?? '');
$category_filter = sanitize_input($_GET['genre'] ?? '');
$rating_filter = floatval($_GET['rating'] ?? 0);

// Get pagination parameters
$page = max(1, intval($_GET['page'] ?? 1));
$per_page = 12;
$offset = ($page - 1) * $per_page;

// Auto-disable expired books
$pdo->exec("
    UPDATE books 
    SET available = 0 
    WHERE available = 1 
    AND availability_start_date IS NOT NULL
    AND (
        (availability_period = '3days' AND datetime(availability_start_date, '+3 days') < datetime('now')) OR
        (availability_period = 'week' AND datetime(availability_start_date, '+7 days') < datetime('now')) OR
        (availability_period = 'month' AND datetime(availability_start_date, '+1 month') < datetime('now'))
    )
");

// Build WHERE clause for filters
$where_conditions = ["b.active = 1", "b.available = 1"];
$params = [];

if (!empty($search_query)) {
    $where_conditions[] = "(b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)";
    $search_param = "%$search_query%";
    $params[] = $search_param;
    $params[] = $search_param;
    $params[] = $search_param;
}

if (!empty($category_filter)) {
    if ($category_filter === 'educational') {
        // Map educational to science and guide categories
        $where_conditions[] = "(b.category = ? OR b.category = ?)";
        $params[] = 'science';
        $params[] = 'guide';
    } else {
        $where_conditions[] = "b.category = ?";
        $params[] = $category_filter;
    }
}

$where_clause = implode(" AND ", $where_conditions);

// Get total count of filtered books
if ($rating_filter > 0) {
    $count_sql = "
        SELECT COUNT(*) FROM (
            SELECT b.id
            FROM books b
            LEFT JOIN reviews r ON b.id = r.book_id
            WHERE $where_clause
            GROUP BY b.id
            HAVING COALESCE(AVG(r.rating), 0) >= CAST(? AS REAL)
        ) as filtered_books
    ";
    $count_params = array_merge($params, [$rating_filter]);
} else {
    $count_sql = "
        SELECT COUNT(DISTINCT b.id) 
        FROM books b
        WHERE $where_clause
    ";
    $count_params = $params;
}

$count_stmt = $pdo->prepare($count_sql);
$count_stmt->execute($count_params);
$total_books = $count_stmt->fetchColumn();

$total_pages = ceil($total_books / $per_page);

// Get books for current page with ratings and filters
$books_sql = "
    SELECT b.*, 
           COALESCE(AVG(r.rating), 0) as average_rating,
           COUNT(r.rating) as rating_count
    FROM books b
    LEFT JOIN reviews r ON b.id = r.book_id
    WHERE $where_clause
    GROUP BY b.id
";

if ($rating_filter > 0) {
    $books_sql .= " HAVING COALESCE(AVG(r.rating), 0) >= CAST(? AS REAL)";
    $books_params = array_merge($params, [$rating_filter]);
} else {
    $books_params = $params;
}

$books_sql .= " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
$books_params[] = $per_page;
$books_params[] = $offset;

$stmt = $pdo->prepare($books_sql);
$stmt->execute($books_params);
$recent_books = $stmt->fetchAll();





$page_title = "BorrowBee Digital Library";
include 'includes/header.php';
include 'includes/nav.php';
?>

<main>
    <div class="container">
        <!-- Hero Section -->
        <section class="hero">
            <h1 style="font-weight: bold;">Welcome to Your Reading Adventure!</h1>
            <p style="font-weight: bold;">🐝 Buzz into Knowledge - Discover, Borrow, and Enjoy Your Favorite Books! 🍯</p>
        </section>

        <!-- Search Section -->
        <section class="search-section">
            <form action="/" method="GET" class="search-container">
                <input 
                    type="text" 
                    name="search" 
                    placeholder="Search for books, authors, or genres..." 
                    class="search-input"
                    value="<?php echo htmlspecialchars($_GET['search'] ?? ''); ?>"
                >
                <button type="submit" class="btn btn-primary">🔍 Search</button>
            </form>
            
            <div class="search-filters">
                <select name="genre" class="filter-select" onchange="this.form.submit()" form="filter-form">
                    <option value="">📚 All Genres</option>
                    <option value="Fiction" <?php echo ($category_filter === 'Fiction') ? 'selected' : ''; ?>>📖 Fiction</option>
                    <option value="Fantasy" <?php echo ($category_filter === 'Fantasy') ? 'selected' : ''; ?>>✨ Fantasy</option>
                    <option value="Science Fiction" <?php echo ($category_filter === 'Science Fiction') ? 'selected' : ''; ?>>🚀 Science Fiction</option>
                    <option value="Adventure" <?php echo ($category_filter === 'Adventure') ? 'selected' : ''; ?>>🗺️ Adventure</option>
                    <option value="Educational" <?php echo ($category_filter === 'Educational') ? 'selected' : ''; ?>>🎓 Educational</option>
                    <option value="Mystery" <?php echo ($category_filter === 'Mystery') ? 'selected' : ''; ?>>🔍 Mystery</option>
                    <option value="Romance" <?php echo ($category_filter === 'Romance') ? 'selected' : ''; ?>>💕 Romance</option>
                    <option value="Biography" <?php echo ($category_filter === 'Biography') ? 'selected' : ''; ?>>👤 Biography</option>
                    <option value="History" <?php echo ($category_filter === 'History') ? 'selected' : ''; ?>>📜 History</option>
                    <option value="Children" <?php echo ($category_filter === 'Children') ? 'selected' : ''; ?>>🧸 Children</option>
                </select>
                
                <select name="rating" class="filter-select" onchange="this.form.submit()" form="filter-form">
                    <option value="">🐝 Any Rating</option>
                    <option value="1" <?php echo ($rating_filter == 1) ? 'selected' : ''; ?>>🐝 1+ Bees</option>
                    <option value="2" <?php echo ($rating_filter == 2) ? 'selected' : ''; ?>>🐝🐝 2+ Bees</option>
                    <option value="3" <?php echo ($rating_filter == 3) ? 'selected' : ''; ?>>🐝🐝🐝 3+ Bees</option>
                    <option value="4" <?php echo ($rating_filter == 4) ? 'selected' : ''; ?>>🐝🐝🐝🐝 4+ Bees</option>
                    <option value="5" <?php echo ($rating_filter == 5) ? 'selected' : ''; ?>>🐝🐝🐝🐝🐝 5 Bees</option>
                </select>
            </div>
            
            <form id="filter-form" action="/" method="GET" style="display: none;">
                <input type="hidden" name="search" value="<?php echo htmlspecialchars($search_query); ?>">
            </form>
        </section>

        <!-- Books Section -->
        <section class="books-section">
            <h2>🍯 Fresh Arrivals</h2>

            <?php if (count($recent_books) > 0): ?>
                <div id="books-container" class="books-grid">
                    <?php foreach ($recent_books as $book): ?>
                        <div class="simple-book-card">
                            <div class="simple-book-image">
                                <?php if (!empty($book['cover_image'])): ?>
                                    <?php 
                                    // Check if it's an external URL or local file
                                    $image_src = (strpos($book['cover_image'], 'http') === 0) 
                                        ? htmlspecialchars($book['cover_image']) 
                                        : '/uploads/' . htmlspecialchars($book['cover_image']);
                                    ?>
                                    <img src="<?php echo $image_src; ?>" alt="<?php echo htmlspecialchars($book['title']); ?>">
                                <?php else: ?>
                                    <div class="no-image">📚</div>
                                <?php endif; ?>
                            </div>
                            <div class="simple-book-info">
                                <h3 style="line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-wrap: break-word;">
                                    <?php 
                                    $title = htmlspecialchars($book['title']);
                                    echo strlen($title) > 50 ? substr($title, 0, 50) . '...' : $title;
                                    ?>
                                </h3>
                                <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    by <?php 
                                    $author = htmlspecialchars($book['author']);
                                    echo strlen($author) > 30 ? substr($author, 0, 30) . '...' : $author;
                                    ?>
                                </p>
                                
                                <?php if (!empty($book['category'])): ?>
                                    <span class="simple-genre"><?php echo htmlspecialchars($book['category']); ?></span>
                                <?php endif; ?>
                                
                                <?php if (!empty($book['age_group'])): ?>
                                    <p style="color: #666; font-size: 0.9rem; margin: 0.75rem 0; font-style: italic;">
                                        Ages: <?php echo htmlspecialchars($book['age_group']); ?>
                                    </p>
                                <?php endif; ?>
                                
                                <!-- Rating display and interaction -->
                                <div style="margin-top: 1rem;">
                                    <?php if (isset($_SESSION['user_id'])): ?>
                                        <?php
                                        // Get user's rating for this book
                                        $stmt = $pdo->prepare("SELECT rating FROM reviews WHERE book_id = ? AND user_id = ?");
                                        $stmt->execute([$book['id'], $_SESSION['user_id']]);
                                        $user_rating = $stmt->fetch();
                                        $current_user_rating = $user_rating ? $user_rating['rating'] : 0;
                                        ?>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <div class="user-rating" data-book-id="<?php echo $book['id']; ?>" style="display: flex; gap: 0.1rem;">
                                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                                    <span class="rating-bee" data-rating="<?php echo $i; ?>" 
                                                          style="font-size: 1.2rem; opacity: <?php echo $i <= $current_user_rating ? '1' : '0.3'; ?>; cursor: pointer; transition: all 0.2s; padding: 2px;"
                                                          onmouseover="highlightRating(this, <?php echo $i; ?>)"
                                                          onmouseout="resetRating(this, <?php echo $current_user_rating; ?>)"
                                                          onclick="submitRating(<?php echo $book['id']; ?>, <?php echo $i; ?>)">🐝</span>
                                                <?php endfor; ?>
                                            </div>
                                            <span style="font-size: 0.9rem; color: #666;">
                                                <?php echo $book['average_rating'] > 0 ? number_format($book['average_rating'], 1) . ' (' . $book['rating_count'] . ')' : 'No ratings'; ?>
                                            </span>
                                        </div>
                                    <?php else: ?>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <div style="display: flex; gap: 0.1rem;">
                                                <?php for ($star = 1; $star <= 5; $star++): ?>
                                                    <span style="font-size: 1.2rem; opacity: <?php echo $star <= round($book['average_rating']) ? '1' : '0.3'; ?>; padding: 2px;">🐝</span>
                                                <?php endfor; ?>
                                            </div>
                                            <span style="font-size: 0.9rem; color: #666;">
                                                <?php echo $book['average_rating'] > 0 ? number_format($book['average_rating'], 1) . ' (' . $book['rating_count'] . ')' : 'No ratings'; ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <a href="/books/detail.php?id=<?php echo $book['id']; ?>" 
                                   style="margin-top: 1rem; padding: 0.8rem; background: linear-gradient(45deg, #f39c12, #e67e22); border: 2px solid #d68910; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; width: 100%; font-size: 1rem; text-decoration: none; display: block; text-align: center;">
                                    View Details
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <!-- Pagination Controls -->
                <?php if ($total_pages > 1): ?>
                    <?php
                    // Build query string for pagination links
                    $query_params = [];
                    if (!empty($search_query)) $query_params['search'] = $search_query;
                    if (!empty($category_filter)) $query_params['genre'] = $category_filter;
                    if ($rating_filter > 0) $query_params['rating'] = $rating_filter;
                    ?>
                    <div id="pagination-container" class="pagination-container">
                        <?php if ($page > 1): ?>
                            <?php 
                            $prev_params = array_merge($query_params, ['page' => $page - 1]);
                            ?>
                            <a href="?<?php echo http_build_query($prev_params); ?>" class="pagination-btn">
                                <span>🐝</span> Previous
                            </a>
                        <?php else: ?>
                            <button class="pagination-btn" disabled>
                                <span>🐝</span> Previous
                            </button>
                        <?php endif; ?>
                        
                        <div class="pagination-info">
                            <span>Page <?php echo $page; ?> of <?php echo $total_pages; ?></span>
                            <span class="books-count">(<?php echo $total_books; ?> books total)</span>
                        </div>
                        
                        <?php if ($page < $total_pages): ?>
                            <?php 
                            $next_params = array_merge($query_params, ['page' => $page + 1]);
                            ?>
                            <a href="?<?php echo http_build_query($next_params); ?>" class="pagination-btn">
                                Next <span>🐝</span>
                            </a>
                        <?php else: ?>
                            <button class="pagination-btn" disabled>
                                Next <span>🐝</span>
                            </button>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <div style="text-align: center; padding: 3rem 0; font-size: 1.5rem; color: #666;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                    No books available yet. Be the first to add one!
                </div>
            <?php endif; ?>
        </section>
    </div>
</main>

<!-- Login Modal -->
<div id="loginModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal('loginModal')">&times;</button>
        <div class="auth-header">
            <h1 class="auth-title">
                Welcome Back to BorrowBee
                <span class="bee-icon">🐝</span>
            </h1>
            <p class="auth-subtitle">Sign in to continue your reading journey</p>
        </div>
        
        <?php if ($login_error): ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <?= htmlspecialchars($login_error) ?>
            </div>
        <?php endif; ?>
        
        <form class="auth-form" method="POST" action="">
            <div class="form-group">
                <label for="login_email" class="form-label">Email Address</label>
                <div class="input-wrapper">
                    <input 
                        type="email" 
                        id="login_email" 
                        name="email" 
                        class="form-input"
                        placeholder="Enter your email"
                        required
                    >
                </div>
            </div>
            
            <div class="form-group">
                <label for="login_password" class="form-label">Password</label>
                <div class="input-wrapper">
                    <input 
                        type="text" 
                        id="login_password" 
                        name="password" 
                        class="form-input"
                        placeholder="Enter your password"
                        required
                    >
                </div>
            </div>
            
            <div class="form-options">
                <label class="checkbox-label">
                    <input type="checkbox" name="remember" class="checkbox">
                    <span class="checkmark"></span>
                    Remember me
                </label>
                <a href="/auth/forgot-password.php" class="forgot-link">Forgot password?</a>
            </div>
            
            <input type="hidden" name="action" value="login">
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-sign-in-alt"></i>
                Sign In
            </button>
        </form>
        
        <div class="auth-footer">
            <p class="auth-switch">
                Don't have an account? 
                <a href="#" onclick="switchModal('loginModal', 'registerModal')" class="auth-link">Join the hive</a>
            </p>
        </div>
    </div>
</div>

<!-- Register Modal -->
<div id="registerModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal('registerModal')">&times;</button>
        <div class="auth-header">
            <h1 class="auth-title">
                Join the BorrowBee Hive
                <span class="bee-icon">🐝</span>
            </h1>
            <p class="auth-subtitle">Create your account and start your reading adventure</p>
        </div>
        
        <?php if ($registration_success): ?>
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <?= htmlspecialchars($registration_success) ?>
                <button onclick="switchModal('registerModal', 'loginModal')" class="btn btn-link">Sign in now</button>
            </div>
        <?php endif; ?>
        
        <?php if ($registration_error): ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <?= htmlspecialchars($registration_error) ?>
            </div>
        <?php endif; ?>
        
        <form class="auth-form" method="POST" action="">
            <div class="form-group">
                <label for="register_username" class="form-label">Username</label>
                <div class="input-wrapper">
                    <input 
                        type="text" 
                        id="register_username" 
                        name="username" 
                        class="form-input"
                        placeholder="Choose a username"
                        required
                        minlength="3"
                    >
                </div>
            </div>
            
            <div class="form-group">
                <label for="register_email" class="form-label">Email Address</label>
                <div class="input-wrapper">
                    <input 
                        type="email" 
                        id="register_email" 
                        name="email" 
                        class="form-input"
                        placeholder="Enter your email"
                        required
                    >
                </div>
            </div>
            
            <div class="form-group">
                <label for="register_password" class="form-label">Password</label>
                <div class="input-wrapper">
                    <input 
                        type="text" 
                        id="register_password" 
                        name="password" 
                        class="form-input"
                        placeholder="Create a password"
                        required
                        minlength="6"
                    >
                </div>
            </div>
            
            <div class="form-group">
                <label for="register_confirm_password" class="form-label">Confirm Password</label>
                <div class="input-wrapper">
                    <input 
                        type="text" 
                        id="register_confirm_password" 
                        name="confirm_password" 
                        class="form-input"
                        placeholder="Confirm your password"
                        required
                    >
                </div>
            </div>
            

            
            <input type="hidden" name="action" value="register">
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-user-plus"></i>
                Create Account
            </button>
        </form>
        
        <div class="auth-footer">
            <p class="auth-switch">
                Already have an account? 
                <a href="#" onclick="switchModal('registerModal', 'loginModal')" class="auth-link">Sign in</a>
            </p>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>

<script>
    // Auto-open registration modal if there are registration messages
    <?php if ($registration_success || $registration_error): ?>
        document.addEventListener('DOMContentLoaded', function() {
            openModal('registerModal');
        });
    <?php endif; ?>
</script>