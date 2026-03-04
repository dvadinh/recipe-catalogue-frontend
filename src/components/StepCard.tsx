import { useState, useMemo, memo } from 'react';
import {
  Typography,
  TextField,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { StepResponse } from '../types';
import type { MediaChange } from '../pages/RecipePage.types';
import MediaUpload from './MediaUpload';

interface StepCardProps {
  step: StepResponse;
  index: number;
  editMode: boolean;
  onUpdate: (updated: StepResponse) => void;
  onDelete: () => void;
  stepMediaChange?: MediaChange;
  onStepMediaSelect?: (file: File) => void;
  onStepMediaDelete?: () => void;
  showErrors?: boolean;
  totalSteps?: number;
  onStepNumberChange?: (stepId: number, newNumber: number) => void;
}

function StepCard({
  step,
  index,
  editMode,
  onUpdate,
  onDelete,
  stepMediaChange,
  onStepMediaSelect,
  onStepMediaDelete,
  showErrors = false,
  totalSteps = 1,
  onStepNumberChange,
}: StepCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const titleError = showErrors && !(step.title || '').trim();
  const descriptionError = showErrors && !(step.description || '').trim();

  const mediaUrl = useMemo(() => {
    if (stepMediaChange?.file) {
      return URL.createObjectURL(stepMediaChange.file);
    }
    if (stepMediaChange?.shouldDelete) {
      return null;
    }
    return step.media?.presignedUrl || null;
  }, [stepMediaChange, step.media?.presignedUrl]);

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Box id={`step-${step.id}`} sx={{ ml: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
            Step {step.number}: {step.title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {editMode && (
            <IconButton size="small" onClick={() => setShowDeleteDialog(true)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

          {editMode ? (
            <>
              {onStepNumberChange && (
                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <Select
                    value={step.number}
                    onChange={(e) => onStepNumberChange(step.id, e.target.value as number)}
                    displayEmpty
                    renderValue={(value) => `Step Number: ${value}`}
                  >
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(num => (
                      <MenuItem key={num} value={num}>{num}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {titleError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                  Step title cannot be empty
                </Typography>
              )}
              <TextField
                label="Step Title"
                value={step.title || ''}
                onChange={(e) => onUpdate({ ...step, title: e.target.value })}
                fullWidth
                required
                size="small"
                sx={{ mb: 2 }}
                error={titleError}
              />
              {descriptionError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                  Step description cannot be empty
                </Typography>
              )}
              <TextField
                label="Step Description"
                value={step.description || ''}
                onChange={(e) => onUpdate({ ...step, description: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
                size="small"
                error={descriptionError}
              />
              {onStepMediaSelect && onStepMediaDelete && (
                <MediaUpload
                  media={mediaUrl}
                  onFileSelect={onStepMediaSelect}
                  onDelete={onStepMediaDelete}
                  label="Upload Step Image or Video"
                />
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                {step.description}
              </Typography>
              {step.media && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1920px',
                    paddingTop: '56.25%', // 16:9 aspect ratio (1080/1920)
                    backgroundColor: '#f5f5f7',
                    borderRadius: 1,
                    overflow: 'hidden',
                    mt: 2,
                    margin: '16px auto 0',
                  }}
                >
                  <Box
                    component="img"
                    src={step.media.presignedUrl}
                    alt={`Step ${index + 1}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}
            </>
        )}
      </Box>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this step?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default memo(StepCard);
