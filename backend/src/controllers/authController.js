const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { generateSecret, generateQRCode, verifyToken: verifyOTPToken } = require('../utils/otp');

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

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
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

    res.json({
      message: 'Connexion réussie',
      token,
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

    res.json({
      message: 'Authentification réussie',
      token: authToken,
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

module.exports = { register, login, verifyOTP, setupOTP, confirmOTP, disableOTP };
