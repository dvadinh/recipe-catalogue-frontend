import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { useAuthenticationContext } from '../../contexts';
import { OAuth2QueryParameter } from '../../types';

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuthenticationContext();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const status = searchParams.get(OAuth2QueryParameter.STATUS);
      const errorMessage = searchParams.get(OAuth2QueryParameter.ERROR);
      const returnTo = searchParams.get(OAuth2QueryParameter.RETURN_TO);

      if (status === OAuth2QueryParameter.STATUS_SUCCESS_VALUE) {
        // OAuth2 operation successful
        await refreshUser();

        // Check if this is a link operation (redirecting back to profile)
        if (returnTo === OAuth2QueryParameter.RETURN_TO_PROFILE_VALUE) {
          const message = encodeURIComponent('OAuth2 account linked successfully!');
          navigate(`/profile?${OAuth2QueryParameter.MESSAGE_TYPE}=${OAuth2QueryParameter.MESSAGE_TYPE_SUCCESS_VALUE}&${OAuth2QueryParameter.MESSAGE}=${message}`);
        } else {
          // Regular sign-in/sign-up - go to home
          navigate('/');
        }
      } else if (status === OAuth2QueryParameter.STATUS_FAILURE_VALUE) {
        // OAuth2 operation failed
        const message = encodeURIComponent(errorMessage || 'OAuth2 authentication failed. Please try again.');

        if (returnTo === OAuth2QueryParameter.RETURN_TO_PROFILE_VALUE) {
          navigate(`/profile?${OAuth2QueryParameter.MESSAGE_TYPE}=${OAuth2QueryParameter.MESSAGE_TYPE_ERROR_VALUE}&${OAuth2QueryParameter.MESSAGE}=${message}`);
        } else if (returnTo === OAuth2QueryParameter.RETURN_TO_SIGN_UP_VALUE) {
          navigate(`/auth/oauth2/sign-up?${OAuth2QueryParameter.MESSAGE_TYPE}=${OAuth2QueryParameter.MESSAGE_TYPE_ERROR_VALUE}&${OAuth2QueryParameter.MESSAGE}=${message}`);
        } else if (returnTo === OAuth2QueryParameter.RETURN_TO_SIGN_IN_VALUE) {
          navigate(`/auth/oauth2/sign-in?${OAuth2QueryParameter.MESSAGE_TYPE}=${OAuth2QueryParameter.MESSAGE_TYPE_ERROR_VALUE}&${OAuth2QueryParameter.MESSAGE}=${message}`);
        } else {
          // Default to sign-in page
          navigate(`/auth/oauth2/sign-in?${OAuth2QueryParameter.MESSAGE_TYPE}=${OAuth2QueryParameter.MESSAGE_TYPE_ERROR_VALUE}&${OAuth2QueryParameter.MESSAGE}=${message}`);
        }
      } else {
        // Invalid callback - no status parameter
        setError('Invalid OAuth2 callback. Redirecting to authentication page.');
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Container maxWidth="sm" sx={{ backgroundColor: '#ffffff', padding: 4, borderRadius: '12px' }}>
        <Box textAlign="center">
          {error ? (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Redirecting...
              </Typography>
            </>
          ) : (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6">Processing OAuth2 authentication...</Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we complete your sign in.
              </Typography>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
