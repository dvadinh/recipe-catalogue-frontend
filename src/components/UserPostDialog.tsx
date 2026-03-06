import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { postUser } from '../hooks';
import type { PostUserRequest } from '../types';
import { Authority } from '../types';

interface UserPostDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserPostDialog({ open, onClose, onSuccess }: UserPostDialogProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<typeof Authority[keyof typeof Authority]>(Authority.USER);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setUsername('');
    setDisplayName('');
    setPassword('');
    setDescription('');
    setType(Authority.USER);
    setEnabled(true);
    setLoading(false);
    setErrors(new Map());
    setGeneralError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors(new Map());
    setGeneralError(null);

    const request: PostUserRequest = {
      username: username.trim(),
      password: password.trim(),
      displayName: displayName.trim(),
      description: description.trim() || null,
      type,
      enabled,
    };

    const result = await postUser(request);

    if (result.ok) {
      handleClose();
      onSuccess();
    } else {
      setLoading(false);

      // Handle errors
      if (typeof result.error.details === 'string') {
        setGeneralError(result.error.details);
      } else if (result.error.details instanceof Map) {
        setErrors(result.error.details);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New User</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.has('username')}
            helperText={errors.get('username')}
            fullWidth
            required
            disabled={loading}
            autoFocus
          />
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.has('displayName')}
            helperText={errors.get('displayName')}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.has('password')}
            helperText={errors.get('password')}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.has('description')}
            helperText={errors.get('description')}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
          />
          <FormControl fullWidth error={errors.has('type')} disabled={loading}>
            <Typography variant="body2" sx={{ mb: 1, color: errors.has('type') ? 'error.main' : 'text.secondary' }}>
              Type *
            </Typography>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as typeof Authority[keyof typeof Authority])}
            >
              <MenuItem value={Authority.USER}>User</MenuItem>
              <MenuItem value={Authority.ADMIN}>Admin</MenuItem>
            </Select>
            {errors.has('type') && (
              <Typography variant="caption" color="error">{errors.get('type')}</Typography>
            )}
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={loading}
              />
            }
            label="Enabled"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !username.trim() || !displayName.trim() || !password.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
