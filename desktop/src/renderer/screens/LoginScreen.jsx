import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }

    const result = await login(email, password);
    if (result.requireOTP) {
      navigate('/verify-otp', { state: { tempToken: result.tempToken } });
    } else if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>🔐</span>
          <h1 style={styles.title}>DONE Auth</h1>
          <p style={styles.subtitle}>Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && <p style={styles.error}>{error}</p>}

          <div style={{ marginTop: '8px' }}>
            <Button title="Se connecter" loading={isLoading} />
          </div>
        </form>

        <p style={styles.link}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={styles.linkAccent}>S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', padding: '24px' },
  card: { backgroundColor: '#16213e', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', border: '1px solid #0f3460' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '56px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#ffffff', margin: '12px 0 6px' },
  subtitle: { color: '#8892b0', fontSize: '15px' },
  error: { color: '#e94560', fontSize: '13px', marginBottom: '12px', textAlign: 'center' },
  link: { textAlign: 'center', marginTop: '20px', color: '#8892b0', fontSize: '14px' },
  linkAccent: { color: '#e94560', fontWeight: '600', textDecoration: 'none' }
};
