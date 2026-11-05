const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const apiRoutes = require('./routes/api');
const seedDatabase = require('./seeds/initialData');
const populateIndonesianMedicines = require('./seeds/populateIndonesianMedicines');
const { JWT_SECRET } = require('./middlewares/authMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Socket.io Handshake Token Authentication & Scoped Room Assignment
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      socket.join(`role:${decoded.role}`);
    } catch {
      // Allow connection but unassigned to sensitive role rooms
    }
  }
  next();
});

app.use(cors());
app.use(express.json());

// Store io instance on app for controllers to access
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Klinik Almedika SIM Farmasi & Rawat Jalan Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Serve static client build if present (Unified Production Mode)
const distPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Centralized JSON Error Handler
app.use((err, req, res, next) => {
  console.error('[Klinik Almedika Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan sistem internal pada server klinik.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Socket.io Real-Time Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id} (Role: ${socket.user?.role || 'Guest'})`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Run Seed Data
try {
  seedDatabase();
  populateIndonesianMedicines();
} catch (err) {
  console.error('Error during database seeding:', err);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Klinik Almedika Backend Running on Port ${PORT}`);
  console.log(`  REST API:   http://localhost:${PORT}/api`);
  console.log(`  Socket.io:  ws://localhost:${PORT}`);
  console.log(`====================================================`);
});
