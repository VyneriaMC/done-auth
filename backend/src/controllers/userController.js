const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { query } = require('../config/database');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        otp_enabled: user.otp_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
}

async function updateProfile(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const userId = req.user.id;

    // Check if new username is taken by another user
    if (username) {
      const existing = await User.findByUsername(username);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }
    }

    // Check if new email is taken by another user
    if (email) {
      const existing = await User.findByEmail(email);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    const fields = [];
    const values = [];
    if (username) { fields.push('username = ?'); values.push(username); }
    if (email) { fields.push('email = ?'); values.push(email); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(userId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await User.findById(userId);
    res.json({
      message: 'Profil mis à jour',
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        otp_enabled: updated.otp_enabled
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
}

module.exports = { getProfile, updateProfile };
