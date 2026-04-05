const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, roleGuard } = require('../middleware/auth');

router.post('/', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const dept = await Department.create({ name, description });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('admin', 'name email')
      .populate('officers', 'name email status');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/officers', protect, roleGuard('superAdmin', 'deptAdmin'), async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'citizen') return res.status(400).json({ success: false, message: 'User is already a staff member' });

    user.role = 'officer';
    user.department = req.params.id;
    await user.save();

    await Department.findByIdAndUpdate(req.params.id, { $addToSet: { officers: user._id } });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/officers/:userId', protect, roleGuard('superAdmin', 'deptAdmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'citizen';
    user.department = null;
    await user.save();

    await Department.findByIdAndUpdate(req.params.id, { $pull: { officers: req.params.userId } });

    res.status(200).json({ success: true, message: 'Officer removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/admin', protect, roleGuard('superAdmin'), async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'deptAdmin';
    user.department = req.params.id;
    await user.save();

    await Department.findByIdAndUpdate(req.params.id, { admin: user._id });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
