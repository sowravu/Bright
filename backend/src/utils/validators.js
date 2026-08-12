const { body, validationResult } = require('express-validator');

/**
 * Validation chains for the register endpoint.
 */
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional({ checkFalsy: true }).trim(),
];

/**
 * Validation chains for the login endpoint.
 */
const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Validation chains for email verification.
 */
const verifyEmailValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('A 6-digit code is required'),
];

/**
 * Validation chains for 2FA verification.
 */
const twoFactorValidator = [
  body('userId').trim().notEmpty().withMessage('userId is required'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('A 6-digit code is required'),
];

/**
 * Middleware that collects express-validator results and returns a 400
 * with the first error message if any validation failed.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
};

module.exports = {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  twoFactorValidator,
  handleValidation,
};
