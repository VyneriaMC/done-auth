import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();

  const validate = () => {
    const errs = {};
    if (!username || username.length < 3) errs.username = 'Minimum 3 caractères';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Email invalide';
    if (!password || password.length < 8) errs.password = 'Minimum 8 caractères';
    if (password !== confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const result = await register(username, email, password);
    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez DONE Auth</Text>

        <Input
          label="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          placeholder="johndoe"
          autoCapitalize="none"
          error={errors.username}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button title="S'inscrire" onPress={handleRegister} loading={isLoading} style={styles.button} />
        <Button
          title="Déjà un compte ? Se connecter"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8892b0', marginBottom: 32 },
  button: { marginTop: 8, marginBottom: 12 }
});
