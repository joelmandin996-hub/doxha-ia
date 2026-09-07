import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '../lib/pocketbase';

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
    // AsyncAuthStore hydrates from AsyncStorage asynchronously, so wait a
    // tick before trusting authStore.isValid.
    const unsubscribe = pb.authStore.onChange(() => {
      setCurrentUser(pb.authStore.isValid ? pb.authStore.record : null);
    }, true);
    setInitialLoading(false);
    return unsubscribe;
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
