import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { basicSignIn } from '../../hooks';
import { useAuthenticationContext } from '../../contexts';

export default function BasicAuthenticationSignInPage() {
  const navigate = useNavigate();
  const { login } = useAuthenticationContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());
  const [generalError, setGeneralError] = useState<string | null>(null);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL_ADDRESS ?? 'admin@example.com';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors(new Map());
    setGeneralError(null);
    setIsLoading(true);

    const result = await basicSignIn(username, password);

    if (result.ok) {
      login(result.data);
      navigate('/');
    } else {
      if (typeof result.error.details === 'string') {
        setGeneralError(result.error.details);
      } else if (result.error.details instanceof Map) {
        setFieldErrors(result.error.details);
      }
    }

    setIsLoading(false);
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
            onClick={() => navigate('/auth/basic')}
            sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" textAlign="center">
            Sign In
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Sign in to your existing account with username and password
        </Typography>

        <Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                error={fieldErrors.has('username')}
                helperText={fieldErrors.get('username')}
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                error={fieldErrors.has('password')}
                helperText={fieldErrors.get('password')}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Tooltip title={`Contact admin to reset your password at ${adminEmail}`} arrow>
              <Typography
                variant="body2"
                sx={{
                  color: '#86868b',
                  cursor: 'help',
                  display: 'inline-block',
                  '&:hover': {
                    color: '#1d1d1f',
                  },
                }}
              >
                Forgot your password?
              </Typography>
            </Tooltip>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => navigate('/auth/basic/sign-up')}>
              Don't have an account? Sign Up
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
