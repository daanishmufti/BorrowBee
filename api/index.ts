import { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all routes
registerRoutes(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}