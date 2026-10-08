import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getItem('user', null));
  const [role, setRole] = useState(() => getItem('role', null));

  useEffect(() => {
    if (user) {
      setItem('user', user);
      setItem('role', user.role || role);
    } else {
      localStorage.removeItem('zoro_english_academy_user');
      localStorage.removeItem('zoro_english_academy_role');
    }
  }, [user, role]);

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
    localStorage.removeItem('zoro_english_academy_user');
    localStorage.removeItem('zoro_english_academy_role');
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
