const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g. 'USER_BANNED', 'COMPLAINT_REJECTED', 'OFFICER_ADDED', 'STRIKES_CLEARED'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
