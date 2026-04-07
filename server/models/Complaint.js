const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Roads & Infrastructure',
        'Water & Sanitation',
        'Electricity',
        'Waste Management',
        'Parks & Public Spaces',
      ],
    },
    beforeImage: {
      type: String,
      required: [true, 'Image is required'],
    },
    afterImage: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    locationDetails: {
      country:  { type: String, default: '' },
      state:    { type: String, default: '' },
      city:     { type: String, default: '' },
      district: { type: String, default: '' },
      ward:     { type: String, default: '' },
      locality: { type: String, default: '' },
      pincode:  { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'],
      default: 'Submitted',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    fundsSpent: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Status change history — every transition is recorded
    timeline: [
      {
        status:    { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        note:      { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ 'locationDetails.state': 1, status: 1 });
complaintSchema.index({ 'locationDetails.city': 1, status: 1 });
complaintSchema.index({ 'locationDetails.ward': 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
