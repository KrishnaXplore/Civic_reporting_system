const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

commentSchema.index({ complaint: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
