import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';

export default function DashboardScreen() {
  const { user, logout, disableOTP, fetchProfile, isLoading } = useAuthStore();
  const [disableToken, setDisableToken] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDisableOTP = async () => {
    if (disableToken.length !== 6) { setMessage('Entrez le code à 6 chiffres'); return; }
    const result = await disableOTP(disableToken);
    if (result.success) {
      setShowDisableForm(false);
      setDisableToken('');
      setMessage('OTP désactivé avec succès');
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>🔐</span>
            <h1 style={styles.title}>DONE Auth</h1>
          </div>
          <Button title="Déconnexion" onClick={handleLogout} variant="secondary" style={{ width: 'auto', padding: '8px 20px' }} />
        </div>

        {/* Profile card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Profil</h2>
          <div style={styles.row}>
            <span style={styles.label}>Nom d'utilisateur</span>
            <span style={styles.value}>{user?.username || '—'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user?.email || '—'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Membre depuis</span>
            <span style={styles.value}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        </div>

        {/* OTP card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Authentification à deux facteurs</h2>
          <div style={styles.row}>
            <span style={styles.label}>Statut OTP</span>
            <span style={{ ...styles.badge, ...(user?.otp_enabled ? styles.badgeActive : styles.badgeInactive) }}>
              {user?.otp_enabled ? '✅ Activé' : '❌ Désactivé'}
            </span>
          </div>

          {!user?.otp_enabled ? (
            <div style={{ marginTop: '16px' }}>
              <Button title="Configurer OTP" onClick={() => navigate('/setup-otp')} />
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {!showDisableForm ? (
                <Button title="Désactiver OTP" variant="danger" onClick={() => setShowDisableForm(true)} />
              ) : (
                <>
                  <p style={styles.disableLabel}>Entrez votre code OTP actuel pour confirmer :</p>
                  <OTPInput value={disableToken} onChange={setDisableToken} />
                  <div style={{ marginBottom: '8px' }}>
                    <Button title="Confirmer la désactivation" variant="danger" onClick={handleDisableOTP} loading={isLoading} />
                  </div>
                  <Button title="Annuler" variant="secondary" onClick={() => { setShowDisableForm(false); setDisableToken(''); }} />
                </>
              )}
            </div>
          )}

          {message && (
            <p style={{ ...styles.message, color: message.includes('succès') ? '#4ecca3' : '#e94560' }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#1a1a2e', padding: '24px' },
  container: { maxWidth: '700px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '36px' },
  title: { fontSize: '26px', fontWeight: 'bold', color: '#ffffff' },
  card: { backgroundColor: '#16213e', borderRadius: '12px', padding: '24px', marginBottom: '20px', border: '1px solid #0f3460' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#e94560', marginBottom: '20px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  label: { color: '#8892b0', fontSize: '14px' },
  value: { color: '#ffffff', fontSize: '14px', fontWeight: '500' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#ffffff' },
  badgeActive: { backgroundColor: 'rgba(78, 204, 163, 0.15)' },
  badgeInactive: { backgroundColor: 'rgba(233, 69, 96, 0.15)' },
  disableLabel: { color: '#ccd6f6', fontSize: '14px', marginBottom: '4px' },
  message: { marginTop: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }
};
