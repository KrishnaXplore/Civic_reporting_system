const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(globalLimiter);

app.use(cors({
  origin: function (origin, callback) {
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

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth',          require('./routes/auth.routes'));
app.use('/api/v1/complaints',    require('./routes/complaint.routes'));
app.use('/api/v1/complaints/:id/comments', require('./routes/comment.routes'));
app.use('/api/v1/departments',   require('./routes/department.routes'));
app.use('/api/v1/admin',         require('./routes/admin.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/support',       require('./routes/support.routes'));
app.use('/api/v1/location',      require('./routes/location.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'CivicConnect API is running' });
});

app.use(errorHandler);

module.exports = app;
