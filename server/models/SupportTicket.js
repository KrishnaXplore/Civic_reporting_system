const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    category: {
      type: String,
      enum: ['general', 'complaint', 'technical', 'account', 'other'],
      default: 'general',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'inProgress', 'resolved', 'closed'],
      default: 'open',
    },
    adminReply: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
