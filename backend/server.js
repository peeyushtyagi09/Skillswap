require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const newRoutes = require('./routes');

const { connectDB } = require('./db/db');
const UserRoutes = require('./routes/UserRoutes');
const DiscussRoutes = require('./routes/discussRoutes');
const UploadRoutes = require('./upload/upload');
const friendRoutes = require('./routes/friendRoutes');
const callRatingRoutes = require('./routes/callRatingRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');

// Initialize express and HTTP server to attach Socket.IO
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Clean CORS configuration with explicit origin handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // allow images from other origins
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Basic rate LIMITS for API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', UserRoutes);
app.use('/api/profile', userProfileRoutes)
app.use('/api/discuss', DiscussRoutes);
app.use('/api/upload', UploadRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/call-rating', callRatingRoutes);
app.use('/api', newRoutes);

// Socket.IO setup with CORS matching frontend
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
});
app.set('io', io);

// Socket handlers (Chat, call, whiteBoard, notes) will be registered here
require('./socket')(io);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});