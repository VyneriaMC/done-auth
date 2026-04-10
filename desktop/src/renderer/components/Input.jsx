import React from 'react';

export default function Input({ label, error, type = 'text', ...props }) {
  return (
    <div style={styles.container}>
      {label && <label style={styles.label}>{label}</label>}
      <input
        type={type}
        style={{
          ...styles.input,
          ...(error ? styles.inputError : {})
        }}
        {...props}
      />
      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  );
}

const styles = {
  container: { marginBottom: '16px' },
  label: {
    display: 'block',
    color: '#ccd6f6',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    backgroundColor: '#16213e',
    color: '#ffffff',
    border: '1px solid #0f3460',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  inputError: {
    borderColor: '#e94560'
  },
  errorText: {
    color: '#e94560',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block'
  }
};
