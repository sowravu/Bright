const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  twoFactorValidator,
  handleValidation,
} = require('../utils/validators');

const router = express.Router();

// ---- Signup flow ----
router.post('/register', registerValidator, handleValidation, authController.register);
router.post('/verify-email', verifyEmailValidator, handleValidation, authController.verifyEmail);
router.post('/resend-code', authController.resendCode);

// ---- Login flow ----
router.post('/login', loginValidator, handleValidation, authController.login);
router.post('/2fa/verify', twoFactorValidator, handleValidation, authController.verifyTwoFactor);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ---- Protected Profile & Address Management ----
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

router.get('/addresses', protect, authController.getAddresses);
router.post('/addresses', protect, authController.addAddress);
router.delete('/addresses/:id', protect, authController.deleteAddress);

module.exports = router;
