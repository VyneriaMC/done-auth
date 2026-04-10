const { query } = require('../config/database');

const VAULT_HISTORY_DAYS = 30;
const VAULT_MAX_BLOB_BYTES = 5 * 1024 * 1024; // 5 MB base64
const MS_PER_DAY = 86400 * 1000;

class Vault {
  static async findByUserId(userId) {
    const rows = await query('SELECT * FROM vaults WHERE user_id = ?', [userId]);
    return rows[0] || null;
  }

  static async upsert({ userId, blob, kdf, wrappedKeyMaster, wrappedKeyRecovery, metadata, newRevision }) {
    const kdfJson = kdf ? JSON.stringify(kdf) : null;
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    const existing = await Vault.findByUserId(userId);

    if (existing) {
      await query(
        `UPDATE vaults
         SET blob = ?, kdf = ?, wrapped_key_master = ?, wrapped_key_recovery = ?,
             metadata = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [blob, kdfJson, wrappedKeyMaster || null, wrappedKeyRecovery || null, metaJson, newRevision, userId]
      );
      return await Vault.findByUserId(userId);
    } else {
      const result = await query(
        `INSERT INTO vaults (user_id, blob, kdf, wrapped_key_master, wrapped_key_recovery, metadata, revision)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, blob, kdfJson, wrappedKeyMaster || null, wrappedKeyRecovery || null, metaJson, newRevision]
      );
      return await Vault.findByUserId(userId);
    }
  }

  static async saveVersion({ vaultId, userId, blob, kdf, wrappedKeyMaster, wrappedKeyRecovery, metadata, revision }) {
    const kdfJson = kdf ? JSON.stringify(kdf) : null;
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const size = Buffer.byteLength(blob, 'utf8');

    const result = await query(
      `INSERT INTO vault_versions
         (vault_id, user_id, blob, kdf, wrapped_key_master, wrapped_key_recovery, metadata, revision, size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vaultId, userId, blob, kdfJson, wrappedKeyMaster || null, wrappedKeyRecovery || null, metaJson, revision, size]
    );
    return result.insertId;
  }

  static async getHistory(userId) {
    const cutoff = new Date(Date.now() - VAULT_HISTORY_DAYS * MS_PER_DAY);
    const rows = await query(
      `SELECT id, vault_id, revision, size, created_at,
              kdf, wrapped_key_master, wrapped_key_recovery, metadata
       FROM vault_versions
       WHERE user_id = ? AND created_at >= ?
       ORDER BY created_at DESC`,
      [userId, cutoff]
    );
    return rows;
  }

  static async getVersion(userId, versionId) {
    const rows = await query(
      'SELECT * FROM vault_versions WHERE id = ? AND user_id = ?',
      [versionId, userId]
    );
    return rows[0] || null;
  }

  static async purgeOldVersions() {
    const cutoff = new Date(Date.now() - VAULT_HISTORY_DAYS * MS_PER_DAY);
    const result = await query(
      'DELETE FROM vault_versions WHERE created_at < ?',
      [cutoff]
    );
    return result.affectedRows || 0;
  }
}

module.exports = { Vault, VAULT_MAX_BLOB_BYTES };
