const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowed = [
      'https://civic-reporting-system-two.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ];

    console.log(`[CORS] Incoming Origin: ${origin}`);

    if (!origin || allowed.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      console.error(`[CORS REJECTED] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
};

// Apply CORS to all routes including preflight OPTIONS
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
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
