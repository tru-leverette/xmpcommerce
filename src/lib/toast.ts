import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string, duration = 4000) => {
    toast.success(message, {
      duration,
      style: {
        background: '#10b981', // Green
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  info: (message: string, duration = 4000) => {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#3b82f6', // Blue
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    });
  },

  warning: (message: string, duration = 6000) => {
    toast(message, {
      duration,
      icon: '⚠️',
      style: {
        background: '#f59e0b', // Orange
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    });
  },

  error: (message: string, duration = 6000) => {
    toast.error(message, {
      duration,
      style: {
        background: '#ef4444', // Red
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },
};
