const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const departmentController = require('../controllers/department.controller');

router.post(
  '/',
  protect,
  roleGuard('superAdmin'),
  [body('name').trim().notEmpty().withMessage('Department name is required')],
  validate,
  asyncHandler(departmentController.createDepartment)
);

router.get('/', protect, asyncHandler(departmentController.getDepartments));

router.post(
  '/:id/officers',
  protect,
  roleGuard('superAdmin', 'deptAdmin'),
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(departmentController.addOfficer)
);

router.delete(
  '/:id/officers/:userId',
  protect,
  roleGuard('superAdmin', 'deptAdmin'),
  asyncHandler(departmentController.removeOfficer)
);

router.put(
  '/:id/admin',
  protect,
  roleGuard('superAdmin'),
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(departmentController.assignDeptAdmin)
);

module.exports = router;
