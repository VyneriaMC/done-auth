import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import useAuthStore from '../store/authStore';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';

export default function SetupOTPScreen({ navigation }) {
  const [otpData, setOtpData] = useState(null);
  const [token, setToken] = useState('');
  const { setupOTP, confirmOTP, isLoading } = useAuthStore();

  const handleSetup = async () => {
    const result = await setupOTP();
    if (result.success) {
      setOtpData(result.data);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleConfirm = async () => {
    if (token.length !== 6) {
      Alert.alert('Erreur', 'Entrez le code à 6 chiffres de votre application');
      return;
    }
    const result = await confirmOTP(token);
    if (result.success) {
      Alert.alert('Succès', 'OTP activé avec succès !', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
      ]);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configurer l'authentification à deux facteurs</Text>

      {!otpData ? (
        <>
          <Text style={styles.description}>
            Activez l'authentification à deux facteurs pour sécuriser votre compte avec Google Authenticator ou Authy.
          </Text>
          <Button title="Générer le QR Code" onPress={handleSetup} loading={isLoading} style={styles.button} />
        </>
      ) : (
        <>
          <Text style={styles.step}>1. Scannez ce QR code avec Google Authenticator</Text>
          <View style={styles.qrContainer}>
            <QRCode value={otpData.otpauthUrl} size={200} color="#ffffff" backgroundColor="#1a1a2e" />
          </View>

          <Text style={styles.step}>2. Ou entrez ce code manuellement :</Text>
          <View style={styles.secretBox}>
            <Text style={styles.secret} selectable>{otpData.secret}</Text>
          </View>

          <Text style={styles.step}>3. Entrez le code à 6 chiffres généré :</Text>
          <OTPInput value={token} onChange={setToken} />

          <Button title="Confirmer l'activation" onPress={handleConfirm} loading={isLoading} style={styles.button} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 16 },
  description: { color: '#8892b0', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  step: { color: '#ccd6f6', fontWeight: '600', alignSelf: 'flex-start', marginBottom: 12, marginTop: 8 },
  qrContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0f3460'
  },
  secretBox: {
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460'
  },
  secret: { color: '#e94560', fontFamily: 'monospace', fontSize: 14, textAlign: 'center', letterSpacing: 2 },
  button: { width: '100%', marginTop: 8 }
});
