const express = require('express');
const router = express.Router();
const { getVault, updateVault, getVaultHistory, getVaultVersion } = require('../controllers/vaultController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getVault);
router.put('/', authMiddleware, updateVault);
router.get('/history', authMiddleware, getVaultHistory);
router.get('/history/:versionId', authMiddleware, getVaultVersion);

module.exports = router;
