const crypto = require('crypto');

// Toy password hashing — NOT for real auth. Demo-only.
const SALT = 'devzy-stub-salt';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(SALT + password).digest('hex');

const verifyPassword = (password, hash) =>
  hashPassword(password) === hash;

const generateToken = (userId) =>
  crypto.randomBytes(16).toString('hex') + ':' + userId;

const parseToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes(':')) return null;
  const parts = token.split(':');
  if (parts.length !== 2) return null;
  const userId = parseInt(parts[1], 10);
  if (Number.isNaN(userId)) return null;
  return { userId };
};

module.exports = { hashPassword, verifyPassword, generateToken, parseToken };
