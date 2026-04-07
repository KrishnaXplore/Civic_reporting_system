const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const { protect, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const complaintController = require('../controllers/complaint.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const VALID_CATEGORIES = [
  'Roads & Infrastructure',
  'Water & Sanitation',
  'Electricity',
  'Waste Management',
  'Parks & Public Spaces',
];

// Public routes — must be BEFORE /:id to avoid being matched as id param
router.get('/map',    asyncHandler(complaintController.getMapComplaints));
router.get('/public', asyncHandler(complaintController.getPublicComplaints));

router.post(
  '/',
  protect,
  roleGuard('citizen'),
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category'),
  ],
  validate,
  asyncHandler(complaintController.submitComplaint)
);

router.get(
  '/department',
  protect,
  roleGuard('officer', 'deptAdmin'),
  asyncHandler(complaintController.getDepartmentComplaints)
);

router.get('/', protect, asyncHandler(complaintController.getComplaints));

router.get('/:id', protect, asyncHandler(complaintController.getComplaintById));

router.put(
  '/:id/status',
  protect,
  roleGuard('officer', 'deptAdmin', 'superAdmin'),
  [body('status').isIn(['Assigned', 'InProgress', 'Rejected']).withMessage('Invalid status')],
  validate,
  asyncHandler(complaintController.updateComplaintStatus)
);

router.put(
  '/:id/resolve',
  protect,
  roleGuard('officer', 'deptAdmin'),
  upload.single('afterImage'),
  asyncHandler(complaintController.resolveComplaint)
);

router.post('/:id/upvote', protect, asyncHandler(complaintController.upvoteComplaint));

module.exports = router;
