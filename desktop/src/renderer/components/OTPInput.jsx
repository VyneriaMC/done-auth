import React, { useRef } from 'react';

export default function OTPInput({ value = '', onChange }) {
  const inputs = useRef([]);
  const digits = Array(6).fill('');
  const current = value.split('');

  const handleChange = (e, index) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const arr = [...current];
    arr[index] = cleaned;
    const newStr = arr.join('').slice(0, 6);
    onChange(newStr);
    if (cleaned && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !current[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div style={styles.container}>
      {digits.map((_, index) => (
        <input
          key={index}
          ref={ref => (inputs.current[index] = ref)}
          style={{
            ...styles.input,
            ...(current[index] ? styles.inputFilled : {})
          }}
          value={current[index] || ''}
          onChange={e => handleChange(e, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          type="text"
          inputMode="numeric"
          maxLength={1}
        />
      ))}
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' },
  input: {
    width: '48px',
    height: '58px',
    backgroundColor: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    outline: 'none'
  },
  inputFilled: { borderColor: '#e94560' }
};
