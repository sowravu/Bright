/**
 * Generate a random 6-digit numeric code (as a string) for email
 * verification and 2FA challenges.
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generateCode;
