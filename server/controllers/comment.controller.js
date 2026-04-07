const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

exports.getComments = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [comments, total] = await Promise.all([
    Comment.find({ complaint: req.params.id })
      .populate('author', 'name role profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Comment.countDocuments({ complaint: req.params.id }),
  ]);

  ApiSuccess(res, {
    data: comments,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    hasMore: skip + comments.length < total,
  });
};

exports.addComment = async (req, res) => {
  const { text } = req.body;

  // Block flagged/banned citizens from commenting
  if (req.user.role === 'citizen' && req.user.strikeCount >= 3) {
    throw new AppError('Your account has been flagged. You cannot comment at this time.', 403);
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint not found', 404);
  if (complaint.status === 'Rejected') throw new AppError('Cannot comment on a rejected complaint', 400);

  const comment = await Comment.create({
    complaint: req.params.id,
    author: req.user._id,
    text,
  });

  await comment.populate('author', 'name role profilePhoto');
  ApiSuccess(res, { data: comment }, 201);
};

exports.deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'superAdmin';
  if (!isAuthor && !isAdmin) throw new AppError('Not authorized to delete this comment', 403);

  await comment.deleteOne();
  ApiSuccess(res, { message: 'Comment deleted' });
};
