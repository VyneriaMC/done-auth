const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, hashToken, getRefreshTokenExpiryDate } = require('../utils/jwt');
const { generateSecret, generateQRCode, verifyToken: verifyOTPToken } = require('../utils/otp');
const { query } = require('../config/database');

async function _issueRefreshToken(userId) {
  const refreshToken = generateRefreshToken({ id: userId });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiryDate();
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
  return refreshToken;
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Check if username already exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ username, email, password: hashedPassword });

    const token = generateToken({ id: user.id, username: user.username, email: user.email });
    const refreshToken = await _issueRefreshToken(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (user.otp_enabled) {
      // Return a temporary token for OTP verification
      const tempToken = generateToken({ id: user.id, temp: true });
      return res.json({
        requireOTP: true,
        tempToken,
        message: 'Code OTP requis'
      });
    }

    const token = generateToken({ id: user.id, username: user.username, email: user.email });
    const refreshToken = await _issueRefreshToken(user.id);

    res.json({
      message: 'Connexion réussie',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        otp_enabled: user.otp_enabled
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}

async function verifyOTP(req, res) {
  try {
    const { token } = req.body;
    const tempToken = req.headers.authorization?.split(' ')[1];

    if (!tempToken) {
      return res.status(401).json({ error: 'Token temporaire manquant' });
    }

    const { verifyToken: verifyJWT } = require('../utils/jwt');
    let decoded;
    try {
      decoded = verifyJWT(tempToken);
    } catch {
      return res.status(401).json({ error: 'Token temporaire invalide ou expiré' });
    }

    if (!decoded.temp) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.otp_enabled || !user.otp_secret) {
      return res.status(400).json({ error: 'OTP non configuré pour cet utilisateur' });
    }

    const isValid = verifyOTPToken(user.otp_secret, token);
    if (!isValid) {
      return res.status(401).json({ error: 'Code OTP invalide' });
    }

    const authToken = generateToken({ id: user.id, username: user.username, email: user.email });
    const refreshToken = await _issueRefreshToken(user.id);

    res.json({
      message: 'Authentification réussie',
      token: authToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        otp_enabled: user.otp_enabled
      }
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ error: 'Erreur lors de la vérification OTP' });
  }
}

async function setupOTP(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { base32, otpauth_url } = generateSecret(user.username);
    await User.updateOTPSecret(user.id, base32);

    const qrCode = await generateQRCode(otpauth_url);

    res.json({
      message: 'Configuration OTP initialisée',
      secret: base32,
      qrCode,
      otpauthUrl: otpauth_url
    });
  } catch (err) {
    console.error('setupOTP error:', err);
    res.status(500).json({ error: 'Erreur lors de la configuration OTP' });
  }
}

async function confirmOTP(req, res) {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || !user.otp_secret) {
      return res.status(400).json({ error: 'OTP non initialisé. Appelez /setup-otp d\'abord' });
    }

    const isValid = verifyOTPToken(user.otp_secret, token);
    if (!isValid) {
      return res.status(401).json({ error: 'Code OTP invalide' });
    }

    await User.enableOTP(user.id);

    res.json({ message: 'OTP activé avec succès' });
  } catch (err) {
    console.error('confirmOTP error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'activation OTP' });
  }
}

async function disableOTP(req, res) {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || !user.otp_enabled || !user.otp_secret) {
      return res.status(400).json({ error: 'OTP non activé pour cet utilisateur' });
    }

    const isValid = verifyOTPToken(user.otp_secret, token);
    if (!isValid) {
      return res.status(401).json({ error: 'Code OTP invalide' });
    }

    await User.disableOTP(user.id);

    res.json({ message: 'OTP désactivé avec succès' });
  } catch (err) {
    console.error('disableOTP error:', err);
    res.status(500).json({ error: 'Erreur lors de la désactivation OTP' });
  }
}

async function refreshTokens(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken requis' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    const tokenHash = hashToken(refreshToken);
    const rows = await query(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND user_id = ? AND expires_at > NOW()',
      [tokenHash, decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token révoqué ou expiré' });
    }

    // Rotate: delete old token and issue new ones
    await query('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const newToken = generateToken({ id: user.id, username: user.username, email: user.email });
    const newRefreshToken = await _issueRefreshToken(user.id);

    res.json({
      message: 'Tokens renouvelés',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('refreshTokens error:', err);
    res.status(500).json({ error: 'Erreur lors du renouvellement des tokens' });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    }
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
}

module.exports = { register, login, verifyOTP, refreshTokens, logout, setupOTP, confirmOTP, disableOTP };
