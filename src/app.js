require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter: max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use(limiter);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 GitHub Profile Analyzer API is running!',
    version: '1.0.0',
    endpoints: {
      analyze:       'POST   /api/analyze/:username',
      listAll:       'GET    /api/profiles',
      getOne:        'GET    /api/profiles/:username',
      deleteProfile: 'DELETE /api/profiles/:username',
      compare:       'GET    /api/profiles/compare?users=user1,user2',
      stats:         'GET    /api/stats'
    }
  });
});

// API routes
app.use('/api', profileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
