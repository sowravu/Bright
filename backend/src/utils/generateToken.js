const jwt = require('jsonwebtoken');

/**
 * Sign a JWT for a given user id and role.
 */
const generateToken = (userId, role) => {
  const normalizedRole = typeof role === 'string' ? role.toUpperCase() : role;
  return jwt.sign({ id: userId, role: normalizedRole }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
