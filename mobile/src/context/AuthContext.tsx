import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearTokens, isAuthenticated, parseJwt, setTokens } from '@/utils/auth';

type AuthContextValue = {
  isAuthed: boolean | null; // null = still loading
  role: string | null;      // 'lawyer' | 'client' | 'admin' | null
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      isAuthenticated(),
      AsyncStorage.getItem('user_role'),
    ]).then(([authed, savedRole]) => {
      setIsAuthed(authed);
      setRole(savedRole);
    });
  }, []);

  const login = async (access: string, refresh: string) => {
    await setTokens(access, refresh);
    // Extract role from JWT payload (backend embeds it via CustomTokenObtainPairSerializer)
    const payload = parseJwt(access);
    const userRole = (payload?.role as string) ?? 'lawyer';
    await AsyncStorage.setItem('user_role', userRole);
    setRole(userRole);
    setIsAuthed(true);
  };

  const logout = async () => {
    await clearTokens();
    setRole(null);
    setIsAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthed, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
