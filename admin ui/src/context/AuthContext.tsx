import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export type AdminRole = 'user' | 'support' | 'reviewer' | 'subadmin' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

interface AuthContextType {
  user: AdminUser | null;
  permissions: string[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ require2fa?: boolean; require2faSetup?: boolean; pending2faToken?: string }>;
  verify2fa: (pending2faToken: string, code: string) => Promise<void>;
  setup2fa: (pending2faToken: string) => Promise<{ secret: string; qrCodeUrl: string }>;
  confirmSetup2fa: (pending2faToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await api.get<{ user: AdminUser; permissions: string[] }>('/api/admin/auth/me');
      setUser(data.user);
      setPermissions(data.permissions);
    } catch {
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    return await api.post<{ require2fa?: boolean; require2faSetup?: boolean; pending2faToken?: string }>(
      '/api/admin/auth/login',
      { email, password }
    );
  }

  async function verify2fa(pending2faToken: string, code: string) {
    const data = await api.post<{ user: AdminUser; permissions: string[] }>('/api/admin/auth/2fa/verify', {
      pending2faToken,
      code,
    });
    setUser(data.user);
    setPermissions(data.permissions);
  }

  async function setup2fa(pending2faToken: string) {
    return await api.post<{ secret: string; qrCodeUrl: string }>('/api/admin/auth/2fa/setup', {
      pending2faToken,
    });
  }

  async function confirmSetup2fa(pending2faToken: string, code: string) {
    const data = await api.post<{ user: AdminUser; permissions: string[] }>(
      '/api/admin/auth/2fa/confirm-setup',
      { pending2faToken, code }
    );
    setUser(data.user);
    setPermissions(data.permissions);
  }

  async function logout() {
    try {
      await api.post('/api/admin/auth/logout');
    } finally {
      setUser(null);
      setPermissions([]);
    }
  }

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        login,
        verify2fa,
        setup2fa,
        confirmSetup2fa,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
