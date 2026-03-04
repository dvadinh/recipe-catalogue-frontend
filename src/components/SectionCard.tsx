import { useState, useMemo, memo } from 'react';
import {
  Typography,
  TextField,
  IconButton,
  Box,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { SectionResponse, StepResponse } from '../types';
import type { MediaChange } from '../pages/RecipePage.types';
import StepCard from './StepCard';
import MediaUpload from './MediaUpload';

interface SectionCardProps {
  section: SectionResponse;
  editMode: boolean;
  onUpdate: (sectionId: number, updated: SectionResponse) => void;
  onDelete: (sectionId: number) => void;
  sectionMediaChange?: MediaChange;
  onSectionMediaSelect?: (sectionId: number, file: File) => void;
  onSectionMediaDelete?: (sectionId: number) => void;
  stepMediaChanges?: Map<number, MediaChange>;
  onStepMediaSelect?: (stepId: number, file: File) => void;
  onStepMediaDelete?: (stepId: number) => void;
  nextTempId: number;
  onTempIdUsed: () => void;
  showErrors?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  totalSections?: number;
  onSectionNumberChange?: (sectionId: number, newNumber: number) => void;
}

function SectionCard({
  section,
  editMode,
  onUpdate,
  onDelete,
  sectionMediaChange,
  onSectionMediaSelect,
  onSectionMediaDelete,
  stepMediaChanges,
  onStepMediaSelect,
  onStepMediaDelete,
  nextTempId,
  onTempIdUsed,
  showErrors = false,
  expanded = true,
  onToggleExpanded,
  totalSections = 1,
  onSectionNumberChange,
}: SectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const titleError = showErrors && !(section.title || '').trim();
  const descriptionError = showErrors && !(section.description || '').trim();

  const mediaUrl = useMemo(() => {
    if (sectionMediaChange?.file) {
      return URL.createObjectURL(sectionMediaChange.file);
    }
    if (sectionMediaChange?.shouldDelete) {
      return null;
    }
    return section.media?.presignedUrl || null;
  }, [sectionMediaChange, section.media?.presignedUrl]);

  const handleAddStep = () => {
    const newStep: StepResponse = {
      id: nextTempId,
      title: '',
      number: section.steps.length + 1,
      description: '',
      media: null,
    };
    onUpdate(section.id, { ...section, steps: [...section.steps, newStep] });
    onTempIdUsed(); // Decrement the temp ID counter
  };

  const handleDeleteStep = (stepIndex: number) => {
    onUpdate(section.id, { ...section, steps: section.steps.filter((_, i) => i !== stepIndex) });
  };

  const handleUpdateStep = (stepIndex: number, updatedStep: StepResponse) => {
    const newSteps = [...section.steps];
    newSteps[stepIndex] = updatedStep;
    onUpdate(section.id, { ...section, steps: newSteps });
  };

  const handleStepNumberChange = (stepId: number, newNumber: number) => {
    const currentIndex = section.steps.findIndex(s => s.id === stepId);
    if (currentIndex === -1) return;

    // Remove from current position
    const step = section.steps[currentIndex];
    const newSteps = section.steps.filter((_, i) => i !== currentIndex);

    // Insert at new position (newNumber is 1-based, array is 0-based)
    newSteps.splice(newNumber - 1, 0, step);

    // Renumber all steps
    const renumberedSteps = newSteps.map((s, index) => ({ ...s, number: index + 1 }));

    onUpdate(section.id, { ...section, steps: renumberedSteps });
  };

  const handleDeleteConfirm = () => {
    onDelete(section.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Box id={`section-${section.id}`} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Section {section.number}: {section.title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {editMode && (
            <IconButton size="small" onClick={() => setShowDeleteDialog(true)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onToggleExpanded}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

          <Collapse in={expanded}>
            {editMode ? (
              <>
                {onSectionNumberChange && (
                  <FormControl fullWidth sx={{ mb: 2 }} size="small">
                    <Select
                      value={section.number}
                      onChange={(e) => onSectionNumberChange(section.id, e.target.value as number)}
                      displayEmpty
                      renderValue={(value) => `Section Number: ${value}`}
                    >
                      {Array.from({ length: totalSections }, (_, i) => i + 1).map(num => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {titleError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                    Section title cannot be empty
                  </Typography>
                )}
                <TextField
                  label="Section Title"
                  value={section.title || ''}
                  onChange={(e) => onUpdate(section.id, { ...section, title: e.target.value })}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  error={titleError}
                />
                {descriptionError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                    Section description cannot be empty
                  </Typography>
                )}
                <TextField
                  label="Section Description"
                  value={section.description || ''}
                  onChange={(e) => onUpdate(section.id, { ...section, description: e.target.value })}
                  fullWidth
                  required
                  multiline
                  rows={2}
                  error={descriptionError}
                />
                {onSectionMediaSelect && onSectionMediaDelete && (
                  <MediaUpload
                    media={mediaUrl}
                    onFileSelect={(file) => onSectionMediaSelect(section.id, file)}
                    onDelete={() => onSectionMediaDelete(section.id)}
                    label="Upload Section Image or Video"
                  />
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', whiteSpace: 'pre-line' }}>
                  {section.description}
                </Typography>
                {section.media && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '1920px',
                      paddingTop: '56.25%', // 16:9 aspect ratio (1080/1920)
                      backgroundColor: '#f5f5f7',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 2,
                      margin: '0 auto 16px',
                    }}
                  >
                    <Box
                      component="img"
                      src={section.media.presignedUrl}
                      alt={section.title}
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

            {/* Steps */}
            <Box sx={{ mt: 2 }}>
              {editMode ? (
                section.steps.map((step, stepIndex) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={stepIndex}
                    editMode={editMode}
                    onUpdate={(updated) => handleUpdateStep(stepIndex, updated)}
                    onDelete={() => handleDeleteStep(stepIndex)}
                    stepMediaChange={stepMediaChanges?.get(step.id)}
                    onStepMediaSelect={onStepMediaSelect ? (file) => onStepMediaSelect(step.id, file) : undefined}
                    onStepMediaDelete={onStepMediaDelete ? () => onStepMediaDelete(step.id) : undefined}
                    showErrors={showErrors}
                    totalSteps={section.steps.length}
                    onStepNumberChange={handleStepNumberChange}
                  />
                ))
              ) : (
                section.steps.map((step, stepIndex) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={stepIndex}
                    editMode={false}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                  />
                ))
              )}
            </Box>

            {editMode && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddStep}
                size="small"
                sx={{ mt: 2 }}
              >
                Add Step
              </Button>
            )}
        </Collapse>
      </Box>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this section and all its steps?
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

export default memo(SectionCard);
