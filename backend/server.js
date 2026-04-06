require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB().catch(err => { console.error('DB connection failed:', err); process.exit(1); });

app.use(cors({
  origin: 'https://eco-efficiency-tracker-2.onrender.com',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/alerts',  require('./routes/alerts'));
app.use('/api/tickets', require('./routes/tickets'));

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
