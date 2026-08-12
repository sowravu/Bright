const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const generateToken = require('../utils/generateToken');
const generateCode = require('../utils/generateCode');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const CODE_TTL_MS = 10 * 60 * 1000; // 2FA codes valid for 10 minutes

/**
 * A small typed error helper so controllers can map to HTTP status codes.
 */
class ServiceError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Register a new user.
 */
const register = async ({ name, email, password, phone }) => {
  // Reject if a verified/real account with that email already exists.
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ServiceError(409, 'An account with that email already exists');
  }

  // Reject if a verified/real account with that phone number already exists.
  if (phone && phone.trim()) {
    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      throw new ServiceError(409, 'An account with that phone number already exists');
    }
  }

  const otp = generateCode();
  const hashedPassword = await PendingUser.hashPassword(password);

  await PendingUser.findOneAndUpdate(
    { email },
    {
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      otp,
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpEmail({ to: email, name, otp });
  } catch (err) {
    await PendingUser.deleteOne({ email });
    throw new ServiceError(
      502,
      'Could not send the verification email. Please try again later.'
    );
  }

  return {
    message: 'Verification code sent to your email. Enter it to activate your account.',
    email,
  };
};

/**
 * Verify a registration OTP.
 */
const verifyEmail = async ({ email, code }) => {
  const pending = await PendingUser.findOne({ email });

  if (!pending) {
    throw new ServiceError(
      400,
      'No pending registration found or it has expired. Please register again.'
    );
  }
  if (!pending.matchOtp(code)) {
    throw new ServiceError(400, 'Invalid verification code');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    await PendingUser.deleteOne({ email });
    throw new ServiceError(400, 'This account is already verified. Please log in.');
  }

  const user = new User({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    phone: pending.phone,
    isEmailVerified: true,
  });
  user.$locals.passwordAlreadyHashed = true;
  await user.save();

  await PendingUser.deleteOne({ email });

  return {
    token: generateToken(user._id, user.role),
    user: user.toAuthJSON(),
  };
};

/**
 * Resend a fresh OTP for a pending (unverified) registration.
 */
const resendVerification = async ({ email }) => {
  const pending = await PendingUser.findOne({ email });
  if (!pending) {
    throw new ServiceError(
      400,
      'No pending registration found or it has expired. Please register again.'
    );
  }

  const otp = generateCode();
  pending.otp = otp;
  pending.createdAt = new Date();
  await pending.save();

  try {
    await sendOtpEmail({ to: email, name: pending.name, otp });
  } catch (err) {
    throw new ServiceError(
      502,
      'Could not send the verification email. Please try again later.'
    );
  }

  return { message: 'A new verification code has been sent to your email.' };
};

/**
 * Log in with email + password.
 * Rejects blocked users instantly with 403 Forbidden.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ServiceError(401, 'Invalid email or password');
  }

  if (!user.password || user.password.trim() === '') {
    throw new ServiceError(
      400,
      'This account was created using Google Sign-In and does not have a password set. Please sign in with Google or use "Forgot Password?" to set a password.'
    );
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ServiceError(401, 'Invalid email or password');
  }

  if (user.status === 'BLOCKED') {
    throw new ServiceError(403, 'Your account has been blocked by an administrator. Access denied.');
  }

  if (!user.isEmailVerified) {
    throw new ServiceError(403, 'Please verify your email before logging in.');
  }

  if (user.isTwoFactorEnabled) {
    const twoFactorCode = generateCode();
    user.twoFactorCode = twoFactorCode;
    user.twoFactorCodeExpires = new Date(Date.now() + CODE_TTL_MS);
    await user.save();

    return {
      require2FA: true,
      userId: user._id.toString(),
      devTwoFactorCode: process.env.NODE_ENV === 'development' ? twoFactorCode : undefined,
    };
  }

  return {
    token: generateToken(user._id, user.role),
    user: user.toAuthJSON(),
  };
};

/**
 * Verify a 2FA challenge code for a user mid-login, and issue a JWT.
 */
const verifyTwoFactor = async ({ userId, code }) => {
  const user = await User.findById(userId).select(
    '+twoFactorCode +twoFactorCodeExpires'
  );

  if (!user) {
    throw new ServiceError(404, 'Account not found');
  }
  if (user.status === 'BLOCKED') {
    throw new ServiceError(403, 'Your account has been blocked by an administrator. Access denied.');
  }
  if (!user.twoFactorCode || user.twoFactorCodeExpires < new Date()) {
    throw new ServiceError(400, '2FA code has expired. Please log in again.');
  }
  if (user.twoFactorCode !== code) {
    throw new ServiceError(400, 'Invalid 2FA code');
  }

  user.twoFactorCode = undefined;
  user.twoFactorCodeExpires = undefined;
  await user.save();

  return {
    token: generateToken(user._id, user.role),
    user: user.toAuthJSON(),
  };
};

/**
 * Fetch profile details for a user.
 */
/**
 * Fetch profile details for a user.
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');
  return user.toAuthJSON();
};

/**
 * Update user account details (name and phone number).
 */
const updateProfile = async (userId, { name, phone }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');

  if (name !== undefined && name.trim()) {
    user.name = name.trim();
  }

  if (phone !== undefined) {
    const trimmedPhone = phone.trim();
    if (trimmedPhone && trimmedPhone !== user.phone) {
      const existing = await User.findOne({ phone: trimmedPhone, _id: { $ne: userId } });
      if (existing) {
        throw new ServiceError(409, 'An account with that phone number already exists');
      }
    }
    user.phone = trimmedPhone;
  }

  await user.save();
  return user.toAuthJSON();
};

/**
 * Get all saved addresses for a user.
 */
const getAddresses = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');
  return user.addresses || [];
};

/**
 * Add a new address to user's addresses array.
 */
const addAddress = async (userId, { label, street, city, postalCode, isDefault }) => {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');

  if (!street || !city || !postalCode) {
    throw new ServiceError(400, 'Street, city, and postal code are required');
  }

  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({
    label: label || 'Home',
    street: street.trim(),
    city: city.trim(),
    postalCode: postalCode.trim(),
    isDefault: !!isDefault || user.addresses.length === 0,
  });

  await user.save();
  return user.addresses;
};

/**
 * Delete an address from user's addresses array by addressId.
 */
const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');

  user.addresses = user.addresses.filter((addr) => addr._id.toString() !== addressId);
  await user.save();
  return user.addresses;
};

/**
 * Change / set password for a logged-in user.
 * If user has no existing password (e.g. Google OAuth user), currentPassword is not required.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ServiceError(404, 'User not found');
  if (user.status === 'BLOCKED') throw new ServiceError(403, 'Account blocked by administrator');

  if (!newPassword || newPassword.trim().length < 6) {
    throw new ServiceError(400, 'New password must be at least 6 characters long');
  }

  const hasExistingPassword = !!(user.password && user.password.trim() !== '');

  if (hasExistingPassword) {
    if (!currentPassword) {
      throw new ServiceError(400, 'Current password is required to change password');
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ServiceError(400, 'Current password is incorrect');
    }
  }

  user.password = newPassword.trim();
  await user.save();

  return {
    message: hasExistingPassword
      ? 'Password updated successfully'
      : 'Account password set successfully! You can now log in using your email and password.',
    user: user.toAuthJSON(),
  };
};

/**
 * Handle Google Sign-In authentication.
 * Checks if user with email already exists:
 * - If user exists: logs in as existing user, links googleId, marks email as verified, clean up pending reg.
 * - If user does not exist: creates a new verified user account.
 */
const googleLogin = async ({ idToken, gUser }) => {
  let email, name, googleId, avatar;

  if (idToken) {
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name || payload.email.split('@')[0];
        googleId = payload.sub;
        avatar = payload.picture || '';
      } else {
        // Fallback token decode if GOOGLE_CLIENT_ID is not configured in env
        const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        email = decoded.email;
        name = decoded.name || decoded.email.split('@')[0];
        googleId = decoded.sub;
        avatar = decoded.picture || '';
      }
    } catch (err) {
      if (gUser && gUser.email) {
        email = gUser.email;
        name = gUser.name;
        googleId = gUser.googleId || gUser.sub;
        avatar = gUser.picture || gUser.avatar;
      } else {
        throw new ServiceError(400, 'Invalid Google authentication token');
      }
    }
  } else if (gUser && gUser.email) {
    email = gUser.email;
    name = gUser.name || gUser.email.split('@')[0];
    googleId = gUser.googleId || gUser.sub || `google_${Date.now()}`;
    avatar = gUser.picture || gUser.avatar || '';
  } else {
    throw new ServiceError(400, 'Google token or user details required');
  }

  if (!email) {
    throw new ServiceError(400, 'Could not retrieve email from Google Sign-In');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if an account already exists with this email
  let user = await User.findOne({ email: normalizedEmail });
  let isExistingAccount = false;

  if (user) {
    // Existing email account found! Log into this account (don't add duplicate user)
    isExistingAccount = true;

    if (user.status === 'BLOCKED') {
      throw new ServiceError(403, 'Your account has been blocked by an administrator. Access denied.');
    }

    user.isEmailVerified = true;
    if (!user.googleId) {
      user.googleId = googleId;
    }
    if (avatar && !user.avatar) {
      user.avatar = avatar;
    }
    await user.save();
  } else {
    // New user signing up via Google
    user = new User({
      name: name || 'Google User',
      email: normalizedEmail,
      googleId: googleId || `google_${Date.now()}`,
      avatar: avatar || '',
      isEmailVerified: true,
      role: 'USER',
    });
    await user.save();
  }

  // Remove any stale unverified registration in PendingUser
  await PendingUser.deleteOne({ email: normalizedEmail });

  return {
    token: generateToken(user._id, user.role),
    user: user.toAuthJSON(),
    isExistingAccount,
    message: isExistingAccount
      ? `Welcome back! Logged into your existing account (${user.email}).`
      : `Account created successfully with Google.`,
  };
};

/**
 * Request a 6-digit password reset OTP email.
 */
const forgotPassword = async ({ email }) => {
  if (!email) throw new ServiceError(400, 'Email address is required');

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: 'If an account exists with that email, a password reset code has been sent.',
      email: normalizedEmail,
    };
  }

  if (user.status === 'BLOCKED') {
    throw new ServiceError(403, 'Your account has been blocked by an administrator.');
  }

  const otp = generateCode();
  const ttlMs = 15 * 60 * 1000; // 15 minutes

  user.resetPasswordCode = otp;
  user.resetPasswordExpires = new Date(Date.now() + ttlMs);
  await user.save();

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, otp });
  } catch (err) {
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new ServiceError(502, 'Could not send the password reset email. Please try again later.');
  }

  return {
    message: 'A 6-digit password reset code has been sent to your email.',
    email: normalizedEmail,
    devCode: process.env.NODE_ENV === 'development' ? otp : undefined,
  };
};

/**
 * Verify 6-digit reset OTP code and set new password.
 */
const resetPassword = async ({ email, code, newPassword }) => {
  if (!email || !code || !newPassword) {
    throw new ServiceError(400, 'Email, reset code, and new password are required');
  }

  if (newPassword.trim().length < 6) {
    throw new ServiceError(400, 'New password must be at least 6 characters long');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+resetPasswordCode +resetPasswordExpires'
  );

  if (!user) {
    throw new ServiceError(400, 'Invalid email or reset code');
  }

  if (user.status === 'BLOCKED') {
    throw new ServiceError(403, 'Account blocked by administrator');
  }

  if (
    !user.resetPasswordCode ||
    !user.resetPasswordExpires ||
    user.resetPasswordExpires < new Date()
  ) {
    throw new ServiceError(400, 'The password reset code has expired. Please request a new code.');
  }

  if (user.resetPasswordCode !== code.trim()) {
    throw new ServiceError(400, 'Invalid password reset code');
  }

  user.password = newPassword.trim();
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  user.isEmailVerified = true;
  await user.save();

  return {
    message: 'Password reset successfully! You are now logged in.',
    token: generateToken(user._id, user.role),
    user: user.toAuthJSON(),
  };
};

module.exports = {
  ServiceError,
  register,
  verifyEmail,
  resendVerification,
  login,
  verifyTwoFactor,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  changePassword,
  googleLogin,
  forgotPassword,
  resetPassword,
};
