<?php
/**
 * Export SQLite data to MySQL format for InfinityFree migration
 * Run this file to generate MySQL INSERT statements from your current data
 */

require_once 'config/database.php';

echo "-- BorrowBee Data Export for MySQL Migration\n";
echo "-- Generated on " . date('Y-m-d H:i:s') . "\n\n";

// Export users
echo "-- Users data\n";
$stmt = $pdo->query("SELECT * FROM users ORDER BY id");
$users = $stmt->fetchAll();

foreach ($users as $user) {
    $id = $user['id'];
    $username = addslashes($user['username']);
    $email = addslashes($user['email']);
    $password = addslashes($user['password']);
    $full_name = addslashes($user['full_name'] ?? '');
    $phone = addslashes($user['phone'] ?? '');
    $address = addslashes($user['address'] ?? '');
    $created_at = $user['created_at'];
    $updated_at = $user['updated_at'];
    
    echo "INSERT INTO users (id, username, email, password, full_name, phone, address, created_at, updated_at) VALUES ";
    echo "($id, '$username', '$email', '$password', '$full_name', '$phone', '$address', '$created_at', '$updated_at');\n";
}

echo "\n-- Books data\n";
$stmt = $pdo->query("SELECT * FROM books ORDER BY id");
$books = $stmt->fetchAll();

foreach ($books as $book) {
    $id = $book['id'];
    $title = addslashes($book['title']);
    $author = addslashes($book['author']);
    $isbn = addslashes($book['isbn'] ?? '');
    $description = addslashes($book['description'] ?? '');
    $category = addslashes($book['category'] ?? '');
    $cover_image = addslashes($book['cover_image'] ?? '');
    $condition_notes = addslashes($book['condition_notes'] ?? '');
    $user_id = $book['user_id'];
    $available = $book['available'];
    $active = $book['active'];
    $age_group = addslashes($book['age_group'] ?? '');
    $availability_period = addslashes($book['availability_period'] ?? 'week');
    $availability_start_date = $book['availability_start_date'] ? "'" . $book['availability_start_date'] . "'" : 'NULL';
    $created_at = $book['created_at'];
    $updated_at = $book['updated_at'];
    
    echo "INSERT INTO books (id, title, author, isbn, description, category, cover_image, condition_notes, user_id, available, active, age_group, availability_period, availability_start_date, created_at, updated_at) VALUES ";
    echo "($id, '$title', '$author', '$isbn', '$description', '$category', '$cover_image', '$condition_notes', $user_id, $available, $active, '$age_group', '$availability_period', $availability_start_date, '$created_at', '$updated_at');\n";
}

// Export reviews if table exists
try {
    echo "\n-- Reviews data\n";
    $stmt = $pdo->query("SELECT * FROM reviews ORDER BY id");
    $reviews = $stmt->fetchAll();
    
    foreach ($reviews as $review) {
        $id = $review['id'];
        $book_id = $review['book_id'];
        $user_id = $review['user_id'];
        $rating = $review['rating'];
        $comment = addslashes($review['comment'] ?? '');
        $created_at = $review['created_at'];
        
        echo "INSERT INTO reviews (id, book_id, user_id, rating, comment, created_at) VALUES ";
        echo "($id, $book_id, $user_id, $rating, '$comment', '$created_at');\n";
    }
} catch (Exception $e) {
    echo "-- No reviews table found or empty\n";
}

// Export borrow requests if table exists
try {
    echo "\n-- Borrow requests data\n";
    $stmt = $pdo->query("SELECT * FROM borrow_requests ORDER BY id");
    $requests = $stmt->fetchAll();
    
    foreach ($requests as $request) {
        $id = $request['id'];
        $book_id = $request['book_id'];
        $borrower_id = $request['borrower_id'];
        $owner_id = $request['owner_id'];
        $status = addslashes($request['status']);
        $message = addslashes($request['message'] ?? '');
        $requested_at = $request['requested_at'];
        $responded_at = $request['responded_at'] ? "'" . $request['responded_at'] . "'" : 'NULL';
        
        echo "INSERT INTO borrow_requests (id, book_id, borrower_id, owner_id, status, message, requested_at, responded_at) VALUES ";
        echo "($id, $book_id, $borrower_id, $owner_id, '$status', '$message', '$requested_at', $responded_at);\n";
    }
} catch (Exception $e) {
    echo "-- No borrow_requests table found or empty\n";
}

echo "\n-- Data export completed\n";
?>