const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'done_auth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function initDatabase() {
  // Test connection
  const conn = await pool.getConnection();
  console.log('✅ Connexion MySQL établie');
  conn.release();

  // Create tables if not exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      otp_secret VARCHAR(255) DEFAULT NULL,
      otp_enabled BOOLEAN DEFAULT FALSE,
      otp_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_rt_token_hash (token_hash),
      INDEX idx_rt_user_id (user_id)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vaults (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      blob LONGTEXT NOT NULL,
      kdf JSON DEFAULT NULL,
      wrapped_key_master TEXT DEFAULT NULL,
      wrapped_key_recovery TEXT DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      revision INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vault_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vault_id INT NOT NULL,
      user_id INT NOT NULL,
      blob LONGTEXT NOT NULL,
      kdf JSON DEFAULT NULL,
      wrapped_key_master TEXT DEFAULT NULL,
      wrapped_key_recovery TEXT DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      revision INT NOT NULL,
      size INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_vv_user_created (user_id, created_at)
    )
  `);

  console.log('✅ Tables vérifiées/créées');
}

module.exports = { query, pool, initDatabase };
