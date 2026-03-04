import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Stack,
  TextField,
  IconButton,
} from '@mui/material';
import { Google as GoogleIcon, GitHub as GitHubIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuthenticationContext } from '../contexts';
import { getLinkedOAuth2Accounts, unlinkOAuth2Account, patchCredentials, patchUser } from '../hooks';
import type { LinkedOAuth2AccountResponse, PatchUsernamePasswordRequest, PatchUserRequest } from '../types';
import { OAuth2QueryParameter, PatchRequestOperation } from '../types';

export default function ProfilePage() {
  const { user, refreshUser } = useAuthenticationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [oauth2Accounts, setOauth2Accounts] = useState<LinkedOAuth2AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<string | null>(null);
  const [callbackMessage, setCallbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Check for callback message from OAuth2CallbackPage
    const message = searchParams.get(OAuth2QueryParameter.MESSAGE);
    const messageType = searchParams.get(OAuth2QueryParameter.MESSAGE_TYPE);

    if (message && messageType) {
      // Valid use case: reading URL params and updating state, then clearing params
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCallbackMessage({
        type: messageType as 'success' | 'error',
        message: decodeURIComponent(message)
      });
      // Clear query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchOAuth2Accounts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const result = await getLinkedOAuth2Accounts(user.id);

    if (result.ok) {
      setOauth2Accounts(result.data);
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to load OAuth2 accounts');
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Valid data fetching pattern on component mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOAuth2Accounts();
  }, [fetchOAuth2Accounts]);

  const handleLinkOAuth2 = useCallback((provider: 'google' | 'github') => {
    const backendUrl = import.meta.env.VITE_BACKEND_REST_API_BASE_URL ?? 'http://localhost:8081';
    const callbackUrl = `${window.location.origin}/auth/oauth2/callback?${OAuth2QueryParameter.RETURN_TO}=${OAuth2QueryParameter.RETURN_TO_PROFILE_VALUE}`;
    const targetUrl = encodeURIComponent(callbackUrl);
    window.location.href = `${backendUrl}/auth/oauth2/link/${provider}?${OAuth2QueryParameter.TARGET_URL}=${targetUrl}`;
  }, []);

  const handleUnlinkClick = useCallback((provider: string) => {
    setAccountToUnlink(provider);
    setShowUnlinkDialog(true);
  }, []);

  const handleUnlinkConfirm = useCallback(async () => {
    if (!accountToUnlink) return;

    setUnlinkingProvider(accountToUnlink);
    setShowUnlinkDialog(false);

    const result = await unlinkOAuth2Account(accountToUnlink);

    if (result.ok) {
      setCallbackMessage({ type: 'success', message: 'OAuth2 account unlinked successfully!' });
      await fetchOAuth2Accounts();
    } else {
      setCallbackMessage({ type: 'error', message: result.error.details as string });
    }

    setUnlinkingProvider(null);
    setAccountToUnlink(null);
  }, [accountToUnlink, fetchOAuth2Accounts]);

  const handleUnlinkCancel = useCallback(() => {
    setShowUnlinkDialog(false);
    setAccountToUnlink(null);
  }, []);

  const isLinked = useCallback((provider: string) => {
    return oauth2Accounts.some(account => account.provider === provider);
  }, [oauth2Accounts]);

  const handleEdit = useCallback(() => {
    if (!user) return;
    setEditMode(true);
    setEditedUsername(user.username);
    setEditedDisplayName(user.displayName);
    setEditedPassword('');
    setFieldErrors(new Map());
  }, [user]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setEditedPassword('');
    setFieldErrors(new Map());
    setCallbackMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    setFieldErrors(new Map());
    setCallbackMessage(null);

    let hasError = false;

    // Update credentials if username or password changed
    if (editedUsername !== user.username || editedPassword.trim()) {
      const credentialsRequest: PatchUsernamePasswordRequest = {
        id: user.id,
        username: editedUsername !== user.username ? editedUsername : null,
        usernameOperation: editedUsername !== user.username ? PatchRequestOperation.UPDATE : null,
        password: editedPassword.trim() ? editedPassword : null,
        passwordOperation: editedPassword.trim() ? PatchRequestOperation.UPDATE : null,
      };

      const result = await patchCredentials(credentialsRequest);

      if (!result.ok) {
        hasError = true;
        if (typeof result.error.details === 'string') {
          setCallbackMessage({ type: 'error', message: result.error.details });
        } else if (result.error.details instanceof Map) {
          setFieldErrors(result.error.details);
        }
      }
    }

    // Update displayName if changed
    if (!hasError && editedDisplayName !== user.displayName) {
      const userRequest: PatchUserRequest = {
        displayName: editedDisplayName,
        displayNameOperation: PatchRequestOperation.UPDATE,
        firstName: null,
        firstNameOperation: null,
        lastName: null,
        lastNameOperation: null,
        emailAddress: null,
        emailAddressOperation: null,
        description: null,
        descriptionOperation: null,
        type: null,
        typeOperation: null,
        enabled: null,
        enabledOperation: null,
      };

      const result = await patchUser(user.id, userRequest);

      if (!result.ok) {
        hasError = true;
        if (typeof result.error.details === 'string') {
          setCallbackMessage({ type: 'error', message: result.error.details });
        } else if (result.error.details instanceof Map) {
          setFieldErrors(result.error.details);
        }
      }
    }

    if (!hasError) {
      await refreshUser();
      setEditMode(false);
      setEditedPassword('');
      setCallbackMessage({ type: 'success', message: 'Profile updated successfully!' });
    }

    setSaving(false);
  }, [user, editedUsername, editedDisplayName, editedPassword, refreshUser]);

  if (!user) return null;

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: '#1d1d1f' }}>
          Profile
        </Typography>

        {callbackMessage && (
          <Alert severity={callbackMessage.type} sx={{ mb: 3, whiteSpace: 'pre-wrap' }} onClose={() => setCallbackMessage(null)}>
            {callbackMessage.message}
          </Alert>
        )}

        <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #d2d2d7' }}>
          {/* User Information Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              User Information
            </Typography>
            {!editMode && (
              <IconButton onClick={handleEdit} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {editMode ? (
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Username"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                fullWidth
                error={fieldErrors.has('username')}
                helperText={fieldErrors.get('username')}
                disabled={saving}
              />
              <TextField
                label="Display Name"
                value={editedDisplayName}
                onChange={(e) => setEditedDisplayName(e.target.value)}
                fullWidth
                error={fieldErrors.has('displayName')}
                helperText={fieldErrors.get('displayName')}
                disabled={saving}
              />
              <TextField
                label="New Password (leave blank to keep current)"
                type="password"
                value={editedPassword}
                onChange={(e) => setEditedPassword(e.target.value)}
                fullWidth
                error={fieldErrors.has('password')}
                helperText={fieldErrors.get('password')}
                disabled={saving}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  variant="contained"
                >
                  {saving ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </Box>
            </Stack>
          ) : (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Username</Typography>
                <Typography variant="body1">{user.username}</Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Display Name</Typography>
                <Typography variant="body1">{user.displayName}</Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{user.description || 'No description'}</Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Account Type</Typography>
                <Chip label={user.type} size="small" sx={{ mt: 0.5 }} />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={user.enabled ? 'Enabled' : 'Disabled'}
                  size="small"
                  color={user.enabled ? 'success' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Linked OAuth2 Accounts Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Linked Accounts
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <Stack spacing={2}>
                {/* Google Account */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #d2d2d7', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GoogleIcon sx={{ color: '#4285F4' }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>Google</Typography>
                      {isLinked('google') && (
                        <Typography variant="body2" color="text.secondary">
                          Linked
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {isLinked('google') ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleUnlinkClick('google')}
                      disabled={unlinkingProvider === 'google'}
                    >
                      {unlinkingProvider === 'google' ? <CircularProgress size={20} /> : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleLinkOAuth2('google')}
                    >
                      Link
                    </Button>
                  )}
                </Box>

                {/* GitHub Account */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #d2d2d7', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GitHubIcon />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>GitHub</Typography>
                      {isLinked('github') && (
                        <Typography variant="body2" color="text.secondary">
                          Linked
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {isLinked('github') ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleUnlinkClick('github')}
                      disabled={unlinkingProvider === 'github'}
                    >
                      {unlinkingProvider === 'github' ? <CircularProgress size={20} /> : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleLinkOAuth2('github')}
                    >
                      Link
                    </Button>
                  )}
                </Box>
              </Stack>
            </>
          )}
        </Paper>
      </Container>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onClose={handleUnlinkCancel}>
        <DialogTitle>Confirm Unlink</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unlink this {accountToUnlink} account?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnlinkCancel}>Cancel</Button>
          <Button onClick={handleUnlinkConfirm} color="error" variant="contained">
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
