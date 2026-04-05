const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    enum: [
      'Roads & Infrastructure',
      'Water & Sanitation',
      'Electricity',
      'Waste Management',
      'Parks & Public Spaces',
    ],
  },
  description: {
    type: String,
    default: '',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  officers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
