const { query } = require('../config/database');

class User {
  static async findById(id) {
    const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async create({ username, email, password }) {
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    return { id: result.insertId, username, email };
  }

  static async updateOTPSecret(userId, secret) {
    await query(
      'UPDATE users SET otp_secret = ?, otp_verified = FALSE WHERE id = ?',
      [secret, userId]
    );
  }

  static async enableOTP(userId) {
    await query(
      'UPDATE users SET otp_enabled = TRUE, otp_verified = TRUE WHERE id = ?',
      [userId]
    );
  }

  static async disableOTP(userId) {
    await query(
      'UPDATE users SET otp_enabled = FALSE, otp_verified = FALSE, otp_secret = NULL WHERE id = ?',
      [userId]
    );
  }
}

module.exports = User;
