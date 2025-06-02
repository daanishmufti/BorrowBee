from app import db
from models import User, Book, Review, BorrowRequest
from werkzeug.security import generate_password_hash
from datetime import datetime
import logging

def init_database():
    """Initialize database with sample data that matches the PHP project"""
    try:
        # Create all tables
        db.create_all()
        
        # Check if data already exists
        if User.query.first():
            logging.info("Database already initialized")
            return
        
        # Create sample users
        admin_user = User(
            username='admin',
            email='admin@borrowbee.com',
            password=generate_password_hash('admin123')
        )
        
        regular_user = User(
            username='john_doe',
            email='john@example.com',
            password=generate_password_hash('password123')
        )
        
        db.session.add(admin_user)
        db.session.add(regular_user)
        db.session.commit()
        
        # Create sample books with the same data as PHP project
        books_data = [
            {
                'title': 'The Great Adventure',
                'author': 'John Smith',
                'description': 'An epic tale of courage and discovery.',
                'category': 'Adventure',
                'cover_image': 'book1.jpg',
                'age_group': '12+'
            },
            {
                'title': 'Mystery of the Lost City',
                'author': 'Sarah Johnson',
                'description': 'A thrilling mystery that will keep you guessing.',
                'category': 'Mystery',
                'cover_image': 'book2.jpg',
                'age_group': '14+'
            },
            {
                'title': 'Space Explorers',
                'author': 'Mike Wilson',
                'description': 'Journey to the stars in this sci-fi adventure.',
                'category': 'Science Fiction',
                'cover_image': 'book3.jpg',
                'age_group': '10+'
            },
            {
                'title': 'Magic and Wizards',
                'author': 'Emma Davis',
                'description': 'Enter a world of magic and wonder.',
                'category': 'Fantasy',
                'cover_image': 'book4.jpg',
                'age_group': '8+'
            },
            {
                'title': 'Learning Python',
                'author': 'Tech Expert',
                'description': 'A comprehensive guide to Python programming.',
                'category': 'Educational',
                'cover_image': 'book5.jpg',
                'age_group': '16+'
            }
        ]
        
        for i, book_data in enumerate(books_data):
            book = Book(
                title=book_data['title'],
                author=book_data['author'],
                description=book_data['description'],
                category=book_data['category'],
                cover_image=book_data['cover_image'],
                age_group=book_data['age_group'],
                available=True,
                active=True,
                user_id=1 if i % 2 == 0 else 2,  # Alternate between users 1 and 2
                availability_period='week',
                availability_start_date=datetime.utcnow()
            )
            db.session.add(book)
        
        db.session.commit()
        logging.info("Database initialization completed")
        
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        db.session.rollback()
        raise