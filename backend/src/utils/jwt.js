const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

const MS_PER_DAY = 86400000;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenExpiryDate() {
  const ms = parseExpiry(REFRESH_TOKEN_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

function parseExpiry(expiry) {
  const units = { s: 1000, m: 60000, h: 3600000, d: MS_PER_DAY };
  const match = String(expiry).match(/^(\d+)([smhd])$/);
  if (match) return parseInt(match[1]) * (units[match[2]] || MS_PER_DAY);
  return 30 * MS_PER_DAY;
}

module.exports = { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken, hashToken, getRefreshTokenExpiryDate };
