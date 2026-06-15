import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

// Load env variables
dotenv.config();

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

// 3. Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5. Global API Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // default 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }
});

// Apply rate limiter to all API routes
app.use('/api', limiter);

// 6. Mount API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Alias API is running healthy'
  });
});

// 7. Fallback route for undefined paths
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 8. Global Error Handler Middleware
app.use(errorHandler);

export default app;
