# BorrowBee Digital Library

A modern digital library platform for book discovery and sharing, built with React, TypeScript, and Express.

## Features

- User authentication and registration
- Book browsing with search and filtering
- Personal dashboard for book management
- Rating and review system
- Book borrowing with contact functionality
- Responsive design with bee-themed UI

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **Email**: Gmail SMTP for notifications

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL=your_supabase_database_url
GMAIL_EMAIL=your_gmail_email
GMAIL_APP_PASSWORD=your_gmail_app_password
SESSION_SECRET=your_random_session_secret
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## Deployment

The application is configured for deployment on:
- Vercel
- Netlify
- Replit Deployments

## Author

Daanish Ahmad Mufti - Computer Science Student & Software Developer

## License

MIT License