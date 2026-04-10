import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert
} from 'react-native';
import useAuthStore from '../store/authStore';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';

const OTP_PERIOD = 30;

export default function VerifyOTPScreen({ navigation, route }) {
  const { tempToken } = route.params || {};
  const [token, setToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_PERIOD);
  const { verifyOTP, isLoading } = useAuthStore();
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(OTP_PERIOD - (now % OTP_PERIOD));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (token.length === 6) {
      handleVerify();
    }
  }, [token, handleVerify]);

  const handleVerify = useCallback(async () => {
    if (token.length !== 6) return;
    const result = await verifyOTP(token, tempToken);
    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } else {
      Alert.alert('Erreur', result.error || 'Code OTP invalide');
      setToken('');
    }
  }, [token, tempToken, verifyOTP, navigation]);

  const progress = timeLeft / OTP_PERIOD;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification OTP</Text>
      <Text style={styles.subtitle}>Entrez le code à 6 chiffres de votre application d'authentification</Text>

      <OTPInput value={token} onChange={setToken} />

      <View style={styles.timerContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: timeLeft <= 5 ? '#e94560' : '#4ecca3' }]} />
        </View>
        <Text style={[styles.timerText, timeLeft <= 5 && styles.timerUrgent]}>
          Nouveau code dans {timeLeft}s
        </Text>
      </View>

      <Button title="Vérifier" onPress={handleVerify} loading={isLoading} style={styles.button} disabled={token.length !== 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#8892b0', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  timerContainer: { width: '100%', alignItems: 'center', marginBottom: 24 },
  progressBar: { width: '100%', height: 6, backgroundColor: '#16213e', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  timerText: { color: '#8892b0', fontSize: 13 },
  timerUrgent: { color: '#e94560', fontWeight: 'bold' },
  button: { width: '100%' }
});
