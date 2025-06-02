# BorrowBee Railway Deployment Files

## Required Files for Railway Deployment

### Core Application Files
- `main.py` - Main Flask application entry point
- `app.py` - Flask app configuration
- `models.py` - Database models
- `routes.py` - Application routes
- `auth.py` - Authentication logic
- `email_service.py` - Email functionality
- `database.py` - Database initialization

### Configuration Files
- `pyproject.toml` - Python dependencies (already configured)
- `railway.json` - Railway deployment configuration
- `runtime.txt` - Python version specification
- `Procfile` - Process configuration for deployment

### Templates Directory
- `templates/` - All HTML templates
  - `index.html`
  - `dashboard.html`
  - `login.html`
  - `register.html`
  - `book_detail.html`
  - `about.html`
  - `admin.html`
  - `add_book.html`
  - `edit_book.html`

### Static Files Directory
- `static/css/` - All CSS files
- `static/js/` - JavaScript files
- `static/images/` - Image assets

## Environment Variables Needed on Railway

Set these in Railway dashboard under Variables:

```
SESSION_SECRET=your-generated-secret-key
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
DATABASE_URL=postgresql://... (automatically set by Railway PostgreSQL)
```

## Deployment Process

1. Push all files to GitHub repository
2. Connect Railway to GitHub repo
3. Add PostgreSQL database service
4. Set environment variables
5. Deploy automatically

Your app will be live at: https://your-app-name.railway.app