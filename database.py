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
        
        # No sample users or books will be created - completely clean database
        
        db.session.commit()
        logging.info("Database initialization completed")
        
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        db.session.rollback()
        raise