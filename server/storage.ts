import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, like, or, sql, desc } from "drizzle-orm";
import { users, books, bookRatings, bookRequests, type User, type InsertUser, type Book, type InsertBook, type BookRating, type InsertBookRating, type BookRequest, type InsertBookRequest } from "@shared/schema";

const connection = neon(process.env.DATABASE_URL!);
const db = drizzle(connection);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Book operations
  getBooks(searchQuery?: string, filters?: { genre?: string; minRating?: number }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByOwner(userId: number): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;

  // Rating operations
  getBookRatings(bookId: number): Promise<BookRating[]>;
  getBookAverageRating(bookId: number): Promise<number>;
  createOrUpdateRating(rating: InsertBookRating): Promise<BookRating>;
  getUserRating(bookId: number, userId: number): Promise<BookRating | undefined>;

  // Request operations
  getBookRequests(userId: number): Promise<BookRequest[]>;
  createBookRequest(request: InsertBookRequest): Promise<BookRequest>;
  updateRequestStatus(id: number, status: string): Promise<BookRequest | undefined>;
  getAllBookRequests(): Promise<BookRequest[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getBooks(searchQuery?: string, filters?: { genre?: string; minRating?: number }): Promise<Book[]> {
    const conditions = [];
    
    if (searchQuery) {
      conditions.push(
        or(
          like(books.title, `%${searchQuery}%`),
          like(books.author, `%${searchQuery}%`),
          like(books.genre, `%${searchQuery}%`)
        )
      );
    }
    
    if (filters?.genre) {
      conditions.push(eq(books.genre, filters.genre));
    }
    
    let query = db.select().from(books);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const allBooks = await query.orderBy(desc(books.createdAt));
    
    // Filter by minimum rating if specified
    if (filters?.minRating && filters.minRating > 0) {
      const filteredBooks = [];
      for (const book of allBooks) {
        const avgRating = await this.getBookAverageRating(book.id);
        if (avgRating >= filters.minRating) {
          filteredBooks.push(book);
        }
      }
      return filteredBooks;
    }
    
    return allBooks;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
    return result[0];
  }

  async getBooksByOwner(userId: number): Promise<Book[]> {
    const result = await db.select().from(books).where(eq(books.ownerId, userId));
    return result;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const result = await db.insert(books).values(book).returning();
    return result[0];
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined> {
    const result = await db.update(books).set(book).where(eq(books.id, id)).returning();
    return result[0];
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async getBookRatings(bookId: number): Promise<BookRating[]> {
    return db.select().from(bookRatings).where(eq(bookRatings.bookId, bookId));
  }

  async getBookAverageRating(bookId: number): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`avg(${bookRatings.rating})` })
      .from(bookRatings)
      .where(eq(bookRatings.bookId, bookId));
    
    return Number(result[0]?.avg) || 0;
  }

  async createOrUpdateRating(rating: InsertBookRating): Promise<BookRating> {
    const existing = await db
      .select()
      .from(bookRatings)
      .where(and(eq(bookRatings.bookId, rating.bookId), eq(bookRatings.userId, rating.userId)))
      .limit(1);

    if (existing[0]) {
      const result = await db
        .update(bookRatings)
        .set({ rating: rating.rating })
        .where(eq(bookRatings.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(bookRatings).values(rating).returning();
      return result[0];
    }
  }

  async getUserRating(bookId: number, userId: number): Promise<BookRating | undefined> {
    const result = await db
      .select()
      .from(bookRatings)
      .where(and(eq(bookRatings.bookId, bookId), eq(bookRatings.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getBookRequests(userId: number): Promise<BookRequest[]> {
    return db.select().from(bookRequests).where(eq(bookRequests.userId, userId));
  }

  async createBookRequest(request: InsertBookRequest): Promise<BookRequest> {
    const result = await db.insert(bookRequests).values(request).returning();
    return result[0];
  }

  async updateRequestStatus(id: number, status: string): Promise<BookRequest | undefined> {
    const result = await db
      .update(bookRequests)
      .set({ status })
      .where(eq(bookRequests.id, id))
      .returning();
    return result[0];
  }

  async getAllBookRequests(): Promise<BookRequest[]> {
    return db.select().from(bookRequests);
  }
}

export const storage = new DatabaseStorage();
