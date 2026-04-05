const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, roleGuard } = require('../middleware/auth');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendSSE } = require('../utils/sse');
const { runMLChecks } = require('../utils/mlProcessor');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const categoryToDept = {
  'Roads & Infrastructure': 'Roads & Infrastructure',
  'Water & Sanitation': 'Water & Sanitation',
  'Electricity': 'Electricity',
  'Waste Management': 'Waste Management',
  'Parks & Public Spaces': 'Parks & Public Spaces',
};

const notifyUser = async (userId, message, complaintId, type) => {
  await Notification.create({ recipient: userId, message, complaintId, type });
  sendSSE(userId, { message, complaintId, type });
};

router.get('/map', async (req, res) => {
  try {
    const complaints = await Complaint.find(
      { status: { $ne: 'Rejected' } },
      { location: 1, status: 1, category: 1, title: 1, createdAt: 1 }
    );
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, roleGuard('citizen'), upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, lat, lng } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }

    // Upload image to Cloudinary first
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'complaint-before');

    const dept = await Department.findOne({ name: categoryToDept[category] });

    // Save complaint immediately (status = Submitted)
    const complaint = await Complaint.create({
      title,
      description,
      category,
      beforeImage: cloudinaryResult.secure_url,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      citizen: req.user._id,
      department: dept ? dept._id : null,
    });

    // Respond to citizen immediately — don't make them wait for ML checks
    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint submitted! Our system is verifying your image in the background.',
    });

    // Run ML checks in background (non-blocking)
    runMLChecks(complaint._id, req.file.buffer, req.user._id).catch(err =>
      console.error('[ML] Background check failed silently:', err.message)
    );

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') query.citizen = req.user._id;
    else if (req.user.role === 'officer') query.department = req.user.department;

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/department', protect, roleGuard('officer', 'deptAdmin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { department: req.user.department };
    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);
    res.status(200).json({ success: true, data: complaints, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone profilePhoto')
      .populate('assignedTo', 'name email profilePhoto')
      .populate('department', 'name');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, roleGuard('officer', 'deptAdmin', 'superAdmin'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    complaint.status = status;
    if (status === 'Assigned') complaint.assignedTo = req.user._id;
    if (rejectionReason) complaint.rejectionReason = rejectionReason;
    await complaint.save();

    const messages = {
      Assigned: `Your complaint "${complaint.title}" has been assigned to an officer.`,
      InProgress: `Work has started on your complaint "${complaint.title}".`,
      Rejected: `Your complaint "${complaint.title}" was rejected. Reason: ${rejectionReason}`,
    };

    if (messages[status]) {
      await notifyUser(complaint.citizen, messages[status], complaint._id, status.toLowerCase());
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/resolve', protect, roleGuard('officer', 'deptAdmin'), upload.single('afterImage'), async (req, res) => {
  try {
    const { fundsSpent } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'After image is required' });

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'complaint-after');

    complaint.afterImage = cloudinaryResult.secure_url;
    complaint.fundsSpent = parseFloat(fundsSpent) || 0;
    complaint.status = 'Resolved';
    await complaint.save();

    await notifyUser(
      complaint.citizen,
      `Your complaint "${complaint.title}" has been resolved!`,
      complaint._id,
      'resolved'
    );

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
