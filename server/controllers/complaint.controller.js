const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendSSE } = require('../utils/sse');
const { runMLChecks } = require('../utils/mlProcessor');
const { reverseGeocode } = require('../utils/geocode');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

const categoryToDept = {
  'Roads & Infrastructure': 'Roads & Infrastructure',
  'Water & Sanitation':     'Water & Sanitation',
  'Electricity':            'Electricity',
  'Waste Management':       'Waste Management',
  'Parks & Public Spaces':  'Parks & Public Spaces',
};

const notifyUser = async (userId, message, complaintId, type) => {
  await Notification.create({ recipient: userId, message, complaintId, type });
  sendSSE(userId.toString(), { message, complaintId, type });
};

exports.getMapComplaints = async (req, res) => {
  const complaints = await Complaint.find(
    { status: { $ne: 'Rejected' } },
    { location: 1, locationDetails: 1, status: 1, category: 1, title: 1, createdAt: 1 }
  );
  ApiSuccess(res, { data: complaints });
};

exports.submitComplaint = async (req, res) => {
  const { title, description, category, lat, lng } = req.body;

  if (!req.file) throw new AppError('Image is required', 400);
  if (!lat || !lng) throw new AppError('Location is required', 400);

  const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'complaint-before');
  const dept = await Department.findOne({ name: categoryToDept[category] });
  const locationDetails = await reverseGeocode(parseFloat(lat), parseFloat(lng)).catch(() => ({}));

  const complaint = await Complaint.create({
    title,
    description,
    category,
    beforeImage: cloudinaryResult.secure_url,
    location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    locationDetails,
    citizen: req.user._id,
    department: dept ? dept._id : null,
    timeline: [{ status: 'Submitted', updatedBy: req.user._id, note: 'Complaint submitted by citizen' }],
  });

  ApiSuccess(res, {
    data: complaint,
    message: 'Complaint submitted! Our system is verifying your image in the background.',
  }, 201);

  runMLChecks(complaint._id, req.file.buffer, req.user._id).catch((err) =>
    console.error('[ML] Background check failed silently:', err.message)
  );
};

exports.getComplaints = async (req, res) => {
  let query = {};
  if (req.user.role === 'citizen') query.citizen = req.user._id;
  else if (req.user.role === 'officer') query.department = req.user.department;

  const complaints = await Complaint.find(query)
    .populate('citizen', 'name email')
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  ApiSuccess(res, { data: complaints });
};

exports.getDepartmentComplaints = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { department: req.user.department };
  if (status) query.status = status;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Complaint.countDocuments(query),
  ]);

  ApiSuccess(res, { data: complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getComplaintById = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'name email phone profilePhoto')
    .populate('assignedTo', 'name email profilePhoto')
    .populate('department', 'name')
    .populate('timeline.updatedBy', 'name role');

  if (!complaint) throw new AppError('Complaint not found', 404);

  // Citizens can view any non-rejected complaint (needed for upvoting community issues)
  // but cannot view rejected complaints that aren't theirs
  if (
    req.user.role === 'citizen' &&
    complaint.status === 'Rejected' &&
    complaint.citizen._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized', 403);
  }

  ApiSuccess(res, { data: complaint });
};

exports.updateComplaintStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint not found', 404);

  complaint.status = status;
  if (status === 'Assigned') complaint.assignedTo = req.user._id;
  if (rejectionReason) complaint.rejectionReason = rejectionReason;

  // Push to timeline
  const notes = {
    Assigned:   `Assigned to officer ${req.user.name}`,
    InProgress: `Work started by ${req.user.name}`,
    Rejected:   `Rejected: ${rejectionReason || 'No reason provided'}`,
  };
  complaint.timeline.push({
    status,
    updatedBy: req.user._id,
    note: notes[status] || `Status updated to ${status}`,
  });

  await complaint.save();

  const messages = {
    Assigned:   `Your complaint "${complaint.title}" has been assigned to an officer.`,
    InProgress: `Work has started on your complaint "${complaint.title}".`,
    Rejected:   `Your complaint "${complaint.title}" was rejected. Reason: ${rejectionReason}`,
  };

  if (messages[status]) {
    await notifyUser(complaint.citizen, messages[status], complaint._id, status.toLowerCase());
  }

  ApiSuccess(res, { data: complaint });
};

exports.resolveComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint not found', 404);
  if (!req.file) throw new AppError('After image is required to resolve a complaint', 400);

  const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'complaint-after');

  complaint.afterImage = cloudinaryResult.secure_url;
  complaint.fundsSpent = parseFloat(req.body.fundsSpent) || 0;
  complaint.status = 'Resolved';
  complaint.resolvedAt = new Date();
  complaint.timeline.push({
    status: 'Resolved',
    updatedBy: req.user._id,
    note: `Resolved by ${req.user.name}. Funds spent: ₹${complaint.fundsSpent.toLocaleString()}`,
  });

  await complaint.save();

  await notifyUser(
    complaint.citizen,
    `Your complaint "${complaint.title}" has been resolved!`,
    complaint._id,
    'resolved'
  );

  ApiSuccess(res, { data: complaint });
};

exports.upvoteComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint not found', 404);

  const userId = req.user._id.toString();
  const alreadyUpvoted = complaint.upvotedBy.map(id => id.toString()).includes(userId);

  if (alreadyUpvoted) {
    // Toggle off — remove upvote
    complaint.upvotedBy = complaint.upvotedBy.filter(id => id.toString() !== userId);
    complaint.upvotes = Math.max(0, complaint.upvotes - 1);
  } else {
    // Add upvote
    complaint.upvotedBy.push(req.user._id);
    complaint.upvotes += 1;
  }

  await complaint.save();
  ApiSuccess(res, { data: { upvotes: complaint.upvotes, upvoted: !alreadyUpvoted } });
};

// Public paginated complaint history with filters
exports.getPublicComplaints = async (req, res) => {
  const { status, category, search, city, ward, page = 1, limit = 12 } = req.query;
  const query = { status: { $ne: 'Rejected' } };

  if (status && status !== 'all') query.status = status;
  if (category && category !== 'all') query.category = category;
  if (search) query.title = { $regex: search, $options: 'i' };
  if (city) query['locationDetails.city'] = { $regex: city.trim(), $options: 'i' };
  if (ward) query['locationDetails.ward'] = { $regex: ward.trim(), $options: 'i' };

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .select('title category status location locationDetails beforeImage upvotes createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Complaint.countDocuments(query),
  ]);

  ApiSuccess(res, { data: complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
};
