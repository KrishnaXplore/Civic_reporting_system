// Spreads payload so callers control key names:
// ApiSuccess(res, { user })  → { success: true, user }
// ApiSuccess(res, { data })  → { success: true, data }
// ApiSuccess(res, { data, total, page, pages })  → full paginated shape
const ApiSuccess = (res, payload = {}, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, ...payload });
};

const ApiError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { ApiSuccess, ApiError };
