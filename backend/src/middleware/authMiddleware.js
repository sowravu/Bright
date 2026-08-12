const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies the JWT from the Authorization header
 * and attaches the current user to req.user.
 * Rejects BLOCKED user accounts immediately with 403 Forbidden.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator. Access denied.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Restrict a route to specific roles. Usage: authorize('ADMIN').
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  return next();
};

module.exports = { protect, authorize };
