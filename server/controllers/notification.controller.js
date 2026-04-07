const Notification = require('../models/Notification');
const { addClient, removeClient } = require('../utils/sse');
const { ApiSuccess } = require('../utils/apiResponse');

// SSE — not wrapped in asyncHandler; manages its own long-lived connection lifecycle
exports.connectSSE = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addClient(req.user._id, res);
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(req.user._id);
  });
};

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  ApiSuccess(res, { data: notifications });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  ApiSuccess(res, { message: 'All notifications marked as read' });
};

exports.markOneRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  ApiSuccess(res, { message: 'Notification marked as read' });
};
