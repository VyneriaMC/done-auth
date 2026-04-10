import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../store/authStore';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';

export default function SetupOTPScreen() {
  const [otpData, setOtpData] = useState(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const { setupOTP, confirmOTP, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSetup = async () => {
    const result = await setupOTP();
    if (result.success) setOtpData(result.data);
    else setMessage(result.error);
  };

  const handleConfirm = async () => {
    if (token.length !== 6) { setMessage('Entrez le code à 6 chiffres'); return; }
    const result = await confirmOTP(token);
    if (result.success) {
      setMessage('OTP activé avec succès !');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Configurer l'OTP</h1>
        <p style={styles.subtitle}>Authentification à deux facteurs</p>

        {!otpData ? (
          <>
            <p style={styles.description}>
              Sécurisez votre compte avec Google Authenticator ou Authy.
              Scannez le QR code pour commencer.
            </p>
            <Button title="Générer le QR Code" onClick={handleSetup} loading={isLoading} />
          </>
        ) : (
          <>
            <p style={styles.step}>1. Scannez ce QR code avec Google Authenticator :</p>
            <div style={styles.qrContainer}>
              <QRCodeSVG value={otpData.otpauthUrl} size={200} bgColor="#1a1a2e" fgColor="#ffffff" />
            </div>

            <p style={styles.step}>2. Ou entrez ce code manuellement :</p>
            <div style={styles.secretBox}>
              <code style={styles.secret}>{otpData.secret}</code>
            </div>

            <p style={styles.step}>3. Entrez le code à 6 chiffres généré :</p>
            <OTPInput value={token} onChange={setToken} />

            <Button title="Confirmer l'activation" onClick={handleConfirm} loading={isLoading} />
          </>
        )}

        {message && (
          <p style={{ ...styles.message, color: message.includes('succès') ? '#4ecca3' : '#e94560' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', padding: '24px' },
  card: { backgroundColor: '#16213e', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '480px', border: '1px solid #0f3460' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' },
  subtitle: { color: '#8892b0', marginBottom: '24px' },
  description: { color: '#ccd6f6', marginBottom: '24px', lineHeight: '1.6' },
  step: { color: '#ccd6f6', fontWeight: '600', marginBottom: '12px', marginTop: '16px' },
  qrContainer: { display: 'flex', justifyContent: 'center', backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #0f3460' },
  secretBox: { backgroundColor: '#1a1a2e', padding: '12px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center', border: '1px solid #0f3460' },
  secret: { color: '#e94560', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '2px' },
  message: { marginTop: '16px', textAlign: 'center', fontWeight: '600' }
};
