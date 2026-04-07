const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const authController = require('../controllers/auth.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  asyncHandler(authController.login)
);

router.post('/logout', authController.logout);

router.get('/me', protect, asyncHandler(authController.getMe));

router.put(
  '/profile',
  protect,
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  asyncHandler(authController.updateProfile)
);

router.post(
  '/upload-photo',
  protect,
  upload.single('photo'),
  asyncHandler(authController.uploadPhoto)
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(authController.resetPassword)
);

module.exports = router;
