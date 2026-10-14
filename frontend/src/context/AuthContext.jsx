import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, clearAuthSession, getAuthToken, getRefreshToken, getItem, setItem, apiGet, apiPost } from '../api/client';
import { usePolling } from '../hooks/usePolling';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = getItem('user');
      if (u) return u;
      const str = typeof window !== 'undefined' ? (sessionStorage.getItem('zoro_user') || sessionStorage.getItem('user')) : null;
      return str ? JSON.parse(str) : null;
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    try {
      const r = getItem('role');
      if (r) return r;
      return typeof window !== 'undefined' ? (sessionStorage.getItem('zoro_role') || sessionStorage.getItem('role')) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  // Restore session via /api/auth/me on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        clearAuthSession();
        if (isMounted) {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
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
              avatar: u.avatar || null
            };
            setUser(formattedUser);
            setRole(roleUpper);
            setItem('user', formattedUser);
            setItem('role', roleUpper);
            try {
              sessionStorage.setItem('zoro_user', JSON.stringify(formattedUser));
              sessionStorage.setItem('zoro_role', roleUpper);
            } catch (e) {}
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

  // Periodic session validation (every 60s and on tab focus)
  const pollSession = useCallback(async () => {
    if (!user) return;
    const res = await apiGet('/auth/me');
    return res;
  }, [user]);

  usePolling(pollSession, 60000, !!user);

  useEffect(() => {
    const handleUnauthorized = (e) => {
      const detail = e.detail;
      const code = detail?.code || 'UNAUTHORIZED';
      const message = detail?.message || 'Session expired or unauthorized. Please log in.';

      setUser(null);
      setRole(null);
      clearAuthSession();
      setAuthNotice({ code, message });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (userData) => {
    setAuthNotice(null);
    const formattedRole = (userData.role || 'STUDENT').toUpperCase();
    const newUser = {
      ...userData,
      role: formattedRole
    };
    setUser(newUser);
    setRole(formattedRole);
    setItem('user', newUser);
    setItem('role', formattedRole);
    try {
      sessionStorage.setItem('zoro_user', JSON.stringify(newUser));
      sessionStorage.setItem('zoro_role', formattedRole);
    } catch (e) {}
    return newUser;
  };

  const clearAuthNotice = () => setAuthNotice(null);

  const updateUserInContext = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedFields };
      setItem('user', nextUser);
      try {
        sessionStorage.setItem('zoro_user', JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser;
    });
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiPost('/auth/logout', { refreshToken });
      }
    } catch (e) {}
    setUser(null);
    setRole(null);
    clearAuthSession();
    setAuthNotice(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading,
      isAuthenticated: !!user, 
      authNotice,
      clearAuthNotice,
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
