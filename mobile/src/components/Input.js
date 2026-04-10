import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function Input({ label, error, ...props }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#8892b0"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    color: '#ccd6f6',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#16213e',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  inputError: {
    borderColor: '#e94560'
  },
  errorText: {
    color: '#e94560',
    fontSize: 12,
    marginTop: 4
  }
});
