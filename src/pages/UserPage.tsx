import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Google as GoogleIcon, GitHub as GitHubIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getUserById, getLinkedOAuth2Accounts, unlinkUserOAuth2Account, patchCredentials, patchUser } from '../hooks';
import type { UserDetailsResponse, LinkedOAuth2AccountResponse, PatchUsernamePasswordRequest, PatchUserRequest } from '../types';
import { PatchRequestOperation, Authority } from '../types';

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetailsResponse | null>(null);
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
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [editedType, setEditedType] = useState<typeof Authority[keyof typeof Authority]>(Authority.USER);
  const [editedEnabled, setEditedEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await getUserById(parseInt(userId));

    if (result.ok) {
      setUser(result.data);
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to load user');
      }
    }

    setLoading(false);
  }, [userId]);

  const fetchOAuth2Accounts = useCallback(async () => {
    if (!userId) return;

    const result = await getLinkedOAuth2Accounts(parseInt(userId));

    if (result.ok) {
      setOauth2Accounts(result.data);
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to load OAuth2 accounts');
      }
    }
  }, [userId]);

  useEffect(() => {
    // Valid data fetching pattern on component mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOAuth2Accounts();
  }, [fetchUser, fetchOAuth2Accounts]);

  const handleUnlinkClick = useCallback((provider: string) => {
    setAccountToUnlink(provider);
    setShowUnlinkDialog(true);
  }, []);

  const handleUnlinkConfirm = useCallback(async () => {
    if (!accountToUnlink || !userId) return;

    setUnlinkingProvider(accountToUnlink);
    setShowUnlinkDialog(false);

    const result = await unlinkUserOAuth2Account(parseInt(userId), accountToUnlink);

    if (result.ok) {
      setCallbackMessage({ type: 'success', message: 'OAuth2 account unlinked successfully!' });
      await fetchOAuth2Accounts();
    } else {
      setCallbackMessage({ type: 'error', message: result.error.details as string });
    }

    setUnlinkingProvider(null);
    setAccountToUnlink(null);
  }, [accountToUnlink, userId, fetchOAuth2Accounts]);

  const handleUnlinkCancel = useCallback(() => {
    setShowUnlinkDialog(false);
    setAccountToUnlink(null);
  }, []);

  const isLinked = useCallback((provider: string) => {
    return oauth2Accounts.some(account => account.provider === provider);
  }, [oauth2Accounts]);

  const getAccount = useCallback((provider: string) => {
    return oauth2Accounts.find(account => account.provider === provider);
  }, [oauth2Accounts]);

  const handleEdit = useCallback(() => {
    if (!user) return;
    setEditMode(true);
    setEditedUsername(user.username);
    setEditedDisplayName(user.displayName);
    setEditedDescription(user.description || '');
    setEditedPassword('');
    setEditedType(user.type);
    setEditedEnabled(user.enabled);
    setFieldErrors(new Map());
  }, [user]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setEditedPassword('');
    setFieldErrors(new Map());
    setCallbackMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !userId) return;

    setSaving(true);
    setFieldErrors(new Map());
    setCallbackMessage(null);

    let hasError = false;

    // Update credentials if username or password changed
    if (editedUsername !== user.username || editedPassword.trim()) {
      const credentialsRequest: PatchUsernamePasswordRequest = {
        id: parseInt(userId),
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

    // Update user details if anything changed
    if (!hasError && (
      editedDisplayName !== user.displayName ||
      editedDescription !== (user.description || '') ||
      editedType !== user.type ||
      editedEnabled !== user.enabled
    )) {
      const userRequest: PatchUserRequest = {
        displayName: editedDisplayName !== user.displayName ? editedDisplayName : null,
        displayNameOperation: editedDisplayName !== user.displayName ? PatchRequestOperation.UPDATE : null,
        description: editedDescription !== (user.description || '') ? editedDescription : null,
        descriptionOperation: editedDescription !== (user.description || '') ? PatchRequestOperation.UPDATE : null,
        type: editedType !== user.type ? editedType : null,
        typeOperation: editedType !== user.type ? PatchRequestOperation.UPDATE : null,
        enabled: editedEnabled !== user.enabled ? editedEnabled : null,
        enabledOperation: editedEnabled !== user.enabled ? PatchRequestOperation.UPDATE : null,
      };

      const result = await patchUser(parseInt(userId), userRequest);

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
      await fetchUser();
      setEditMode(false);
      setEditedPassword('');
      setCallbackMessage({ type: 'success', message: 'User updated successfully!' });
    }

    setSaving(false);
  }, [user, userId, editedUsername, editedDisplayName, editedDescription, editedPassword, editedType, editedEnabled, fetchUser]);

  const handleBack = useCallback(() => {
    navigate('/admin-dashboard');
  }, [navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Alert severity="error">{error || 'User not found'}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={handleBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            User Details
          </Typography>
        </Box>

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
                label="Description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                error={fieldErrors.has('description')}
                helperText={fieldErrors.get('description')}
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
              <FormControl fullWidth error={fieldErrors.has('type')} disabled={saving}>
                <Typography variant="body2" sx={{ mb: 1, color: fieldErrors.has('type') ? 'error.main' : 'text.secondary' }}>
                  Type
                </Typography>
                <Select
                  value={editedType}
                  onChange={(e) => setEditedType(e.target.value as typeof Authority[keyof typeof Authority])}
                >
                  <MenuItem value={Authority.ADMIN}>Admin</MenuItem>
                  <MenuItem value={Authority.USER}>User</MenuItem>
                </Select>
                {fieldErrors.has('type') && (
                  <Typography variant="caption" color="error">{fieldErrors.get('type')}</Typography>
                )}
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={editedEnabled}
                    onChange={(e) => setEditedEnabled(e.target.checked)}
                    disabled={saving}
                  />
                }
                label="Enabled"
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
                <Typography variant="body2" color="text.secondary">ID</Typography>
                <Typography variant="body1">{user.id}</Typography>
              </Box>

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

          <Stack spacing={2}>
            {/* Google Account */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #d2d2d7', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GoogleIcon sx={{ color: '#4285F4' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>Google</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isLinked('google') ? (getAccount('google')?.displayName || 'Linked') : 'Not Linked'}
                  </Typography>
                </Box>
              </Box>
              {isLinked('google') && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleUnlinkClick('google')}
                  disabled={unlinkingProvider === 'google'}
                >
                  {unlinkingProvider === 'google' ? <CircularProgress size={20} /> : 'Unlink'}
                </Button>
              )}
            </Box>

            {/* GitHub Account */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #d2d2d7', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GitHubIcon />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>GitHub</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isLinked('github') ? (getAccount('github')?.displayName || 'Linked') : 'Not Linked'}
                  </Typography>
                </Box>
              </Box>
              {isLinked('github') && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleUnlinkClick('github')}
                  disabled={unlinkingProvider === 'github'}
                >
                  {unlinkingProvider === 'github' ? <CircularProgress size={20} /> : 'Unlink'}
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onClose={handleUnlinkCancel}>
        <DialogTitle>Confirm Unlink</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unlink this {accountToUnlink} account from this user?
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
