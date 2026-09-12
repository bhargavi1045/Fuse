import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { disconnectSocket } from '../socket/socketClient';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((result) => {
    setUserState(result.user);
  }, []);

  useEffect(() => {
    authApi.me()
      .then((result) => setUserState(result.user))
      .catch(() => setUserState(null))
      .finally(() => setIsLoading(false));
  }, []);

  const register = useCallback(
    async ({ username, email, password }) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const result = await authApi.register({ username, email, password });
        applySession(result);
        return result;
      } catch (err) {
        setAuthError(err.message || 'Registration failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const login = useCallback(
    async ({ username, password }) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const result = await authApi.login({ username, password });
        applySession(result);
        return result;
      } catch (err) {
        setAuthError(err.message || 'Login failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    disconnectSocket();
    setUserState(null);
    await authApi.logout();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      authError,
      register,
      login,
      logout,
    }),
    [user, isLoading, authError, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
