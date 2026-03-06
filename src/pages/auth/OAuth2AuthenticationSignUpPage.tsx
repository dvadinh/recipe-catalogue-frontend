import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import { Google as GoogleIcon, GitHub as GitHubIcon, ArrowBack } from '@mui/icons-material';
import { OAuth2QueryParameter } from '../../types';
import {BACKEND_REST_API_BASE_URL} from "../../utils";

export default function OAuth2AuthenticationSignUpPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error message from OAuth2 callback
    const message = searchParams.get(OAuth2QueryParameter.MESSAGE);
    const messageType = searchParams.get(OAuth2QueryParameter.MESSAGE_TYPE);

    if (message && messageType === OAuth2QueryParameter.MESSAGE_TYPE_ERROR_VALUE) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(decodeURIComponent(message));
      // Clear query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleOAuth2SignUp = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    try {
      const callbackUrl = `${window.location.origin}/auth/oauth2/callback?${OAuth2QueryParameter.RETURN_TO}=${OAuth2QueryParameter.RETURN_TO_SIGN_UP_VALUE}`;
      const targetUrl = encodeURIComponent(callbackUrl);

      // Redirect to backend OAuth2 endpoint
      // Backend will redirect to OAuth provider
      window.location.href = `${BACKEND_REST_API_BASE_URL}/auth/oauth2/sign-up/${provider}?${OAuth2QueryParameter.TARGET_URL}=${targetUrl}`;
    } catch {
      setError('Failed to initiate OAuth2 sign up. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Box
        sx={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 4,
          border: '1px solid #d2d2d7',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          <IconButton
            onClick={() => navigate('/auth/oauth2')}
            sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
            disabled={loading}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" textAlign="center">
            Sign Up with OAuth2
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Choose a provider to create your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
              onClick={() => handleOAuth2SignUp('google')}
              disabled={loading}
            >
              Sign up with Google
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <GitHubIcon />}
              onClick={() => handleOAuth2SignUp('github')}
              disabled={loading}
            >
              Sign up with GitHub
            </Button>
          </Stack>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => navigate('/auth/oauth2/sign-in')} disabled={loading}>
              Already have an account? Sign In
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
