'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStorage, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = authStorage.getUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (user && isPublicRoute) {
        router.push('/dashboard');
      } else if (!user && !isPublicRoute) {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    authStorage.setUser(userData);
  };

  const logout = () => {
    setUser(null);
    authStorage.clear();
    router.push('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      authStorage.setUser(updatedUser);
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};