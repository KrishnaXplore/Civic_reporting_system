const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { protect, roleGuard } = require('../middleware/auth');

router.get('/stats', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const submitted = await Complaint.countDocuments({ status: 'Submitted' });
    const inProgress = await Complaint.countDocuments({ status: 'InProgress' });
    const totalCitizens = await User.countDocuments({ role: 'citizen' });

    const fundsResult = await Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      { $group: { _id: null, total: { $sum: '$fundsSpent' } } },
    ]);
    const totalFunds = fundsResult[0]?.total || 0;

    const byDept = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$dept.name', count: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { totalComplaints, resolved, submitted, inProgress, totalCitizens, totalFunds, byDept },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/flagged-users', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const users = await User.find({ strikeCount: { $gte: 3 }, status: { $ne: 'banned' } })
      .select('name email strikeCount status createdAt');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/ban', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'banned' }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/clear-strikes', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { strikeCount: 0, status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const users = await User.find().populate('department', 'name').select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
