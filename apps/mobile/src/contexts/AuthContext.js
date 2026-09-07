import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpired } from 'pocketbase';
import pb, { AUTH_STORAGE_KEY } from '../lib/pocketbase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // pb.authStore (AsyncAuthStore) hydrates from AsyncStorage on its own
    // internal queue, whose timing relative to this effect isn't
    // guaranteed. Reading the same key directly here — rather than trusting
    // authStore.isValid at an arbitrary point — is what lets the splash
    // screen stay up until the *real* logged-in state is known, instead of
    // flashing the login screen for a returning user.
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          if (parsed?.token && !isTokenExpired(parsed.token)) {
            setCurrentUser(parsed.record || null);
          }
        }
      } catch (err) {
        // Corrupt or missing storage just means "not logged in".
      } finally {
        if (active) setInitialLoading(false);
      }
    })();

    const unsubscribe = pb.authStore.onChange(() => {
      if (active) setCurrentUser(pb.authStore.isValid ? pb.authStore.record : null);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setCurrentUser(authData.record);
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    initialLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
