const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Set environment variables for serverless
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.DB_PATH = process.env.DB_PATH || '/tmp/primetrade.db';
process.env.NETLIFY = 'true';

const db = require('../../src/config/databaseAdapter');
const { errorHandler, notFound } = require('../../src/middleware/errorMiddleware');

// Import routes
const authRoutes = require('../../src/routes/authRoutes');
const taskRoutes = require('../../src/routes/taskRoutes');
const swaggerSetup = require('../../src/config/swagger');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Swagger documentation
swaggerSetup(app);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database
let dbInitialized = false;

const initializeApp = async () => {
  if (!dbInitialized) {
    try {
      await db.initialize();
      dbInitialized = true;
      console.log('✅ Database initialized for serverless function');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
    }
  }
};

// Wrap the app with serverless-http
const handler = serverless(app, {
  binary: ['image/*', 'font/*', 'application/octet-stream']
});

module.exports.handler = async (event, context) => {
  // Initialize database on cold start
  await initializeApp();
  
  // Handle the request
  return await handler(event, context);
};
