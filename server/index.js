const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const swaggerSpec = require('./swagger');

// Routes
const authRoutes = require('./routes/auth');
const essayRoutes = require('./routes/essays');
const musicRoutes = require('./routes/music');
const quizRoutes = require('./routes/quizzes');
const readingRoutes = require('./routes/reading');
const learningRoutes = require('./routes/learning');
const passwordResetRoutes = require('./routes/passwordReset');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');
const searchRoutes = require('./routes/search');
const exportRoutes = require('./routes/export');
const notificationRoutes = require('./routes/notifications');
const feedbackRoutes = require('./routes/feedback');
const contactRoutes = require('./routes/contact');
const auditLogRoutes = require('./routes/auditLogs');
const gdprRoutes = require('./routes/gdpr');
const languageRoutes = require('./routes/language');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve uploads with auth check
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/essays', essayRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/classroom-agents', require('./routes/classroomAgents'));

// Enhanced health check
app.get('/api/health', async (req, res) => {
  const pool = require('./db/config');
  let dbStatus = 'disconnected';
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbStatus = `connected (${Date.now() - start}ms)`;
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 404 for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     AI Education Suite Server                             ║
║                                                           ║
║     Server running on http://localhost:${PORT}              ║
║     API docs at http://localhost:${PORT}/api-docs           ║
║                                                           ║
║     Features: 6 AI Tools + 35 Platform Features           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
