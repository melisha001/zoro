import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, setAuthToken, clearAuthSession, getAuthToken, apiGet } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getItem('user', null));
  const [role, setRole] = useState(() => getItem('role', null));
  const [loading, setLoading] = useState(true);

  // Restore session via /api/auth/me on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await apiGet('/auth/me');
        if (isMounted) {
          if (res.success && res.data) {
            const u = res.data;
            const roleUpper = (u.role || 'STUDENT').toUpperCase();
            const formattedUser = {
              ...u,
              role: roleUpper,
              avatar: u.avatar || (roleUpper === 'ADMIN'
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                : roleUpper === 'TRAINER'
                ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
                : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200')
            };
            setUser(formattedUser);
            setRole(roleUpper);
            setItem('user', formattedUser);
            setItem('role', roleUpper);
          } else {
            setUser(null);
            setRole(null);
            clearAuthSession();
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          clearAuthSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setItem('user', user);
      setItem('role', user.role || role);
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
      loading,
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
