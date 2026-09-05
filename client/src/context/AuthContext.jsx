import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  authSignIn,
  authSignUp,
  authSignOut,
  getActiveSession,
} from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [intendedRoleRequired, setIntendedRoleRequired] = useState(null);

  // Parse user attributes from Supabase user structure
  const parseUser = (rawUser) => {
    if (!rawUser) return null;
    const meta = rawUser.user_metadata || {};
    return {
      id: rawUser.id,
      email: rawUser.email,
      fullName: meta.full_name || rawUser.email.split('@')[0],
      role: meta.role || 'visitor',
    };
  };

  useEffect(() => {
    // 1. Initial session load
    getActiveSession().then((activeSession) => {
      if (activeSession) {
        setSession(activeSession);
        setUser(parseUser(activeSession.user));
      }
      setIsLoading(false);
    });

    // 2. Listen to Supabase Auth state changes if online
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, updatedSession) => {
          setSession(updatedSession);
          setUser(parseUser(updatedSession?.user));
          setIsLoading(false);
        }
      );
      return () => subscription?.unsubscribe();
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authSignIn({ email, password });
      if (data?.session) {
        setSession(data.session);
        setUser(parseUser(data.user));
        setIsAuthModalOpen(false);
        setIntendedRoleRequired(null);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ email, password, fullName, role }) => {
    setIsLoading(true);
    try {
      const data = await authSignUp({ email, password, fullName, role });
      if (data?.session) {
        setSession(data.session);
        setUser(parseUser(data.user));
        setIsAuthModalOpen(false);
        setIntendedRoleRequired(null);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
  };

  const promptLogin = (role = null) => {
    setIntendedRoleRequired(role);
    setIsAuthModalOpen(true);
  };

  const token = session?.access_token || null;
  const role = user?.role || null;
  const isOrganizer = role === 'organizer' || role === 'admin';
  const isVisitor = role === 'visitor';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        session,
        token,
        isLoading,
        isOrganizer,
        isVisitor,
        isAuthModalOpen,
        intendedRoleRequired,
        setIsAuthModalOpen,
        promptLogin,
        login,
        register,
        logout,
      }}
    >
      {children}
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
