const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const supportController = require('../controllers/support.controller');

router.post(
  '/',
  protect,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validate,
  asyncHandler(supportController.createTicket)
);

router.get('/my', protect, asyncHandler(supportController.getMyTickets));

router.get('/', protect, roleGuard('superAdmin'), asyncHandler(supportController.getAllTickets));

router.put('/:id', protect, roleGuard('superAdmin'), asyncHandler(supportController.updateTicket));

module.exports = router;
