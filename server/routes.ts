import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertBookSchema, insertBookRatingSchema, insertBookRequestSchema } from "@shared/schema";
import nodemailer from 'nodemailer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }).parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Google Maps API key endpoint
  app.get("/api/google-maps-key", async (req, res) => {
    res.send(process.env.GOOGLE_MAPS_API_KEY || "");
  });

  // Get user by ID endpoint
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile update route
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, phone, address, latitude, longitude } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, {
        name,
        phone,
        address,
        latitude,
        longitude,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, userType, profilePicture } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        name,
        email,
        password,
        userType,
        profilePicture,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Book routes
  app.post("/api/books", async (req, res) => {
    try {
      const { title, author, genre, ageGroup, description, imageUrl, ownerId } = req.body;
      
      const newBook = await storage.createBook({
        title,
        author,
        genre,
        ageGroup,
        description,
        imageUrl,
        ownerId,
      });
      
      res.status(201).json(newBook);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const { search, genre, minRating } = req.query;
      
      const filters = {
        genre: genre as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
      };
      
      const books = await storage.getBooks(search as string, filters);
      
      // Get ratings for each book
      const booksWithRatings = await Promise.all(
        books.map(async (book) => {
          const averageRating = await storage.getBookAverageRating(book.id);
          const ratings = await storage.getBookRatings(book.id);
          return {
            ...book,
            averageRating: Number(averageRating.toFixed(1)),
            ratingCount: ratings.length,
          };
        })
      );
      
      res.json(booksWithRatings);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get books owned by current user (for dashboard)
  app.get("/api/books/my-books", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const books = await storage.getBooksByOwner(userId);
      
      // Get ratings for each book
      const booksWithRatings = await Promise.all(
        books.map(async (book) => {
          const averageRating = await storage.getBookAverageRating(book.id);
          const ratings = await storage.getBookRatings(book.id);
          return {
            ...book,
            averageRating: Number(averageRating.toFixed(1)),
            ratingCount: ratings.length,
          };
        })
      );
      
      res.json(booksWithRatings);
    } catch (error) {
      console.error("Error fetching user books:", error);
      res.status(500).json({ message: "Failed to fetch user books" });
    }
  });

  // Get individual book details
  app.get("/api/books/:id", async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Get ratings for this book
      const averageRating = await storage.getBookAverageRating(book.id);
      const ratings = await storage.getBookRatings(book.id);
      
      res.json({
        ...book,
        averageRating: Number(averageRating.toFixed(1)),
        ratingCount: ratings.length,
      });
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookData = req.body;
      
      const updatedBook = await storage.updateBook(id, bookData);
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const averageRating = await storage.getBookAverageRating(updatedBook.id);
      const ratings = await storage.getBookRatings(updatedBook.id);
      
      res.json({
        ...updatedBook,
        averageRating: Number(averageRating.toFixed(1)),
        ratingCount: ratings.length,
      });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      const book = await storage.updateBook(id, bookData);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      await storage.deleteBook(id);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Book borrowing routes
  app.post("/api/books/borrow", async (req, res) => {
    try {
      const {
        bookId,
        borrowerName,
        borrowerEmail,
        borrowerPhone,
        deliveryAddress,
        deliveryLatitude,
        deliveryLongitude,
        specialInstructions,
        borrowDuration
      } = req.body;

      // Validate required fields
      if (!bookId || !borrowerName || !borrowerEmail || !borrowerPhone || !deliveryAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if book exists and is available
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      if (!book.isAvailable) {
        return res.status(400).json({ message: "Book is not available for borrowing" });
      }

      const requestData = {
        bookId,
        userId: 1, // For now, using default user ID
        borrowerName,
        borrowerEmail,
        borrowerPhone,
        deliveryAddress,
        deliveryLatitude: deliveryLatitude ? deliveryLatitude.toString() : null,
        deliveryLongitude: deliveryLongitude ? deliveryLongitude.toString() : null,
        specialInstructions,
        borrowDuration: borrowDuration || 14,
      };

      const borrowRequest = await storage.createBookRequest(requestData);
      res.json(borrowRequest);
    } catch (error) {
      console.error("Error creating borrow request:", error);
      res.status(500).json({ message: "Failed to create borrowing request" });
    }
  });

  app.get("/api/borrow-requests", async (req, res) => {
    try {
      const requests = await storage.getAllBookRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching borrow requests:", error);
      res.status(500).json({ message: "Failed to fetch borrowing requests" });
    }
  });

  app.put("/api/borrow-requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "delivered", "returned"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedRequest = await storage.updateRequestStatus(id, status);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Borrow request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Rating routes
  app.post("/api/books/:bookId/rate", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const { userId, rating } = z.object({
        userId: z.number(),
        rating: z.number().min(1).max(5),
      }).parse(req.body);
      
      const ratingData = { bookId, userId, rating };
      const result = await storage.createOrUpdateRating(ratingData);
      
      res.json(result);
    } catch (error) {
      console.error("Error rating book:", error);
      res.status(400).json({ message: "Invalid rating data" });
    }
  });

  app.get("/api/books/:bookId/rating/:userId", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const userId = parseInt(req.params.userId);
      
      const rating = await storage.getUserRating(bookId, userId);
      res.json(rating || { rating: 0 });
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  // Request routes
  app.get("/api/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getBookRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertBookRequestSchema.parse(req.body);
      const request = await storage.createBookRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Send borrow alert email
  app.post("/api/send-borrow-alert", async (req, res) => {
    try {
      const {
        borrowerName,
        borrowerEmail,
        borrowerPhone,
        ownerEmail,
        bookTitle,
        bookAuthor,
      } = z.object({
        borrowerName: z.string(),
        borrowerEmail: z.string().email(),
        borrowerPhone: z.string().nullable(),
        ownerEmail: z.string().email(),
        bookTitle: z.string(),
        bookAuthor: z.string(),
      }).parse(req.body);

      // Check if Gmail credentials are configured
      if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return res.status(500).json({ message: "Email service not configured" });
      }

      // Create nodemailer transporter for Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: ownerEmail,
        replyTo: borrowerEmail,
        subject: `BorrowBee: Someone wants to borrow "${bookTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f39c12;">📚 Book Borrow Request</h2>
            <p>Hi there!</p>
            <p>Someone is interested in borrowing your book through BorrowBee:</p>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="margin-top: 0; color: #333;">Book: "${bookTitle}"</h3>
              <p style="margin: 0.5rem 0;"><strong>Author:</strong> ${bookAuthor}</p>
            </div>

            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="margin-top: 0; color: #333;">Borrower Contact Information:</h3>
              <p style="margin: 0.5rem 0;"><strong>Name:</strong> ${borrowerName}</p>
              <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${borrowerEmail}</p>
              ${borrowerPhone ? `<p style="margin: 0.5rem 0;"><strong>Phone:</strong> ${borrowerPhone}</p>` : ''}
            </div>

            <p>You can contact them directly to arrange the book lending. Happy sharing!</p>
            
            <p style="color: #666; font-size: 0.9rem; margin-top: 2rem;">
              This email was sent automatically from BorrowBee when someone requested to borrow your book.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📚 Email sent: ${borrowerName} wants to borrow "${bookTitle}" from ${ownerEmail}`);
      
      res.json({ success: true, message: "Borrow alert sent successfully" });
    } catch (error) {
      console.error("Error sending borrow alert:", error);
      res.status(500).json({ message: "Failed to send borrow alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
