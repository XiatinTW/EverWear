import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose && onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  let bg = '#333';
  if (type === 'success') bg = '#acd5c7ff';
  if (type === 'error') bg = '#8b565cff';
  if (type === 'info') bg = '#b5cae4ff';

  return (
    <div style={{
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 9999,
      minWidth: 220,
      height: 48,
      background: bg,
      color: '#323b4cff',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      padding: '14px 24px',
      justifyContent: 'center',
      fontSize: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'fadeIn 0.3s',
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, marginLeft: 'auto', cursor: 'pointer', width: '20%' }}>&times;</button>
    </div>
  );
};

export default Toast;
