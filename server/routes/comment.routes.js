const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const commentController = require('../controllers/comment.controller');

// GET comments — public (anyone can read)
router.get('/', asyncHandler(commentController.getComments));

// POST comment — must be logged in
router.post(
  '/',
  protect,
  [body('text').trim().notEmpty().withMessage('Comment cannot be empty')
               .isLength({ max: 500 }).withMessage('Max 500 characters')],
  validate,
  asyncHandler(commentController.addComment)
);

// DELETE comment — author or superAdmin only
router.delete('/:commentId', protect, asyncHandler(commentController.deleteComment));

module.exports = router;
