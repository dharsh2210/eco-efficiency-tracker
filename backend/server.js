require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB().catch(err => { console.error('DB connection failed:', err); process.exit(1); });

app.use(cors({
  origin: process.env.FRONTEND_URL, // your frontend URL after deployment
  credentials: true
}));
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/entries', require('./routes/entries'));
app.use('/alerts', require('./routes/alerts'));
app.use('/tickets', require('./routes/tickets'));

app.get('/health', (_, res) => res.json({ ok: true }));
app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found` }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
