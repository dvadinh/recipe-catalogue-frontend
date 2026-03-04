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
} from '@mui/material';
import { createRecipe } from '../hooks';
import type { PostRecipeRequest } from '../types';

interface RecipePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (recipeId: number) => void;
}

export default function RecipePostDialog({ open, onClose, onSuccess }: RecipePostDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const handleClose = () => {
    if (loading) return;
    setName('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    const request: PostRecipeRequest = {
      name: name.trim(),
      description: description.trim(),
    };

    const result = await createRecipe(request);

    if (result.ok) {
      handleClose();
      onSuccess(result.data.id);
    } else {
      setLoading(false);

      // Handle field-level errors
      if (typeof result.error.details !== 'string' && result.error.details instanceof Map) {
        const fieldErrors: { name?: string; description?: string } = {};
        result.error.details.forEach((value, key) => {
          if (key === 'name' || key === 'description') {
            fieldErrors[key] = value;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Recipe</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            fullWidth
            required
            multiline
            rows={4}
            disabled={loading}
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
          disabled={loading || !name.trim() || !description.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
