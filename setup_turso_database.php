<?php
require_once 'config/database_turso.php';

echo "Setting up Turso database tables...\n";

try {
    $turso = new TursoDatabase();
    
    // Create users table
    $createUsers = "
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        address TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";
    
    $turso->execute($createUsers);
    echo "✓ Users table created\n";
    
    // Create books table
    $createBooks = "
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        age_group TEXT,
        description TEXT,
        cover_image TEXT,
        user_id INTEGER NOT NULL,
        available INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        availability_period TEXT DEFAULT 'week',
        availability_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )";
    
    $turso->execute($createBooks);
    echo "✓ Books table created\n";
    
    // Create book_ratings table
    $createRatings = "
    CREATE TABLE IF NOT EXISTS book_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(book_id, user_id)
    )";
    
    $turso->execute($createRatings);
    echo "✓ Book ratings table created\n";
    
    // Create book_requests table
    $createRequests = "
    CREATE TABLE IF NOT EXISTS book_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
    )";
    
    $turso->execute($createRequests);
    echo "✓ Book requests table created\n";
    
    echo "\n🎉 Database setup complete! All tables created successfully.\n";
    
} catch (Exception $e) {
    echo "❌ Error setting up database: " . $e->getMessage() . "\n";
}
?>