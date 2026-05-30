import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearTokens, isAuthenticated, setTokens } from '@/utils/auth';

type AuthContextValue = {
  isAuthed: boolean | null; // null = still loading from AsyncStorage
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    isAuthenticated().then(setIsAuthed);
  }, []);

  const login = async (access: string, refresh: string) => {
    await setTokens(access, refresh);
    setIsAuthed(true);
  };

  const logout = async () => {
    await clearTokens();
    setIsAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
