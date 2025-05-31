import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  userType: text("user_type").notNull(), // parent, child, teacher, librarian
  profilePicture: text("profile_picture"),
  phone: text("phone"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre").notNull(),
  ageGroup: text("age_group"), // Optional age information for book details
  description: text("description"),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  ownerId: integer("owner_id").references(() => users.id),
  ownerAddress: text("owner_address"),
  ownerLatitude: decimal("owner_latitude", { precision: 10, scale: 7 }),
  ownerLongitude: decimal("owner_longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookRatings = pgTable("book_ratings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookRequests = pgTable("book_requests", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // pending, approved, delivered, returned
  requestedAt: timestamp("requested_at").defaultNow(),
  returnedAt: timestamp("returned_at"),
  deliveredAt: timestamp("delivered_at"),
  // Contact and delivery information
  borrowerName: text("borrower_name").notNull(),
  borrowerEmail: text("borrower_email").notNull(),
  borrowerPhone: text("borrower_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 10, scale: 7 }),
  specialInstructions: text("special_instructions"),
  borrowDuration: integer("borrow_duration").default(14), // days
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertBookRatingSchema = createInsertSchema(bookRatings).omit({
  id: true,
  createdAt: true,
});

export const insertBookRequestSchema = createInsertSchema(bookRequests).omit({
  id: true,
  requestedAt: true,
  returnedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type BookRating = typeof bookRatings.$inferSelect;
export type InsertBookRating = z.infer<typeof insertBookRatingSchema>;
export type BookRequest = typeof bookRequests.$inferSelect;
export type InsertBookRequest = z.infer<typeof insertBookRequestSchema>;
