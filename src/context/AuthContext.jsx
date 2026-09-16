import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getItem('user', null));
  const [role, setRole] = useState(() => getItem('role', null));

  useEffect(() => {
    if (user) {
      setItem('user', user);
      setItem('role', role);
    } else {
      localStorage.removeItem('zoro_english_academy_user');
      localStorage.removeItem('zoro_english_academy_role');
    }
  }, [user, role]);

  const login = (email, password, userRole = 'STUDENT') => {
    const formattedRole = userRole.toUpperCase();
    const newUser = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'User',
      email,
      role: formattedRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };
    setUser(newUser);
    setRole(formattedRole);
    return newUser;
  };

  const registerStudent = (studentData) => {
    const newUser = {
      id: `std_${Date.now()}`,
      name: studentData.name,
      email: studentData.email,
      phone: studentData.phone,
      role: 'STUDENT',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
    };
    setUser(newUser);
    setRole('STUDENT');
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isAuthenticated: !!user, 
      login, 
      registerStudent, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
