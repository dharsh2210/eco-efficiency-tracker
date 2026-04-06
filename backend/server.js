require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1); // stop the server if DB fails
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // allow your frontend
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/alerts',  require('./routes/alerts'));
app.use('/api/tickets', require('./routes/tickets'));

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
