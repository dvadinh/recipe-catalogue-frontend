import {createContext, useEffect, useState, useMemo, useCallback, type ReactNode, useContext} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {Snackbar, Alert, Button} from '@mui/material';
import {registerUnauthorizedHandler, clearUnauthorizedHandler} from '../utils';
import {whoAmI, signOut as signOutApi, refreshToken as refreshTokenApi} from '../hooks/api/useAuth';
import type {AuthenticationState} from './AuthenticationContext.types';
import type {UserDetailsResponse} from '../types';
import {ApiErrorId} from '../types';

// Export context for hook consumption (not for direct use in components)
const AuthenticationContext = createContext<AuthenticationState | undefined>(undefined);

export default function AuthenticationProvider({children}: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth status on mount - non-blocking
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const result = await whoAmI();
      if (result.ok) {
        setUser(result.data);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Set up 401 handler on mount
  useEffect(() => {
    const handle401 = async (errorId: string) => {
      // Check if we're already on auth pages - if so, don't show alert
      const isOnAuthPage = location.pathname.startsWith('/auth');

      // Check if this is a JWT-specific error
      const jwtErrorIds: string[] = [
        ApiErrorId.JWT_ACCESS_TOKEN_NOT_FOUND_001,
        ApiErrorId.INVALID_JWT_ACCESS_TOKEN_002,
        ApiErrorId.INVALID_JWT_ACCESS_TOKEN_003,
      ];

      if (jwtErrorIds.includes(errorId)) {
        // JWT-specific error: sign out and redirect
        if (user && !isOnAuthPage) {
          // User is authenticated and not on auth page, show alert before signing out
          setAlertMessage('Session invalidated. Please sign in again.');
          setAlertOpen(true);
        } else {
          // User not authenticated or already on auth page, just redirect
          navigate('/');
        }

        // Sign out (clear cookies)
        try {
          await signOutApi();
        } catch {
          // Ignore errors on sign out
        }

        // Clear user state
        setUser(null);
      } else {
        // Generic 401 error: show session expired alert only if not on auth page
        if (!isOnAuthPage) {
          setAlertMessage('Your session has expired. Please sign in again.');
          setAlertOpen(true);
        }
      }
    };

    registerUnauthorizedHandler(handle401);

    return () => {
      clearUnauthorizedHandler();
    };
  }, [user, navigate, location]);

  // Proactive token refresh every 10 minutes
  useEffect(() => {
    if (!user) return;

    let intervalId: number | null = null;

    intervalId = setInterval(async () => {
      try {
        await refreshTokenApi();
      } catch {
        // Refresh failed - stop the interval and let the 401 handler manage the session
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  const login = useCallback((newUser: UserDetailsResponse) => {
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutApi();
    } catch {
      // Ignore errors on sign out
    } finally {
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const result = await whoAmI();
    if (result.ok) {
      setUser(result.data);
    } else {
      setUser(null);
    }
  }, []);

  const handleAlertClose = () => {
    setAlertOpen(false);
    setUser(null);
    navigate('/');
  };

  const value: AuthenticationState = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
  }), [user, loading, login, logout, refreshUser]);

  return (
      <AuthenticationContext.Provider value={value}>
        {children}

        <Snackbar
            open={alertOpen}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
              severity="info"
              action={
                <Button color="inherit" size="small" onClick={handleAlertClose}>
                  OK
                </Button>
              }
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </AuthenticationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthenticationContext(): AuthenticationState {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error('useAuthenticationContext must be used within an AuthenticationProvider');
  }
  return context;
}
