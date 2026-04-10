# DONE Auth

Application d'authentification à deux facteurs (2FA) compatible Google Authenticator — disponible sur **Windows**, **Linux**, **iOS** et **Android** — avec synchronisation cloud E2EE (zero-knowledge).

## Description

DONE Auth reproduit le fonctionnement de Google Authenticator avec un système complet de gestion de comptes utilisateurs. Les codes TOTP (Time-based One-Time Password) sont conformes à la norme RFC 6238 et compatibles avec Google Authenticator, Authy et toute application TOTP standard.

En plus, le backend implémente un **vault chiffré côté client** (E2EE) : le serveur stocke uniquement le blob chiffré et ne voit jamais les secrets en clair.

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
# Modifier .env avec vos paramètres MySQL, JWT_SECRET et REFRESH_TOKEN_SECRET
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

## Configuration

Copiez `.env.example` en `.env` et remplissez les variables :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=done_auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRES_IN=30d
OTP_ISSUER=DONE Auth
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Configuration MySQL

Créez la base de données :

```sql
CREATE DATABASE done_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Les tables sont créées **automatiquement** au premier démarrage du backend (`users`, `refresh_tokens`, `vaults`, `vault_versions`).

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
5. **Dashboard** : Gérez votre profil, vault E2EE et paramètres OTP

## API Endpoints

### Authentification (`/api/auth`)

| Méthode | Route | Description | Auth requis |
|---------|-------|-------------|-------------|
| POST | `/register` | Créer un compte | Non |
| POST | `/login` | Connexion | Non |
| POST | `/verify-otp` | Vérifier code OTP | Temp token |
| POST | `/refresh` | Renouveler les tokens (rotation) | Non |
| POST | `/logout` | Révoquer le refresh token | Non |
| POST | `/setup-otp` | Initialiser OTP | Oui |
| POST | `/confirm-otp` | Activer OTP | Oui |
| POST | `/disable-otp` | Désactiver OTP | Oui |

### Utilisateur (`/api/user`)

| Méthode | Route | Description | Auth requis |
|---------|-------|-------------|-------------|
| GET | `/profile` | Récupérer le profil | Oui |
| PUT | `/profile` | Mettre à jour le profil | Oui |

### Vault E2EE (`/api/vault`)

| Méthode | Route | Description | Auth requis |
|---------|-------|-------------|-------------|
| GET | `/` | Récupérer le vault chiffré | Oui |
| PUT | `/` | Mettre à jour le vault (concurrence optimiste) | Oui |
| GET | `/history` | Lister les versions (30 derniers jours) | Oui |
| GET | `/history/:versionId` | Récupérer une version précise | Oui |

#### PUT /api/vault — Corps de la requête

```json
{
  "baseRevision": 0,
  "blob": "<base64-encoded encrypted vault>",
  "kdf": { "algorithm": "argon2id", "params": { ... } },
  "wrappedKeyMaster": "<base64>",
  "wrappedKeyRecovery": "<base64>",
  "metadata": { ... }
}
```

- `baseRevision` doit correspondre à la révision actuelle côté serveur.
- En cas de conflit : **HTTP 409** avec `{ currentRevision, updatedAt }`.
- Taille maximale du blob : **5 MB**.

## Exemples curl / PowerShell

### Register

```powershell
$body = @{ username="alice"; email="alice@example.com"; password="Secret123!" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -ContentType "application/json" -Body $body
$token = $r.token
$refreshToken = $r.refreshToken
```

### Login

```powershell
$body = @{ email="alice@example.com"; password="Secret123!" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $r.token
$refreshToken = $r.refreshToken
```

### Refresh tokens

```powershell
$body = @{ refreshToken = $refreshToken } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/refresh" -Method Post -ContentType "application/json" -Body $body
$token = $r.token
$refreshToken = $r.refreshToken
```

### Logout

```powershell
$body = @{ refreshToken = $refreshToken } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/logout" -Method Post -ContentType "application/json" -Body $body
```

### Get profile

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/user/profile" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

### PUT vault (first upload, baseRevision=0)

```powershell
$vaultBody = @{
  baseRevision = 0
  blob = "base64encodedencryptedvaultblob=="
  kdf = @{ algorithm = "argon2id" }
  wrappedKeyMaster = "base64wrappedkey=="
  wrappedKeyRecovery = $null
  metadata = @{ hint = "my vault" }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/vault" -Method Put -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $vaultBody
```

### GET vault

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/vault" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

### GET vault history

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/vault/history" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

### GET specific vault version

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/vault/history/1" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

## Structure du projet

```
DONE-Auth/
├── backend/              # API Node.js + Express + MySQL
│   ├── src/
│   │   ├── config/       # Configuration base de données
│   │   ├── controllers/  # Logique métier (auth, user, vault)
│   │   ├── middleware/   # Auth JWT, validation
│   │   ├── models/       # Modèles utilisateur et vault
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
- **Access token** JWT de courte durée (défaut : 15 min)
- **Refresh token** rotatif à longue durée (défaut : 30 jours), hashé en base de données
- **Rate limiting** : 100 requêtes / 15 minutes
- En-têtes sécurisés avec **Helmet**
- Validation des entrées avec **express-validator**
- TOTP **window: 1** (tolérance ±30 secondes)
- **Zero-knowledge vault** : le serveur ne déchiffre jamais le blob

## Nettoyage automatique

Au démarrage et toutes les 24 heures, le serveur purge automatiquement les versions de vault datant de plus de **30 jours**.

