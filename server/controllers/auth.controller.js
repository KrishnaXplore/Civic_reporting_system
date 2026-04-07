const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/email');
const { uploadToCloudinary } = require('../config/cloudinary');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userObj = user.toObject();
  delete userObj.password;
  ApiSuccess(res, { user: userObj }, statusCode);
};

exports.register = async (req, res) => {
  const { name, email, phone, password, locality } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', 400);

  const user = await User.create({ name, email, phone, password, locality });
  sendTokenResponse(user, 201, res);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password').populate('department');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'banned') throw new AppError('Your account has been banned', 403);

  sendTokenResponse(user, 200, res);
};

exports.logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  ApiSuccess(res, { message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  ApiSuccess(res, { user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { name, phone, locality, profilePhoto } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, locality, profilePhoto },
    { new: true, runValidators: true }
  );
  ApiSuccess(res, { user: updated });
};

exports.uploadPhoto = async (req, res) => {
  if (!req.file) throw new AppError('Image file is required', 400);
  const result = await uploadToCloudinary(req.file.buffer, 'profile-photos');
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto: result.secure_url },
    { new: true }
  );
  ApiSuccess(res, { user: updated, url: result.secure_url });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Always respond 200 to prevent email enumeration
  if (!user) {
    return ApiSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
  }

  // Invalidate any existing tokens for this user
  await PasswordResetToken.deleteMany({ user: user._id });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await PasswordResetToken.create({ user: user._id, token: hashedToken });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&id=${user._id}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0F172A;">Reset your password</h2>
      <p style="color: #475569;">Hi ${user.name}, click the button below to reset your CivicConnect password. This link expires in 15 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#3B82F6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Reset Password
      </a>
      <p style="color:#94A3B8;font-size:13px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail(user.email, 'Reset your CivicConnect password', html);
  } catch {
    // Silently fail if email not configured — log in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset link: ${resetUrl}`);
    }
  }

  ApiSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
};

exports.resetPassword = async (req, res) => {
  const { token, userId, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await PasswordResetToken.findOne({
    user: userId,
    token: hashedToken,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) throw new AppError('Invalid or expired reset token', 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.password = password;
  await user.save();

  await PasswordResetToken.deleteMany({ user: userId });

  ApiSuccess(res, { message: 'Password reset successfully. Please log in.' });
};
