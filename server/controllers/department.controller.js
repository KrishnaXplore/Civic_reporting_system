const Department = require('../models/Department');
const User = require('../models/User');
const { ApiSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getCache, setCache, delCache } = require('../utils/cache');

exports.createDepartment = async (req, res) => {
  const { name, description } = req.body;
  const dept = await Department.create({ name, description });
  await delCache('departments:list');
  ApiSuccess(res, { data: dept }, 201);
};

exports.getDepartments = async (req, res) => {
  const CACHE_KEY = 'departments:list';
  const cached = await getCache(CACHE_KEY);
  if (cached) return ApiSuccess(res, { data: cached });

  const departments = await Department.find()
    .populate('admin', 'name email')
    .populate('officers', 'name email status');

  await setCache(CACHE_KEY, departments, 600); // cache 10 minutes
  ApiSuccess(res, { data: departments });
};

exports.addOfficer = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new AppError('User not found', 404);
  if (user.role !== 'citizen') throw new AppError('User is already a staff member', 400);

  user.role = 'officer';
  user.department = req.params.id;
  await user.save();

  await Department.findByIdAndUpdate(req.params.id, { $addToSet: { officers: user._id } });
  ApiSuccess(res, { data: user });
};

exports.removeOfficer = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError('User not found', 404);

  user.role = 'citizen';
  user.department = null;
  await user.save();

  await Department.findByIdAndUpdate(req.params.id, { $pull: { officers: req.params.userId } });
  ApiSuccess(res, { message: 'Officer removed successfully' });
};

exports.assignDeptAdmin = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);

  user.role = 'deptAdmin';
  user.department = req.params.id;
  await user.save();

  await Department.findByIdAndUpdate(req.params.id, { admin: user._id });
  ApiSuccess(res, { data: user });
};
