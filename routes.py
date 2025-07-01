from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sqlalchemy import text
from app import db
from models import User, Book, Review, BorrowRequest
from auth import login_required
from email_service import send_borrow_request_email
import logging
import math

def get_availability_status(book):
    """Calculate availability status and auto-disable expired books"""
    if not book.availability_start_date:
        return {
            'status': 'expired',
            'color': 'red', 
            'message': 'No start date',
            'expired': True,
            'available': book.available,
            'days_left': 0
        }
    
    current_date = datetime.utcnow()
    start_date = book.availability_start_date
    
    # Calculate expiry date based on period
    if book.availability_period == '3days':
        expiry_date = start_date + timedelta(days=3)
    elif book.availability_period == 'week':
        expiry_date = start_date + timedelta(days=7)
    elif book.availability_period == 'month':
        expiry_date = start_date + timedelta(days=30)
    else:
        expiry_date = start_date + timedelta(days=7)
    
    is_expired = current_date > expiry_date
    
    if is_expired and book.available:
        # Auto-disable book when expired
        book.available = False
        db.session.commit()
    
    if is_expired:
        return {
            'status': 'expired',
            'color': 'red',
            'message': 'Expired',
            'expired': True,
            'available': book.available,
            'days_left': 0
        }
    else:
        days_left = (expiry_date - current_date).days
        return {
            'status': 'active',
            'color': 'green',
            'message': f"Active ({days_left} days left)",
            'expired': False,
            'available': book.available,
            'days_left': days_left
        }

main_bp = Blueprint('main', __name__)

@main_bp.route('/book/<int:book_id>')
def book_detail(book_id):
    """Book detail page with borrow functionality"""
    try:
        # Get book details with owner information
        book = db.session.query(Book, User).join(User, Book.user_id == User.id).filter(
            Book.id == book_id,
            Book.active == True
        ).first()
        
        if not book:
            flash('Book not found.', 'error')
            return redirect(url_for('main.index'))
        
        book_obj, owner = book
        
        # Get book ratings and reviews
        rating_data = db.session.query(
            db.func.coalesce(db.func.avg(Review.rating), 0).label('avg_rating'),
            db.func.count(Review.id).label('rating_count')
        ).filter(Review.book_id == book_id).first()
        
        average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else 0
        rating_count = int(rating_data.rating_count) if rating_data.rating_count else 0
        
        # Get user's rating if logged in
        user_rating = 0
        if session.get('user_id'):
            user_review = Review.query.filter_by(
                book_id=book_id, 
                user_id=session['user_id']
            ).first()
            user_rating = user_review.rating if user_review else 0
        
        # Get availability status
        availability_status = get_availability_status(book_obj)
        
        return render_template('book_detail.html',
                             book=book_obj,
                             owner=owner,
                             average_rating=average_rating,
                             rating_count=rating_count,
                             user_rating=user_rating,
                             availability_status=availability_status)
                             
    except Exception as e:
        logging.error(f"Error loading book detail: {e}")
        flash('Error loading book details. Please try again.', 'error')
        return redirect(url_for('main.index'))

@main_bp.route('/')
def index():
    """Homepage with search, filters, and pagination - exactly like PHP version"""
    try:
        # Get search and filter parameters
        search_query = request.args.get('search', '').strip()
        category_filter = request.args.get('genre', '').strip()
        rating_filter_str = request.args.get('rating', '0').strip()
        rating_filter = float(rating_filter_str) if rating_filter_str else 0
        
        # Get pagination parameters
        page = max(1, int(request.args.get('page', 1)))
        per_page = 12
        offset = (page - 1) * per_page
        
        # Build base query with active and available books
        query = Book.query.filter(Book.active == True, Book.available == True)
        
        # Apply search filter
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                db.or_(
                    Book.title.ilike(search_pattern),
                    Book.author.ilike(search_pattern),
                    Book.description.ilike(search_pattern)
                )
            )
        
        # Apply category filter
        if category_filter:
            if category_filter.lower() == 'educational':
                # Map educational to science and guide categories like PHP
                query = query.filter(
                    db.or_(
                        Book.category == 'science',
                        Book.category == 'guide'
                    )
                )
            else:
                query = query.filter(Book.category == category_filter)
        
        # Get books with ratings
        books_with_ratings = []
        all_books = query.order_by(Book.created_at.desc()).all()
        
        for book in all_books:
            # Get average rating and count
            rating_data = db.session.query(
                db.func.coalesce(db.func.avg(Review.rating), 0).label('avg_rating'),
                db.func.count(Review.rating).label('rating_count')
            ).filter(Review.book_id == book.id).first()
            
            book.average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else 0
            book.rating_count = rating_data.rating_count if rating_data.rating_count else 0
            
            # Get user's rating if logged in
            book.user_rating = 0
            if session.get('user_id'):
                user_review = Review.query.filter_by(
                    book_id=book.id, 
                    user_id=session['user_id']
                ).first()
                book.user_rating = user_review.rating if user_review else 0
            
            # Apply rating filter
            if rating_filter == 0 or book.average_rating >= rating_filter:
                books_with_ratings.append(book)
        
        # Pagination
        total_books = len(books_with_ratings)
        total_pages = math.ceil(total_books / per_page) if total_books > 0 else 1
        start_idx = offset
        end_idx = start_idx + per_page
        recent_books = books_with_ratings[start_idx:end_idx]
        
        return render_template('index.html',
                             recent_books=recent_books,
                             search_query=search_query,
                             category_filter=category_filter,
                             rating_filter=rating_filter,
                             page=page,
                             total_pages=total_pages,
                             total_books=total_books)
    except Exception as e:
        logging.error(f"Error loading home page: {e}")
        return render_template('index.html',
                             recent_books=[],
                             search_query='',
                             category_filter='',
                             rating_filter=0,
                             page=1,
                             total_pages=0,
                             total_books=0)

@main_bp.route('/submit-rating', methods=['POST'])
@login_required
def submit_rating():
    """Submit book rating"""
    logging.info(f"Rating submission attempt from user {session.get('user_id')}")
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            book_id = data.get('book_id')
            rating = int(data.get('rating'))
        else:
            book_id = request.form.get('book_id')
            rating = int(request.form.get('rating'))
        
        if not book_id or rating < 1 or rating > 5:
            return jsonify({'success': False, 'message': 'Invalid rating data'})
        
        # Check if user already rated this book
        existing_review = Review.query.filter_by(
            book_id=book_id,
            user_id=session['user_id']
        ).first()
        
        if existing_review:
            existing_review.rating = rating
        else:
            new_review = Review(
                book_id=book_id,
                user_id=session['user_id'],
                rating=rating
            )
            db.session.add(new_review)
        
        db.session.commit()
        
        # Get updated average rating
        rating_data = db.session.query(
            db.func.avg(Review.rating).label('avg_rating'),
            db.func.count(Review.rating).label('rating_count')
        ).filter(Review.book_id == book_id).first()
        
        response_data = {
            'success': True,
            'new_average': float(rating_data.avg_rating),
            'rating_count': rating_data.rating_count
        }
        logging.info(f"Sending response: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        logging.error(f"Error submitting rating: {e}")
        return jsonify({'success': False, 'message': 'Failed to submit rating'})

@main_bp.route('/api/borrow-request', methods=['POST'])
@login_required
def api_borrow_request():
    """Submit borrow request - exact replica of PHP api/borrow-request.php"""
    try:
        # Get POST data
        book_id = int(request.form.get('book_id', 0))
        message = request.form.get('message', '').strip()
        user_id = session['user_id']
        
        # Validation
        if not book_id:
            return jsonify({'success': False, 'message': 'Invalid book ID'})
            
        if not message:
            return jsonify({'success': False, 'message': 'Please include a message with your request'})
        
        # Check if book exists and is active - exact SQL from PHP
        book_query = db.session.execute(text("""
            SELECT b.id, b.title, b.user_id, u.username as owner_username, u.email as owner_email
            FROM books b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = :book_id AND b.active = TRUE
        """), {'book_id': book_id}).fetchone()
        
        if not book_query:
            return jsonify({'success': False, 'message': 'Book not found or not available'})
        
        book_data = dict(book_query._mapping)
        
        # Check if user is trying to borrow their own book
        if book_data['user_id'] == user_id:
            return jsonify({'success': False, 'message': 'You cannot borrow your own book'})
        
        # Check if user has already requested this book - exact SQL from PHP
        existing_query = db.session.execute(text("""
            SELECT id, status FROM borrow_requests 
            WHERE book_id = :book_id AND user_id = :user_id 
            AND status IN ('pending', 'approved')
        """), {'book_id': book_id, 'user_id': user_id}).fetchone()
        
        if existing_query:
            existing_data = dict(existing_query._mapping)
            status_message = ('You already have a pending request for this book' 
                            if existing_data['status'] == 'pending' 
                            else 'You have already been approved to borrow this book')
            return jsonify({'success': False, 'message': status_message})
        
        # Insert borrow request - exact SQL from PHP
        db.session.execute(text("""
            INSERT INTO borrow_requests (book_id, user_id, message, status, created_at) 
            VALUES (:book_id, :user_id, :message, 'pending', NOW())
        """), {'book_id': book_id, 'user_id': user_id, 'message': message})
        
        # Get borrower info for email
        borrower_query = db.session.execute(text("""
            SELECT username, email FROM users WHERE id = :user_id
        """), {'user_id': user_id}).fetchone()
        
        borrower_data = dict(borrower_query._mapping)
        
        db.session.commit()
        
        # Send email notification to book owner
        email_sent = send_borrow_request_email(
            to_email=book_data['owner_email'],
            from_user_name=borrower_data['username'],
            book_title=book_data['title'],
            message=message,
            from_user_email=borrower_data['email']
        )
        
        if email_sent:
            return jsonify({
                'success': True,
                'message': 'Borrow request sent successfully! The book owner will be notified via email.'
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Borrow request sent successfully! Email notification failed, but your request was saved.'
            })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Borrow request error: {e}")
        return jsonify({'success': False, 'message': 'Failed to send request. Please try again.'})

@main_bp.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    """User dashboard with book management"""
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        if not user:
            flash('User not found. Please login again.', 'error')
            return redirect(url_for('auth.login'))
        
        # Handle profile update
        if request.method == 'POST' and request.form.get('action') == 'update_profile':
            name = request.form.get('name', '').strip()
            phone = request.form.get('phone', '').strip()
            address = request.form.get('address', '').strip()
            
            if name:
                name_parts = name.split(' ', 1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                user.bio = phone
                user.location = address
                user.updated_at = datetime.utcnow()
                
                db.session.commit()
                flash('Profile updated successfully!', 'success')
            else:
                flash('Name is required.', 'error')
        
        # Handle book addition
        elif request.method == 'POST' and request.form.get('action') == 'add_book':
            title = request.form.get('title', '').strip()
            author = request.form.get('author', '').strip()
            category = request.form.get('genre', '').strip()
            age_group = request.form.get('age_group', '').strip()
            description = request.form.get('description', '').strip()
            cover_image = request.form.get('image_url', '').strip()
            availability_period = request.form.get('availability_period', 'week')
            
            if title and author and category:
                book = Book(
                    title=title,
                    author=author,
                    category=category,
                    age_group=age_group,
                    description=description,
                    cover_image=cover_image,
                    user_id=user_id,
                    available=True,
                    active=True,
                    availability_period=availability_period,
                    availability_start_date=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(book)
                db.session.commit()
                flash('Book added successfully!', 'success')
            else:
                flash('Title, author, and genre are required.', 'error')
        
        # Handle book update
        elif request.method == 'POST' and request.form.get('action') == 'update_book':
            book_id = int(request.form.get('book_id', 0))
            book = Book.query.filter_by(id=book_id, user_id=user_id).first()
            
            if book:
                book.title = request.form.get('title', '').strip()
                book.author = request.form.get('author', '').strip()
                book.category = request.form.get('genre', '').strip()
                book.age_group = request.form.get('age_group', '').strip()
                book.description = request.form.get('description', '').strip()
                book.cover_image = request.form.get('image_url', '').strip()
                book.availability_period = request.form.get('availability_period', 'week')
                book.availability_start_date = datetime.utcnow()
                book.updated_at = datetime.utcnow()
                
                db.session.commit()
                flash('Book updated successfully!', 'success')
            else:
                flash('Book not found.', 'error')
        
        # Handle book availability toggle
        elif request.method == 'POST' and request.form.get('action') == 'toggle_availability':
            book_id = int(request.form.get('book_id', 0))
            new_status = bool(int(request.form.get('new_status', 0)))
            
            book = Book.query.filter_by(id=book_id, user_id=user_id).first()
            if book:
                if new_status:
                    # Reactivate this specific book
                    book.available = True
                    book.availability_start_date = datetime.utcnow()
                else:
                    # Deactivate all books with same title and author from this user
                    Book.query.filter_by(title=book.title, author=book.author, user_id=user_id).update({
                        'available': False
                    })
                
                db.session.commit()
                flash('Book reactivated in library!' if new_status else 'All copies of this book removed from library!', 'success')
            else:
                flash('Book not found.', 'error')
        
        # Handle book deletion
        elif request.method == 'POST' and request.form.get('action') == 'delete_book':
            book_id = int(request.form.get('book_id', 0))
            book = Book.query.filter_by(id=book_id, user_id=user_id).first()
            
            if book:
                db.session.delete(book)
                db.session.commit()
                flash('Book deleted successfully!', 'success')
            else:
                flash('Book not found.', 'error')
        
        # Get user's books with ratings and availability status
        user_books = []
        books = db.session.query(Book).filter(
            Book.user_id == user_id,
            Book.active == True
        ).order_by(Book.created_at.desc()).all()
        
        for book in books:
            try:
                # Get availability status with countdown
                availability_status = get_availability_status(book)
                
                # Get ratings for this book
                avg_rating = db.session.query(db.func.coalesce(db.func.avg(Review.rating), 0)).filter(
                    Review.book_id == book.id
                ).scalar()
                rating_count = db.session.query(db.func.count(Review.id)).filter(
                    Review.book_id == book.id
                ).scalar()
                
                # Create a book object with all needed attributes
                book_data = {
                    'id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'category': book.category,
                    'cover_image': book.cover_image,
                    'available': book.available,
                    'availability_status': availability_status,
                    'average_rating': float(avg_rating) if avg_rating else 0.0,
                    'rating_count': int(rating_count) if rating_count else 0
                }
                
                user_books.append(book_data)
            except Exception as e:
                logging.error(f"Error processing book {book.id}: {e}")
                continue
        
        # Get user's borrow requests
        borrow_requests = BorrowRequest.query.filter_by(user_id=user_id).join(Book).order_by(
            BorrowRequest.created_at.desc()
        ).all()
        
        return render_template('dashboard.html',
                             user=user,
                             user_books=user_books,
                             borrow_requests=borrow_requests)
                             
    except Exception as e:
        logging.error(f"Error loading dashboard: {e}")
        flash('Error loading dashboard. Please try again.', 'error')
        return redirect(url_for('main.index'))

@main_bp.route('/about')
def about():
    """About page"""
    return render_template('about.html')

@main_bp.route('/books')
def books():
    """Books listing page"""
    try:
        # Similar to index but with different template
        search_query = request.args.get('search', '').strip()
        category_filter = request.args.get('category', '').strip()
        page = max(1, int(request.args.get('page', 1)))
        per_page = 12
        
        # Build query
        query = Book.query.filter(Book.active == True, Book.available == True)
        
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                db.or_(
                    Book.title.ilike(search_pattern),
                    Book.author.ilike(search_pattern),
                    Book.description.ilike(search_pattern)
                )
            )
        
        if category_filter:
            query = query.filter(Book.category == category_filter)
        
        # Paginate
        books = query.order_by(Book.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Get available categories
        categories = db.session.query(Book.category).filter(
            Book.category.isnot(None),
            Book.active == True
        ).distinct().all()
        categories = [cat[0] for cat in categories if cat[0]]
        
        return render_template('books.html',
                             books=books,
                             search=search_query,
                             selected_category=category_filter,
                             categories=categories)
    except Exception as e:
        logging.error(f"Error loading books page: {e}")
        return render_template('books.html', books=None, search='', selected_category='', categories=[])