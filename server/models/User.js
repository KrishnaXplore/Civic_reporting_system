const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    locality: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'wardOfficer', 'deptAdmin', 'cityAdmin', 'stateAdmin', 'superAdmin'],
      default: 'citizen',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    // Jurisdiction for city/state/ward admins
    jurisdiction: {
      country:  { type: String, default: '' },
      state:    { type: String, default: '' },
      city:     { type: String, default: '' },
      district: { type: String, default: '' },
      ward:     { type: String, default: '' },
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    strikeCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'warned', 'banned'],
      default: 'active',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
