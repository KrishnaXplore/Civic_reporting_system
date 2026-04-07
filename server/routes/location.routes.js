const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validate');
const { reverseGeocode } = require('../utils/geocode');
const { ApiSuccess } = require('../utils/apiResponse');

// GET /api/v1/location/reverse?lat=12.97&lng=77.59
router.get(
  '/reverse',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    ApiSuccess(res, { data: result });
  })
);

module.exports = router;
