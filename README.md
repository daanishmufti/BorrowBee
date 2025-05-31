# BorrowBee Digital Library

A modern digital library platform for book discovery, borrowing, and management with a bee-themed design.

## Features

- 🐝 User authentication and profiles
- 📚 Book browsing with search and filters
- ⭐ Book rating system
- 📧 Email notifications for book borrowing
- 🎨 Beautiful bee-themed UI with golden gradients
- 📱 Responsive design

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth
- **Email**: Gmail SMTP

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Gmail account with app password

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/borrowbee-library.git
cd borrowbee-library
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL=your_postgresql_connection_string
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
SESSION_SECRET=your_random_secret_string
```

4. Set up database:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:5000

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `GMAIL_EMAIL`: Gmail address for notifications
- `GMAIL_APP_PASSWORD`: Gmail app-specific password
- `SESSION_SECRET`: Random string for session security

## Deployment

This app can be deployed to:
- Vercel
- Netlify
- Railway
- Heroku
- DigitalOcean

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Created By

**Daanish Ahmad Mufti**
- LinkedIn: [Daanish Mufti](https://www.linkedin.com/in/daanish-mufti-1451a0290/)
- GitHub: [daanishmufti](https://github.com/daanishmufti/daanishmufti)
- Website: [daanishmufti.site](https://daanishmufti.site/index.php)

© 2025 Made by Daanish Ahmad Mufti