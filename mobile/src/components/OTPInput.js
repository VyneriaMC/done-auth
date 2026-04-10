import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function OTPInput({ value = '', onChange }) {
  const inputs = useRef([]);
  const digits = Array(6).fill('');
  const current = value.split('');

  const handleChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const arr = [...current];
    arr[index] = cleaned;
    const newStr = arr.join('').slice(0, 6);
    onChange(newStr);
    if (cleaned && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !current[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((_, index) => (
        <TextInput
          key={index}
          ref={ref => (inputs.current[index] = ref)}
          style={[styles.input, current[index] && styles.inputFilled]}
          value={current[index] || ''}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          placeholderTextColor="#8892b0"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20
  },
  input: {
    width: 46,
    height: 56,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  inputFilled: {
    borderColor: '#e94560'
  }
});
