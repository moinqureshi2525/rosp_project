import React, { createContext, useContext, useState, useEffect } from 'react';
import { canteenAPI } from '../services/api';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('canteen_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('canteen_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Sync Supabase Auth listener if available
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email;
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
        const profile = {
          id: session.user.id,
          email: email,
          full_name: session.user.user_metadata?.full_name || (role === 'admin' ? 'Canteen Admin' : 'Student User'),
          role,
        };
        setUser(profile);
        setToken(session.access_token);
        localStorage.setItem('canteen_user', JSON.stringify(profile));
        localStorage.setItem('canteen_token', session.access_token);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Try Supabase auth first
      let authResult;
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!supaErr && supaData?.user) {
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
        authResult = {
          user: {
            id: supaData.user.id,
            email,
            full_name: supaData.user.user_metadata?.full_name || email.split('@')[0],
            role,
          },
          access_token: supaData.session.access_token,
        };
      } else {
        // Fallback to FastAPI backend auth API
        authResult = await canteenAPI.login(email, password);
      }

      setUser(authResult.user);
      setToken(authResult.access_token);
      localStorage.setItem('canteen_user', JSON.stringify(authResult.user));
      localStorage.setItem('canteen_token', authResult.access_token);
      return authResult.user;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Invalid login credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Attempt Supabase signUp
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
      const { data: supaData, error: supaErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      // Also notify/sync backend API profile creation
      await canteenAPI.register(fullName, email, password, role);

      // Auto-login registered user
      return await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed. Email may already be registered.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('canteen_user');
    localStorage.removeItem('canteen_token');
  };

  const value = {
    user,
    role: user?.role || null,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
