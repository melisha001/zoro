import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, setAuthToken, clearAuthSession } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getItem('user', null));
  const [role, setRole] = useState(() => getItem('role', null));

  useEffect(() => {
    if (user) {
      setItem('user', user);
      setItem('role', user.role || role);
    } else {
      clearAuthSession();
    }
  }, [user, role]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setRole(null);
      clearAuthSession();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (userData) => {
    const formattedRole = (userData.role || 'STUDENT').toUpperCase();
    const newUser = {
      ...userData,
      role: formattedRole
    };
    setUser(newUser);
    setRole(formattedRole);
    setItem('user', newUser);
    setItem('role', formattedRole);
    return newUser;
  };

  const updateUserInContext = (updatedFields) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      setItem('user', updated);
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setAuthToken(null);
    clearAuthSession();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isAuthenticated: !!user, 
      login, 
      updateUserInContext,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
