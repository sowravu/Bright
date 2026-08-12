const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * A pending registration awaiting email OTP verification.
 *
 * The real `User` document is NOT created until the OTP is verified.
 * Each pending record auto-expires 15 minutes after creation via a TTL
 * index on `createdAt`, so abandoned signups clean themselves up.
 */
const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // one pending signup per email at a time
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true, // stored already-hashed
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL: document is removed 900 seconds (15 min) after createdAt
    expires: 900,
  },
});

/**
 * Compare a candidate OTP against the stored one.
 */
pendingUserSchema.methods.matchOtp = function matchOtp(candidate) {
  return this.otp === candidate;
};

/**
 * Hash a plain password for storage in a pending record.
 */
pendingUserSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model('PendingUser', pendingUserSchema);
