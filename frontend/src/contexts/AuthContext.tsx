'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as apiLogin, register as apiRegister, logout as apiLogout, setAccessToken, removeAccessToken, getAccessToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        setUser({
          _id: payload.userId as string,
          email: payload.email as string,
          firstName: payload.firstName as string,
          lastName: payload.lastName as string,
        });
      } else {
        removeAccessToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      return { success: true, message: response.message };
    }
    return { success: false, message: response.message };
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await apiRegister(email, password, firstName, lastName);
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      return { success: true, message: response.message };
    }
    return { success: false, message: response.message };
  };

  const logout = async () => {
    await apiLogout();
    removeAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
