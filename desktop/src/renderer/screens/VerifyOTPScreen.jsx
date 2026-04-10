import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';

const OTP_PERIOD = 30;

export default function VerifyOTPScreen() {
  const [token, setToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_PERIOD);
  const [error, setError] = useState('');
  const { verifyOTP, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tempToken = location.state?.tempToken;

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(OTP_PERIOD - (now % OTP_PERIOD));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = useCallback(async () => {
    if (token.length !== 6) return;
    setError('');
    const result = await verifyOTP(token, tempToken);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Code OTP invalide');
      setToken('');
    }
  }, [token, tempToken, verifyOTP, navigate]);

  useEffect(() => {
    if (token.length === 6) handleVerify();
  }, [token, handleVerify]);

  const progress = (timeLeft / OTP_PERIOD) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Vérification OTP</h1>
        <p style={styles.subtitle}>Entrez le code à 6 chiffres de votre application d'authentification</p>

        <OTPInput value={token} onChange={setToken} />

        <div style={styles.timerContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: timeLeft <= 5 ? '#e94560' : '#4ecca3' }} />
          </div>
          <p style={{ ...styles.timerText, color: timeLeft <= 5 ? '#e94560' : '#8892b0' }}>
            Nouveau code dans {timeLeft}s
          </p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <Button title="Vérifier" onClick={handleVerify} loading={isLoading} disabled={token.length !== 6} />
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', padding: '24px' },
  card: { backgroundColor: '#16213e', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', border: '1px solid #0f3460', textAlign: 'center' },
  title: { fontSize: '26px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' },
  subtitle: { color: '#8892b0', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' },
  timerContainer: { marginBottom: '24px' },
  progressBar: { height: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s linear' },
  timerText: { fontSize: '13px' },
  error: { color: '#e94560', fontSize: '13px', marginBottom: '12px' }
};
