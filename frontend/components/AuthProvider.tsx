import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { loadUser, isLoading } = useAuth();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}