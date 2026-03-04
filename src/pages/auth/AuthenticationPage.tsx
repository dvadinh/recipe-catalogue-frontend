import { Box, Typography, Card, CardContent, CardActionArea, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function AuthenticationPage() {
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
      <Typography variant="h4" gutterBottom textAlign="center">
        Authentication
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Choose your authentication method
      </Typography>

      <Stack spacing={2}>
        <Card sx={{ border: '1px solid #d2d2d7' }}>
          <CardActionArea onClick={() => navigate('/auth/basic')}>
            <CardContent>
              <Typography variant="h6">Basic Authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                Authenticate with username and password
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card sx={{ border: '1px solid #d2d2d7' }}>
          <CardActionArea onClick={() => navigate('/auth/oauth2')}>
            <CardContent>
              <Typography variant="h6">OAuth2 Authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                Authenticate with Google or GitHub
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
      </Box>
    </Box>
  );
}
