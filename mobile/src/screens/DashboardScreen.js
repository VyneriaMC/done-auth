import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert
} from 'react-native';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import OTPInput from '../components/OTPInput';

export default function DashboardScreen({ navigation }) {
  const { user, logout, setupOTP, disableOTP, fetchProfile, isLoading } = useAuthStore();
  const [disableToken, setDisableToken] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleSetupOTP = () => {
    navigation.navigate('SetupOTP');
  };

  const handleDisableOTP = async () => {
    if (disableToken.length !== 6) {
      Alert.alert('Erreur', 'Entrez le code à 6 chiffres');
      return;
    }
    const result = await disableOTP(disableToken);
    if (result.success) {
      setShowDisableForm(false);
      setDisableToken('');
      Alert.alert('Succès', 'OTP désactivé');
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>DONE Auth</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profil</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <Text style={styles.value}>{user?.username || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '—'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Authentification à deux facteurs</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Statut OTP</Text>
          <View style={[styles.badge, user?.otp_enabled ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{user?.otp_enabled ? '✅ Activé' : '❌ Désactivé'}</Text>
          </View>
        </View>

        {!user?.otp_enabled ? (
          <Button title="Configurer OTP" onPress={handleSetupOTP} style={styles.actionButton} />
        ) : (
          <>
            {!showDisableForm ? (
              <Button title="Désactiver OTP" variant="danger" onPress={() => setShowDisableForm(true)} style={styles.actionButton} />
            ) : (
              <>
                <Text style={styles.disableLabel}>Entrez votre code OTP actuel pour confirmer :</Text>
                <OTPInput value={disableToken} onChange={setDisableToken} />
                <Button title="Confirmer la désactivation" variant="danger" onPress={handleDisableOTP} loading={isLoading} style={styles.actionButton} />
                <Button title="Annuler" variant="secondary" onPress={() => { setShowDisableForm(false); setDisableToken(''); }} style={styles.actionButton} />
              </>
            )}
          </>
        )}
      </View>

      <Button title="Se déconnecter" variant="secondary" onPress={handleLogout} style={styles.logoutButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 8 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0f3460'
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#e94560', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { color: '#8892b0', fontSize: 14 },
  value: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeActive: { backgroundColor: 'rgba(78, 204, 163, 0.15)' },
  badgeInactive: { backgroundColor: 'rgba(233, 69, 96, 0.15)' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  actionButton: { marginTop: 8 },
  disableLabel: { color: '#ccd6f6', marginBottom: 4, fontSize: 14 },
  logoutButton: { marginTop: 8 }
});
