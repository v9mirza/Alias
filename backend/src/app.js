import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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
    origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

// 3. Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());



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
