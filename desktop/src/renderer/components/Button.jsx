import React from 'react';

const variants = {
  primary: { backgroundColor: '#e94560', color: '#ffffff', border: 'none' },
  secondary: { backgroundColor: 'transparent', color: '#e94560', border: '1px solid #e94560' },
  danger: { backgroundColor: '#c0392b', color: '#ffffff', border: 'none' }
};

export default function Button({ title, onClick, variant = 'primary', loading = false, disabled = false, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.button,
        ...variants[variant],
        ...(disabled || loading ? styles.disabled : {}),
        ...style
      }}
    >
      {loading ? (
        <span style={styles.spinner}>⏳</span>
      ) : (
        title
      )}
    </button>
  );
}

const styles = {
  button: {
    width: '100%',
    padding: '13px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    minHeight: '48px'
  },
  disabled: { opacity: 0.6, cursor: 'not-allowed' },
  spinner: { fontSize: '16px' }
};
