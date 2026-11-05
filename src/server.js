const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initializeDb, closeDb, getDb } = require('./db/init');
const { errorHandler } = require('./middleware/errorHandler');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../data/uploads');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Serve display frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve admin frontend
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    closeDb();
    process.exit(0);
  });
});

// Start server
let server;

async function start() {
  try {
    await initializeDb();
    
    server = app.listen(PORT, () => {
      console.log(`Infoboard server running on http://localhost:${PORT}`);
      console.log(`Display: http://localhost:${PORT}/`);
      console.log(`Admin: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
