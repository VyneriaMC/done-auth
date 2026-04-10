require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./src/config/database');
const { Vault } = require('./src/models/Vault');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const vaultRoutes = require('./src/routes/vault');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Electron, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vault', vaultRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// Scheduled vault history cleanup (purge versions older than 30 days)
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
async function runCleanup() {
  try {
    const deleted = await Vault.purgeOldVersions();
    if (deleted > 0) {
      console.log(`🧹 Nettoyage vault: ${deleted} version(s) supprimée(s) (>30 jours)`);
    }
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage vault:', err);
  }
}

// Start server
async function start() {
  try {
    await initDatabase();

    // Run cleanup on startup, then every 24 hours
    await runCleanup();
    setInterval(runCleanup, CLEANUP_INTERVAL_MS);

    app.listen(PORT, () => {
      console.log(`✅ DONE Auth API démarrée sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1);
  }
}

start();
