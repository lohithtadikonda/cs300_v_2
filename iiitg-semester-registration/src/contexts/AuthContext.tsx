import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authApi, clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getStoredToken() ? getStoredUser() : null));

  const login = useCallback(async (email: string, password: string) => {
    const { user: authenticatedUser, token } = await authApi.login(email, password);
    setUser(authenticatedUser);
    setStoredAuth(authenticatedUser, token);
    return authenticatedUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearStoredAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  warden: 'Warden',
  finance: 'Finance Section',
  student_affairs: 'Student Affairs',
  academic_affairs: 'Academic Affairs',
  admin: 'Admin',
};

export const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/student',
  warden: '/warden',
  finance: '/finance',
  student_affairs: '/student-affairs',
  academic_affairs: '/academic-affairs',
  admin: '/admin',
};
