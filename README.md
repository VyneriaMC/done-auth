# DONE Auth

Application d'authentification à deux facteurs (2FA) compatible Google Authenticator — disponible sur **Windows**, **Linux**, **iOS** et **Android**.

## Description

DONE Auth reproduit le fonctionnement de Google Authenticator avec un système complet de gestion de comptes utilisateurs. Les codes TOTP (Time-based One-Time Password) sont conformes à la norme RFC 6238 et compatibles avec Google Authenticator, Authy et toute application TOTP standard.

## Stack technologique

| Composant | Technologies |
|-----------|-------------|
| **Backend** | Node.js + Express + MySQL + speakeasy (TOTP) + jsonwebtoken + bcryptjs |
| **Desktop** | Electron.js + React + Vite (Windows & Linux) |
| **Mobile** | React Native + Expo (iOS & Android) |
| **Auth** | TOTP RFC 6238 — SHA1, 6 chiffres, 30 secondes |
| **Style** | Thème dark professionnel — fond `#1a1a2e`, accent `#e94560` |

## Prérequis

- Node.js v18+
- MySQL 8+
- Expo CLI (`npm install -g expo-cli`) pour le mobile
- Git

## Installation

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Modifier .env avec vos paramètres MySQL et JWT_SECRET
npm run dev
```

### Mobile (React Native + Expo)

```bash
cd mobile
npm install
expo start
```

Scannez le QR code avec l'application **Expo Go** sur votre appareil.

### Desktop (Electron + React)

```bash
cd desktop
npm install
npm run dev
```

## Configuration MySQL

Créez la base de données :

```sql
CREATE DATABASE done_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Les tables sont créées **automatiquement** au premier démarrage du backend.

### Schéma de la table `users`

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  otp_secret VARCHAR(255) DEFAULT NULL,
  otp_enabled BOOLEAN DEFAULT FALSE,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Flux d'utilisation

```
Register → Login → (Setup OTP → Confirm OTP) → Dashboard
                       ↑                              |
                       └──── Disable OTP (si activé) ┘
```

1. **Register** : Créez un compte avec username, email, mot de passe
2. **Login** : Connectez-vous (si OTP activé → redirection vers VerifyOTP)
3. **Setup OTP** : Scannez le QR code avec Google Authenticator
4. **Confirm OTP** : Entrez le code à 6 chiffres pour activer
5. **Dashboard** : Gérez votre profil et vos paramètres OTP

## API Endpoints

### Authentification (`/api/auth`)

| Méthode | Route | Description | Auth requis |
|---------|-------|-------------|-------------|
| POST | `/register` | Créer un compte | Non |
| POST | `/login` | Connexion | Non |
| POST | `/verify-otp` | Vérifier code OTP | Temp token |
| POST | `/setup-otp` | Initialiser OTP | Oui |
| POST | `/confirm-otp` | Activer OTP | Oui |
| POST | `/disable-otp` | Désactiver OTP | Oui |

### Utilisateur (`/api/user`)

| Méthode | Route | Description | Auth requis |
|---------|-------|-------------|-------------|
| GET | `/profile` | Récupérer le profil | Oui |
| PUT | `/profile` | Mettre à jour le profil | Oui |

## Structure du projet

```
DONE-Auth/
├── backend/              # API Node.js + Express + MySQL
│   ├── src/
│   │   ├── config/       # Configuration base de données
│   │   ├── controllers/  # Logique métier (auth, user)
│   │   ├── middleware/   # Auth JWT, validation
│   │   ├── models/       # Modèle utilisateur
│   │   ├── routes/       # Définition des routes
│   │   └── utils/        # JWT & OTP helpers
│   ├── .env.example
│   └── server.js
├── mobile/               # React Native + Expo
│   ├── src/
│   │   ├── components/   # Input, Button, OTPInput
│   │   ├── screens/      # Login, Register, SetupOTP, VerifyOTP, Dashboard
│   │   ├── navigation/   # Stack navigator
│   │   ├── services/     # API Axios
│   │   └── store/        # État global Zustand
│   └── App.js
└── desktop/              # Electron + React + Vite
    ├── src/
    │   ├── main/         # Process principal Electron
    │   └── renderer/     # Interface React
    │       ├── components/
    │       ├── screens/
    │       ├── services/
    │       └── store/
    └── vite.config.js
```

## Sécurité

- Mots de passe hashés avec **bcrypt** (12 rounds)
- Tokens JWT avec expiration configurable (défaut : 7 jours)
- **Rate limiting** : 100 requêtes / 15 minutes
- En-têtes sécurisés avec **Helmet**
- Validation des entrées avec **express-validator**
- TOTP **window: 1** (tolérance ±30 secondes) 
