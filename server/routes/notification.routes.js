const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const notificationController = require('../controllers/notification.controller');

// SSE — not wrapped in asyncHandler (manages long-lived connection itself)
router.get('/connect', protect, notificationController.connectSSE);

router.get('/', protect, asyncHandler(notificationController.getNotifications));
router.put('/read-all', protect, asyncHandler(notificationController.markAllRead));
router.put('/:id/read', protect, asyncHandler(notificationController.markOneRead));

module.exports = router;
