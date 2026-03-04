import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import {useAuthenticationContext} from "../contexts";

export default function Header() {
  const { user, logout } = useAuthenticationContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleAdminClick = () => {
    handleMenuClose();
    navigate('/admin');
  };

  const handleSignOutClick = () => {
    handleMenuClose();
    setShowSignOutDialog(true);
  };

  const handleSignOutConfirm = async () => {
    setShowSignOutDialog(false);
    await logout();
  };

  const handleSignOutCancel = () => {
    setShowSignOutDialog(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <AppBar position="fixed">
      <Toolbar sx={{ minHeight: '64px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography
            variant="h6"
            component="div"
            onClick={handleLogoClick}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: 600,
              fontSize: '1.125rem',
            }}
          >
            Recipe Catalogue
          </Typography>

          {user && user.type === 'ADMIN' && (
            <Typography
              variant="body1"
              component="div"
              onClick={handleAdminClick}
              sx={{
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: '#86868b',
                '&:hover': {
                  color: '#1d1d1f',
                },
              }}
            >
              Admin Dashboard
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box>
            <IconButton
              onClick={handleSettingsClick}
              aria-label="settings"
              disableRipple
              sx={{
                color: '#1d1d1f',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                  },
                },
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  Signed in as {user.username}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
              <MenuItem onClick={handleSignOutClick}>Sign out</MenuItem>
            </Menu>
          </Box>
        )}

        {!user && (
          <Button
            onClick={() => navigate('/auth')}
            disableRipple
            sx={{
              color: '#1d1d1f',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            Authenticate
          </Button>
        )}
      </Toolbar>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onClose={handleSignOutCancel}>
        <DialogTitle>Confirm Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignOutCancel}>Cancel</Button>
          <Button onClick={handleSignOutConfirm} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
