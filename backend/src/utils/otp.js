const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

function generateSecret(username) {
  const secret = speakeasy.generateSecret({
    name: `${process.env.OTP_ISSUER || 'DONE Auth'}:${username}`,
    issuer: process.env.OTP_ISSUER || 'DONE Auth',
    length: 20
  });
  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url
  };
}

async function generateQRCode(otpauthUrl) {
  const qrCode = await QRCode.toDataURL(otpauthUrl);
  return qrCode;
}

function verifyToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
}

module.exports = { generateSecret, generateQRCode, verifyToken };
