const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home', trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default queries
    },
    googleId: {
      type: String,
      default: undefined,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['USER', 'EMPLOYEE', 'ADMIN'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    addresses: [addressSchema],

    // Email verification (signup)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
    },

    // Two-factor authentication (login)
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      select: false,
    },
    twoFactorCodeExpires: {
      type: Date,
      select: false,
    },

    // Password reset (forgot password)
    resetPasswordCode: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

/**
 * Hash password before saving whenever it has been modified.
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  if (this.$locals && this.$locals.passwordAlreadyHashed) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

/**
 * Compare a plain-text candidate against the stored hash.
 */
userSchema.methods.matchPassword = async function matchPassword(candidate) {
  if (!this.password || typeof this.password !== 'string') {
    return false;
  }
  return bcrypt.compare(candidate, this.password);
};

/**
 * Return a safe, frontend-shaped user object.
 */
userSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    status: this.status || 'ACTIVE',
    phone: this.phone || undefined,
    avatar: this.avatar || undefined,
    googleId: this.googleId || undefined,
    hasPassword: this.password !== undefined && this.password !== null && this.password !== '',
    addresses: this.addresses || [],
  };
};

module.exports = mongoose.model('User', userSchema);
