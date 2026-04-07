const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getCache, setCache, delCache } = require('../utils/cache');

const writeLog = (action, performedBy, details = '', targetUser = null, targetComplaint = null, ip = '') =>
  AuditLog.create({ action, performedBy, targetUser, targetComplaint, details, ip }).catch(() => {});

exports.getStats = async (req, res) => {
  const CACHE_KEY = 'admin:stats';
  const cached = await getCache(CACHE_KEY);
  if (cached) return ApiSuccess(res, { data: cached });

  const [totalComplaints, resolved, submitted, inProgress, totalCitizens, fundsResult, byDept, avgTimeResult] =
    await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Submitted' }),
      Complaint.countDocuments({ status: 'InProgress' }),
      User.countDocuments({ role: 'citizen' }),
      Complaint.aggregate([
        { $match: { status: 'Resolved' } },
        { $group: { _id: null, total: { $sum: '$fundsSpent' } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$dept.name', count: 1 } },
      ]),
      Complaint.aggregate([
        { $match: { status: 'Resolved', resolvedAt: { $ne: null } } },
        { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avg: { $avg: '$diff' } } },
      ]),
    ]);

  const totalFunds = fundsResult[0]?.total || 0;
  const avgResolutionDays = avgTimeResult[0]
    ? Math.round((avgTimeResult[0].avg / (1000 * 60 * 60 * 24)) * 10) / 10
    : null;

  const data = { totalComplaints, resolved, submitted, inProgress, totalCitizens, totalFunds, byDept, avgResolutionDays };
  await setCache(CACHE_KEY, data, 300); // cache 5 minutes
  ApiSuccess(res, { data });
};

exports.getFlaggedUsers = async (req, res) => {
  const users = await User.find({ strikeCount: { $gte: 3 }, status: { $ne: 'banned' } }).select(
    'name email strikeCount status createdAt'
  );
  ApiSuccess(res, { data: users });
};

exports.banUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'banned' }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  writeLog('USER_BANNED', req.user._id, `Banned user ${user.email}`, user._id, null, req.ip);
  await delCache('admin:stats');
  ApiSuccess(res, { data: user });
};

exports.clearStrikes = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { strikeCount: 0, status: 'active' },
    { new: true }
  );
  if (!user) throw new AppError('User not found', 404);
  writeLog('STRIKES_CLEARED', req.user._id, `Cleared strikes for ${user.email}`, user._id, null, req.ip);
  ApiSuccess(res, { data: user });
};

exports.getUsers = async (req, res) => {
  const users = await User.find().populate('department', 'name').select('-password');
  ApiSuccess(res, { data: users });
};

exports.getAuditLogs = async (req, res) => {
  const { action, page = 1, limit = 20 } = req.query;
  const query = action ? { action } : {};
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('performedBy', 'name email')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    AuditLog.countDocuments(query),
  ]);
  ApiSuccess(res, { data: logs, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getLocationStats = async (req, res) => {
  const { state, city, ward } = req.query;
  const locationQuery = {};
  if (state) locationQuery['locationDetails.state'] = { $regex: state, $options: 'i' };
  if (city)  locationQuery['locationDetails.city']  = { $regex: city,  $options: 'i' };
  if (ward)  locationQuery['locationDetails.ward']  = { $regex: ward,  $options: 'i' };

  const [total, resolved, inProgress, submitted, byCategory, byStatus, recentComplaints, avgTimeResult] =
    await Promise.all([
      Complaint.countDocuments(locationQuery),
      Complaint.countDocuments({ ...locationQuery, status: 'Resolved' }),
      Complaint.countDocuments({ ...locationQuery, status: 'InProgress' }),
      Complaint.countDocuments({ ...locationQuery, status: 'Submitted' }),
      Complaint.aggregate([
        { $match: locationQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),
      Complaint.aggregate([
        { $match: locationQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),
      Complaint.find(locationQuery)
        .select('title category status locationDetails createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Complaint.aggregate([
        { $match: { ...locationQuery, status: 'Resolved', resolvedAt: { $ne: null } } },
        { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avg: { $avg: '$diff' } } },
      ]),
    ]);

  const avgResolutionDays = avgTimeResult[0]
    ? Math.round((avgTimeResult[0].avg / (1000 * 60 * 60 * 24)) * 10) / 10
    : null;

  ApiSuccess(res, { data: { total, resolved, inProgress, submitted, byCategory, byStatus, recentComplaints, avgResolutionDays } });
};

// CSV Export — streams complaint data as downloadable CSV
exports.exportComplaints = async (req, res) => {
  const { state, city, status, category } = req.query;
  const query = {};
  if (state)    query['locationDetails.state'] = { $regex: state, $options: 'i' };
  if (city)     query['locationDetails.city']  = { $regex: city,  $options: 'i' };
  if (status)   query.status   = status;
  if (category) query.category = category;

  const complaints = await Complaint.find(query)
    .populate('citizen', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .limit(5000);

  const header = ['ID', 'Title', 'Category', 'Status', 'City', 'Ward', 'Locality', 'Citizen', 'Department', 'Funds Spent', 'Upvotes', 'Submitted At', 'Resolved At'];

  const rows = complaints.map((c) => [
    c._id.toString(),
    `"${(c.title || '').replace(/"/g, '""')}"`,
    c.category,
    c.status,
    c.locationDetails?.city || '',
    c.locationDetails?.ward || '',
    c.locationDetails?.locality || '',
    c.citizen?.name || '',
    c.department?.name || '',
    c.fundsSpent || 0,
    c.upvotes || 0,
    new Date(c.createdAt).toISOString().split('T')[0],
    c.resolvedAt ? new Date(c.resolvedAt).toISOString().split('T')[0] : '',
  ]);

  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="complaints-${Date.now()}.csv"`);
  res.send(csv);
};
