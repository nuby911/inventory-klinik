const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const seedDatabase = require('./seeds/initialData');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
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

// Socket.io Real-Time Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const populateIndonesianMedicines = require('./seeds/populateIndonesianMedicines');

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
