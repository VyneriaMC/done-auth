const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, refreshTokens, logout, setupOTP, confirmOTP, disableOTP } = require('../controllers/authController');
const { validateRegister, validateLogin, validateOTP } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/refresh', refreshTokens);
router.post('/logout', logout);
router.post('/setup-otp', authMiddleware, setupOTP);
router.post('/confirm-otp', authMiddleware, validateOTP, confirmOTP);
router.post('/disable-otp', authMiddleware, validateOTP, disableOTP);

module.exports = router;
