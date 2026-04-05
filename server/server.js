const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://civic-reporting-system-two.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Handle preflight requests explicitly
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/complaints', require('./routes/complaint.routes'));
app.use('/api/v1/departments', require('./routes/department.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'CivicConnect API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
