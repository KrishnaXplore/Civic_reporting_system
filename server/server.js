const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
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
