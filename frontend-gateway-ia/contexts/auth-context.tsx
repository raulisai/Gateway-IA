'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, type User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check token expiration
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }, []);

  // Auto-logout on token expiration
  const checkTokenExpiration = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      console.log('Token expired, logging out...');
      handleLogout();
    }
  }, [isTokenExpired]);

  // Fetch current user
  const fetchUser = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Check if token is expired before making request
    if (isTokenExpired(token)) {
      console.log('Token expired during fetch');
      localStorage.removeItem('access_token');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await apiClient.auth.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isTokenExpired]);

  // Initialize auth state
  useEffect(() => {
    fetchUser();

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [fetchUser, checkTokenExpiration]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.auth.login(email, password);

      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token);
      }

      // Fetch user data after login
      await fetchUser();

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Credenciales incorrectas';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((d: any) => d.msg).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string, full_name?: string) => {
    try {
      await apiClient.auth.signup(email, password, full_name);

      // Auto-login after signup
      await login(email, password);
    } catch (error: any) {
      console.error('Signup failed:', error);
      let errorMessage = 'Error al crear la cuenta';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((d: any) => d.msg).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      throw new Error(errorMessage);
    }
  };

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      handleLogout();
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
