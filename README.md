# BorrowBee - Render Deployment

## Files included:
- render_requirements.txt - Python dependencies
- render.yaml - Render configuration (auto-deploys web service + PostgreSQL)
- runtime.txt - Python version
- app.py - Flask application (updated for PostgreSQL)
- main.py - Entry point
- models.py - Database models
- routes.py - Application routes
- auth.py - Authentication
- database.py - Database initialization
- email_service.py - Email functionality
- templates/ - HTML templates
- static/ - CSS, JS, images

## Deployment Steps:
1. Upload all files to GitHub repository
2. Go to render.com and sign up with GitHub
3. Click "New +" → "Blueprint"
4. Select your GitHub repository
5. Render will auto-detect render.yaml and create:
   - Web service
   - PostgreSQL database
   - Environment variables

## Required Environment Variables:
Add these in Render dashboard:
- GMAIL_EMAIL: your-email@gmail.com
- GMAIL_APP_PASSWORD: your-gmail-app-password

The DATABASE_URL and SESSION_SECRET are automatically created by render.yaml.