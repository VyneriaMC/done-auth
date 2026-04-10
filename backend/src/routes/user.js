const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, [
  body('username').optional().trim().isLength({ min: 3, max: 50 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Caractères invalides dans le nom d\'utilisateur'),
  body('email').optional().trim().isEmail().withMessage('Email invalide').normalizeEmail()
], updateProfile);

module.exports = router;
