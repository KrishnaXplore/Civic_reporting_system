const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/admin.controller');

const adminRoles = ['superAdmin', 'cityAdmin', 'stateAdmin', 'wardOfficer'];

router.get('/stats', asyncHandler(adminController.getStats));
router.get('/stats/location', protect, roleGuard(...adminRoles), asyncHandler(adminController.getLocationStats));
router.get('/flagged-users', protect, roleGuard('superAdmin'), asyncHandler(adminController.getFlaggedUsers));
router.put('/users/:id/ban', protect, roleGuard('superAdmin'), asyncHandler(adminController.banUser));
router.put('/users/:id/clear-strikes', protect, roleGuard('superAdmin'), asyncHandler(adminController.clearStrikes));
router.get('/users', protect, roleGuard('superAdmin'), asyncHandler(adminController.getUsers));
router.get('/audit-logs', protect, roleGuard('superAdmin'), asyncHandler(adminController.getAuditLogs));
router.get('/export', protect, roleGuard('superAdmin', 'cityAdmin', 'stateAdmin'), asyncHandler(adminController.exportComplaints));

module.exports = router;
