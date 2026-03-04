import { Box, Typography, Card, CardContent, CardActionArea, Stack, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function BasicAuthenticationPage() {
  const navigate = useNavigate();

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
          onClick={() => navigate('/auth')}
          sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" textAlign="center">
          Basic Authentication
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Choose an option
      </Typography>

      <Stack spacing={2}>
        <Card sx={{ border: '1px solid #d2d2d7' }}>
          <CardActionArea onClick={() => navigate('/auth/basic/sign-up')}>
            <CardContent>
              <Typography variant="h6">Sign Up</Typography>
              <Typography variant="body2" color="text.secondary">
                Create a new account
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card sx={{ border: '1px solid #d2d2d7' }}>
          <CardActionArea onClick={() => navigate('/auth/basic/sign-in')}>
            <CardContent>
              <Typography variant="h6">Sign In</Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your existing account
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
      </Box>
    </Box>
  );
}
