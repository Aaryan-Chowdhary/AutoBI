import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('autobi_token');
      if (token) {
        try {
          const userData = await api('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Session restore failed:', error);
          localStorage.removeItem('autobi_token');
        }
      }
      setLoading(false);
    };

    initSession();
  }, []);

  const loginWithFirebase = async (idToken) => {
    try {
      const res = await api('/auth/firebase', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
      localStorage.setItem('autobi_token', res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, error: error.message || 'Firebase login failed.' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('autobi_token', res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.setItem('autobi_token', res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to register.' };
    }
  };

  const sendOtp = async (email, name) => {
    try {
      const res = await api('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, name })
      });
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send OTP.' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      localStorage.setItem('autobi_token', res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid OTP code.' };
    }
  };

  const resetPasswordOtp = async (email) => {
    try {
      const res = await api('/auth/reset-password-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send reset code.' };
    }
  };

  const verifyResetPassword = async (email, otp, newPassword) => {
    try {
      const res = await api('/auth/verify-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reset password.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('autobi_token');
    setUser(null);
  };

  // Temporarily define isAdmin until real roles are implemented
  const isAdmin = user?.email === 'admin@autobi.com';

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginWithFirebase, register, sendOtp, verifyOtp,
      resetPasswordOtp, verifyResetPassword, logout, isAdmin
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
