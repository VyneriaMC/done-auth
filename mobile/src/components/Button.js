import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    (disabled || loading) && styles.disabled,
    style
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50
  },
  primary: {
    backgroundColor: '#e94560'
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e94560'
  },
  danger: {
    backgroundColor: '#c0392b'
  },
  disabled: {
    opacity: 0.6
  },
  text: {
    fontSize: 16,
    fontWeight: '600'
  },
  primaryText: {
    color: '#ffffff'
  },
  secondaryText: {
    color: '#e94560'
  },
  dangerText: {
    color: '#ffffff'
  }
});
