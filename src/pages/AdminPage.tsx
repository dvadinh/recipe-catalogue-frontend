import { Container, Typography, Box } from '@mui/material';
import { useAuthenticationContext } from '../contexts';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, loading } = useAuthenticationContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.type !== 'ADMIN')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.type !== 'ADMIN') {
    return null;
  }

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: '#1d1d1f' }}>
          Admin Dashboard
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Admin features coming soon...
        </Typography>
      </Container>
    </Box>
  );
}
