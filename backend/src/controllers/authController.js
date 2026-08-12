const authService = require('../services/authService');

/**
 * Wrap async controller functions so thrown errors reach the error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Map a ServiceError to its status code; rethrow anything else.
 */
const send = (res, statusCode, payload) => res.status(statusCode).json(payload);

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const result = await authService.register({ name, email, password, phone });
    return send(res, 201, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  try {
    const result = await authService.verifyEmail({ email, code });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/resend-code
const resendCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.resendVerification({ email });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login({ email, password });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/2fa/verify
const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  try {
    const result = await authService.verifyTwoFactor({ userId, code });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// GET /api/auth/profile (protected)
const getProfile = asyncHandler(async (req, res) => {
  try {
    const result = await authService.getProfile(req.user._id);
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// PUT /api/auth/profile (protected)
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await authService.updateProfile(req.user._id, { name, phone });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// GET /api/auth/addresses (protected)
const getAddresses = asyncHandler(async (req, res) => {
  try {
    const result = await authService.getAddresses(req.user._id);
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/addresses (protected)
const addAddress = asyncHandler(async (req, res) => {
  const { label, street, city, postalCode, isDefault } = req.body;
  try {
    const result = await authService.addAddress(req.user._id, { label, street, city, postalCode, isDefault });
    return send(res, 201, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// DELETE /api/auth/addresses/:id (protected)
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const result = await authService.deleteAddress(req.user._id, id);
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// PUT /api/auth/change-password (protected)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await authService.changePassword(req.user._id, { currentPassword, newPassword });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, gUser } = req.body;
  try {
    const result = await authService.googleLogin({ idToken, gUser });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.forgotPassword({ email });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const result = await authService.resetPassword({ email, code, newPassword });
    return send(res, 200, result);
  } catch (err) {
    if (err.statusCode) return send(res, err.statusCode, { message: err.message });
    throw err;
  }
});

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  verifyTwoFactor,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  changePassword,
};
