const SupportTicket = require('../models/SupportTicket');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

exports.createTicket = async (req, res) => {
  const { subject, message, category } = req.body;
  const ticket = await SupportTicket.create({
    subject,
    message,
    category,
    citizen: req.user._id,
  });
  ApiSuccess(res, { data: ticket }, 201);
};

exports.getMyTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ citizen: req.user._id }).sort({ createdAt: -1 });
  ApiSuccess(res, { data: tickets });
};

exports.getAllTickets = async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const tickets = await SupportTicket.find(query)
    .populate('citizen', 'name email')
    .sort({ createdAt: -1 });
  ApiSuccess(res, { data: tickets });
};

exports.updateTicket = async (req, res) => {
  const { status, adminReply } = req.body;
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    {
      ...(status && { status }),
      ...(adminReply !== undefined && { adminReply }),
    },
    { new: true, runValidators: true }
  );
  if (!ticket) throw new AppError('Ticket not found', 404);
  ApiSuccess(res, { data: ticket });
};
