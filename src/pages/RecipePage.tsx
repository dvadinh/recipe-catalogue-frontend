import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  getRecipe,
  updateRecipe,
  uploadRecipeMedia,
  deleteRecipeMedia,
  uploadSectionMedia,
  deleteSectionMedia,
  uploadStepMedia,
  deleteStepMedia,
  getBeneficiaries,
  addBeneficiaries,
  removeBeneficiaries,
  updateRecipeAccessLevel,
  getUsers,
} from '../hooks';
import type {
  RecipeDetailsResponse,
  SectionResponse,
  PutRecipeRequest,
  PutSectionRequest,
  UserSummaryResponse,
  PatchRecipeAccessLevelRequest,
} from '../types';
import { RecipeAccessLevel, PatchRequestOperation } from '../types';
import { useAuthenticationContext } from '../contexts';
import type { MediaChanges } from './RecipePage.types';
import SectionCard from '../components/SectionCard';
import MediaUpload from '../components/MediaUpload';

export default function RecipePage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthenticationContext();

  const [recipe, setRecipe] = useState<RecipeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSections, setEditedSections] = useState<SectionResponse[]>([]);
  const [editedAccessLevel, setEditedAccessLevel] = useState<typeof RecipeAccessLevel[keyof typeof RecipeAccessLevel]>(RecipeAccessLevel.PUBLIC);
  const [mediaChanges, setMediaChanges] = useState<MediaChanges>({
    sections: new Map(),
    steps: new Map(),
  });
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [nextTempId, setNextTempId] = useState(-1); // Counter for temporary IDs
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set()); // Track expanded sections

  // Beneficiary management
  const [allUsers, setAllUsers] = useState<UserSummaryResponse[]>([]);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<UserSummaryResponse[]>([]);
  const [currentBeneficiaries, setCurrentBeneficiaries] = useState<UserSummaryResponse[]>([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);

      const result = await getRecipe(parseInt(recipeId, 10));

      if (result.ok) {
        // Normalize data to ensure all steps have a title field
        const normalizedSections = (result.data.sections || []).map(section => ({
          ...section,
          steps: (section.steps || []).map(step => ({
            ...step,
            title: step.title || '',
          })),
        }));

        setRecipe(result.data);
        setEditedName(result.data.name || '');
        setEditedDescription(result.data.description || '');
        setEditedAccessLevel(result.data.accessLevel);
        setEditedSections(normalizedSections);
        // Initialize all sections as expanded
        setExpandedSections(new Set(normalizedSections.map(s => s.id)));
      } else {
        if (typeof result.error.details === 'string') {
          setError(result.error.details);
        } else {
          setError('Failed to load recipe');
        }
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [recipeId, navigate]);

  // Fetch all users for beneficiary selection when entering edit mode
  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getUsers(true);
      if (result.ok) {
        // Filter out current user
        const filteredUsers = user ? result.data.filter(u => u.id !== user.id) : result.data;
        setAllUsers(filteredUsers);
      }
    };

    if (editMode && user) {
      fetchUsers();
    }
  }, [editMode, user]);

  // Fetch beneficiaries when recipe is loaded and is PRIVATE
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      if (!recipeId || !recipe) return;

      // Only fetch beneficiaries if the recipe is PRIVATE
      if (recipe.accessLevel === RecipeAccessLevel.PRIVATE) {
        const result = await getBeneficiaries(parseInt(recipeId, 10));
        if (result.ok) {
          const beneficiaryUsers = result.data.map(b => b.user);
          setCurrentBeneficiaries(beneficiaryUsers);
          setSelectedBeneficiaries(beneficiaryUsers);
        }
      } else {
        // Clear beneficiaries if recipe is PUBLIC
        setCurrentBeneficiaries([]);
        setSelectedBeneficiaries([]);
      }
    };

    fetchBeneficiaries();
  }, [recipe, recipeId]);

  const handleEdit = useCallback(async () => {
    if (!recipe || !recipeId) return;

    // Set edit mode and apply recipe data
    setEditMode(true);
    setEditedName(recipe.name);
    setEditedDescription(recipe.description);
    setEditedAccessLevel(recipe.accessLevel);
    setEditedSections(JSON.parse(JSON.stringify(recipe.sections))); // Deep copy

    // Fetch beneficiaries if recipe is PRIVATE
    if (recipe.accessLevel === RecipeAccessLevel.PRIVATE) {
      const result = await getBeneficiaries(parseInt(recipeId, 10));
      if (result.ok) {
        const beneficiaryUsers = result.data.map(b => b.user);
        setCurrentBeneficiaries(beneficiaryUsers);
        setSelectedBeneficiaries(beneficiaryUsers);
      }
    }
  }, [recipe, recipeId]);

  const handleCancel = useCallback(() => {
    if (!recipe) return;
    setEditMode(false);
    setEditedName(recipe.name);
    setEditedDescription(recipe.description);
    setEditedAccessLevel(recipe.accessLevel);
    setEditedSections(recipe.sections);
    setSelectedBeneficiaries(currentBeneficiaries);
    setMediaChanges({ sections: new Map(), steps: new Map() });
    setShowErrors(false);
  }, [recipe, currentBeneficiaries]);

  const handleRecipeMediaSelect = useCallback((file: File) => {
    setMediaChanges((prev) => ({ ...prev, recipe: { file } }));
  }, []);

  const handleRecipeMediaDelete = useCallback(() => {
    setMediaChanges((prev) => ({ ...prev, recipe: { shouldDelete: true } }));
  }, []);

  const handleSectionMediaSelect = useCallback((sectionId: number, file: File) => {
    setMediaChanges((prev) => ({
      ...prev,
      sections: new Map(prev.sections).set(sectionId, { file }),
    }));
  }, []);

  const handleSectionMediaDelete = useCallback((sectionId: number) => {
    setMediaChanges((prev) => ({
      ...prev,
      sections: new Map(prev.sections).set(sectionId, { shouldDelete: true }),
    }));
  }, []);

  const handleStepMediaSelect = useCallback((stepId: number, file: File) => {
    setMediaChanges((prev) => ({
      ...prev,
      steps: new Map(prev.steps).set(stepId, { file }),
    }));
  }, []);

  const handleStepMediaDelete = useCallback((stepId: number) => {
    setMediaChanges((prev) => ({
      ...prev,
      steps: new Map(prev.steps).set(stepId, { shouldDelete: true }),
    }));
  }, []);

  const handleAddSection = useCallback(() => {
    const newSection: SectionResponse = {
      id: nextTempId,
      title: '',
      description: '',
      number: editedSections.length + 1,
      media: null,
      steps: [],
    };
    setEditedSections([...editedSections, newSection]);
    setExpandedSections(prev => new Set(prev).add(nextTempId)); // Auto-expand new sections
    setNextTempId(nextTempId - 1); // -1, -2, -3, etc.
  }, [nextTempId, editedSections]);

  const handleDeleteSection = useCallback((sectionId: number) => {
    setEditedSections(prev => prev.filter((s) => s.id !== sectionId));
  }, []);

  const handleUpdateSection = useCallback((sectionId: number, updatedSection: SectionResponse) => {
    setEditedSections(prev => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;
      const newSections = [...prev];
      newSections[index] = updatedSection;
      return newSections;
    });
  }, []);

  const handleSectionNumberChange = useCallback((sectionId: number, newNumber: number) => {
    setEditedSections(prev => {
      const currentIndex = prev.findIndex(s => s.id === sectionId);
      if (currentIndex === -1) return prev;

      // Remove from current position
      const section = prev[currentIndex];
      const newSections = prev.filter((_, i) => i !== currentIndex);

      // Insert at new position (newNumber is 1-based, array is 0-based)
      newSections.splice(newNumber - 1, 0, section);

      // Renumber all sections
      return newSections.map((s, index) => ({ ...s, number: index + 1 }));
    });
  }, []);

  const handleTempIdUsed = useCallback(() => {
    setNextTempId(prev => prev - 1);
  }, []);

  const toggleSectionExpanded = useCallback((sectionId: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const noopUpdate = useCallback(() => {}, []);
  const noopDelete = useCallback(() => {}, []);

  const nameError = useMemo(() => showErrors && !editedName.trim(), [showErrors, editedName]);
  const descriptionError = useMemo(() => showErrors && !editedDescription.trim(), [showErrors, editedDescription]);

  const recipeMediaUrl = useMemo(() => {
    if (mediaChanges.recipe?.file) {
      return URL.createObjectURL(mediaChanges.recipe.file);
    }
    if (mediaChanges.recipe?.shouldDelete) {
      return null;
    }
    return recipe?.media?.presignedUrl || null;
  }, [mediaChanges.recipe, recipe?.media?.presignedUrl]);

  const sectionsToDisplay = useMemo(() =>
    editMode ? editedSections : recipe?.sections || []
  , [editMode, editedSections, recipe?.sections]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || 'Recipe not found'}</Alert>
      </Box>
    );
  }

  const canEdit = user && (user.id === recipe.owner.id || user.type === 'ADMIN');

  const handleSave = async () => {
    // Show all validation errors
    setShowErrors(true);

    // Validation
    if (!editedName.trim() || !editedDescription.trim()) {
      // Scroll to top where recipe fields are
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    for (const section of editedSections) {
      if (!(section.title || '').trim() || !(section.description || '').trim()) {
        // Scroll to the section with error
        const element = document.getElementById(`section-${section.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (section.steps && Array.isArray(section.steps)) {
        for (const step of section.steps) {
          if (!(step.title || '').trim() || !(step.description || '').trim()) {
            // Scroll to the step with error
            const element = document.getElementById(`step-${step.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
      }
    }

    setSaving(true);
    setError(null);

    // Build PUT request
    const putRequest: PutRecipeRequest = {
      name: editedName.trim(),
      description: editedDescription.trim(),
      sections: editedSections.map((section): PutSectionRequest => ({
        id: section.id < 0 ? null : section.id, // Negative IDs are temporary, convert to null for new sections
        title: section.title.trim(),
        description: section.description.trim(),
        steps: section.steps.map((step) => ({
          id: step.id < 0 ? null : step.id, // Negative IDs are temporary, convert to null for new steps
          title: (step.title || '').trim(),
          description: (step.description || '').trim(),
        })),
      })),
    };

    const result = await updateRecipe(parseInt(recipeId!, 10), putRequest);

    if (result.ok) {
      // Process media operations using real IDs from PUT response
      const updatedRecipe = result.data;
      const recipeIdNum = parseInt(recipeId!, 10);

      // Build mapping from temp IDs to real IDs
      const sectionIdMap = new Map<number, number>();
      const stepIdMap = new Map<number, number>();

      // Map sections (order is preserved)
      editedSections.forEach((editedSection, index) => {
        const realSection = updatedRecipe.sections[index];
        if (realSection) {
          sectionIdMap.set(editedSection.id, realSection.id);

          // Map steps within this section
          editedSection.steps.forEach((editedStep, stepIndex) => {
            const realStep = realSection.steps[stepIndex];
            if (realStep) {
              stepIdMap.set(editedStep.id, realStep.id);
            }
          });
        }
      });

      // Recipe media
      if (mediaChanges.recipe?.file) {
        await uploadRecipeMedia(recipeIdNum, mediaChanges.recipe.file);
      } else if (mediaChanges.recipe?.shouldDelete) {
        await deleteRecipeMedia(recipeIdNum);
      }

      // Section media - use real IDs
      for (const [tempSectionId, change] of mediaChanges.sections.entries()) {
        const realSectionId = tempSectionId < 0 ? sectionIdMap.get(tempSectionId) : tempSectionId;
        if (realSectionId) {
          if (change.file) {
            await uploadSectionMedia(realSectionId, change.file);
          } else if (change.shouldDelete) {
            await deleteSectionMedia(realSectionId);
          }
        }
      }

      // Step media - use real IDs
      for (const [tempStepId, change] of mediaChanges.steps.entries()) {
        const realStepId = tempStepId < 0 ? stepIdMap.get(tempStepId) : tempStepId;
        if (realStepId) {
          if (change.file) {
            await uploadStepMedia(realStepId, change.file);
          } else if (change.shouldDelete) {
            await deleteStepMedia(realStepId);
          }
        }
      }

      // Update access level if changed
      if (recipe && editedAccessLevel !== recipe.accessLevel) {
        const patchRequest: PatchRecipeAccessLevelRequest = {
          accessLevel: editedAccessLevel,
          accessLevelOperation: PatchRequestOperation.UPDATE,
        };
        await updateRecipeAccessLevel(recipeIdNum, patchRequest);
      }

      // Update beneficiaries if access level is PRIVATE
      if (editedAccessLevel === RecipeAccessLevel.PRIVATE) {
        const currentBeneficiaryIds = new Set(currentBeneficiaries.map(b => b.id));
        const selectedBeneficiaryIds = new Set(selectedBeneficiaries.map(b => b.id));

        // Find users to add
        const toAdd = selectedBeneficiaries.filter(b => !currentBeneficiaryIds.has(b.id));
        if (toAdd.length > 0) {
          await addBeneficiaries(recipeIdNum, { userIds: toAdd.map(u => u.id) });
        }

        // Find users to remove
        const toRemove = currentBeneficiaries.filter(b => !selectedBeneficiaryIds.has(b.id));
        if (toRemove.length > 0) {
          await removeBeneficiaries(recipeIdNum, { userIds: toRemove.map(u => u.id) });
        }

        // Update current beneficiaries
        setCurrentBeneficiaries(selectedBeneficiaries);
      }

      // Refetch recipe to get updated media URLs
      const refetchResult = await getRecipe(recipeIdNum);
      if (refetchResult.ok) {
        const normalizedSections = (refetchResult.data.sections || []).map(section => ({
          ...section,
          steps: (section.steps || []).map(step => ({
            ...step,
            title: step.title || '',
          })),
        }));
        setRecipe(refetchResult.data);
        setEditedSections(normalizedSections);
      } else {
        const normalizedSections = (updatedRecipe.sections || []).map(section => ({
          ...section,
          steps: (section.steps || []).map(step => ({
            ...step,
            title: step.title || '',
          })),
        }));
        setRecipe(updatedRecipe);
        setEditedSections(normalizedSections);
      }

      setEditMode(false);
      setMediaChanges({ sections: new Map(), steps: new Map() });
      setShowErrors(false);
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to save recipe');
      }
    }

    setSaving(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f7', pt: '64px' }}>
      {/* Header with Back button and Edit button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d2d2d7',
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          Back
        </Button>
        {canEdit && !editMode && (
          <Button startIcon={<EditIcon />} onClick={handleEdit} variant="outlined">
            Edit
          </Button>
        )}
      </Box>

      {/* Side Panel and Main Content */}
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Side Navigation Panel */}
        <Box
          sx={{
            width: '20%',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #d2d2d7',
            p: 2,
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            alignSelf: 'flex-start',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1d1d1f' }}>
            Table of Contents
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sectionsToDisplay.map((section) => (
              <Box key={section.id}>
                <Button
                  onClick={() => {
                    const element = document.getElementById(`section-${section.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    width: '100%',
                    textTransform: 'none',
                    color: '#1d1d1f',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  Section {section.number}: {section.title}
                </Button>
                {section.steps.map((step) => (
                  <Button
                    key={step.id}
                    onClick={() => {
                      // Expand the parent section first
                      setExpandedSections(prev => new Set(prev).add(section.id));
                      // Wait a bit for the section to expand, then scroll
                      setTimeout(() => {
                        const element = document.getElementById(`step-${step.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      width: '100%',
                      pl: 4,
                      textTransform: 'none',
                      color: '#86868b',
                      fontSize: '13px',
                    }}
                  >
                    Step {step.number}: {step.title}
                  </Button>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Recipe Info */}
        <Box sx={{ mb: 4 }}>
        {editMode ? (
          <>
            {nameError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                Recipe name cannot be empty
              </Typography>
            )}
            <TextField
              label="Recipe Name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              error={nameError}
            />

            {/* Access Level Selection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={editedAccessLevel}
                  label="Access Level"
                  onChange={(e) => setEditedAccessLevel(e.target.value as typeof RecipeAccessLevel[keyof typeof RecipeAccessLevel])}
                >
                  <MenuItem value={RecipeAccessLevel.PUBLIC}>Public</MenuItem>
                  <MenuItem value={RecipeAccessLevel.PRIVATE}>Private</MenuItem>
                </Select>
              </FormControl>

              {/* Beneficiary Selection (only for PRIVATE recipes) */}
              {editedAccessLevel === RecipeAccessLevel.PRIVATE && (
                <Autocomplete
                  multiple
                  value={selectedBeneficiaries}
                  onChange={(_, newValue) => setSelectedBeneficiaries(newValue)}
                  options={allUsers}
                  getOptionLabel={(option) => option.displayName}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Beneficiaries"
                      placeholder="Select users who can view this recipe"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.displayName}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  sx={{ flex: 1 }}
                />
              )}
            </Box>

            {descriptionError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                Recipe description cannot be empty
              </Typography>
            )}
            <TextField
              label="Recipe Description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
              error={descriptionError}
              sx={{ mb: 2 }}
            />

            <MediaUpload
              media={recipeMediaUrl}
              onFileSelect={handleRecipeMediaSelect}
              onDelete={handleRecipeMediaDelete}
              disabled={saving}
              label="Upload Recipe Image or Video"
            />
          </>
        ) : (
          <>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
              {recipe.name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#86868b' }}>
              {recipe.accessLevel === RecipeAccessLevel.PRIVATE ? 'Private' : 'Public'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary', whiteSpace: 'pre-line' }}>
              {recipe.description}
            </Typography>
            {recipe.media && (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '1920px',
                  paddingTop: '56.25%', // 16:9 aspect ratio (1080/1920)
                  backgroundColor: '#f5f5f7',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mt: 2,
                  margin: '16px auto 0',
                }}
              >
                <Box
                  component="img"
                  src={recipe.media.presignedUrl}
                  alt={recipe.name}
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

        {/* Sections */}
      {editMode ? (
        editedSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            editMode={editMode}
            onUpdate={handleUpdateSection}
            onDelete={handleDeleteSection}
            sectionMediaChange={mediaChanges.sections.get(section.id)}
            onSectionMediaSelect={handleSectionMediaSelect}
            onSectionMediaDelete={handleSectionMediaDelete}
            stepMediaChanges={mediaChanges.steps}
            onStepMediaSelect={handleStepMediaSelect}
            onStepMediaDelete={handleStepMediaDelete}
            nextTempId={nextTempId}
            onTempIdUsed={handleTempIdUsed}
            showErrors={showErrors}
            expanded={expandedSections.has(section.id)}
            onToggleExpanded={() => toggleSectionExpanded(section.id)}
            totalSections={editedSections.length}
            onSectionNumberChange={handleSectionNumberChange}
          />
        ))
      ) : (
        sectionsToDisplay.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            editMode={false}
            onUpdate={noopUpdate}
            onDelete={noopDelete}
            nextTempId={nextTempId}
            onTempIdUsed={noopUpdate}
            expanded={expandedSections.has(section.id)}
            onToggleExpanded={() => toggleSectionExpanded(section.id)}
            totalSections={sectionsToDisplay.length}
          />
        ))
      )}

          {editMode && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSection}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Add Section
            </Button>
          )}
        </Box>
      </Box>

      {/* Floating Save/Cancel Buttons */}
      {editMode && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            gap: 2,
            zIndex: 1000,
          }}
        >
          <Button
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={saving}
            variant="outlined"
            sx={{
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
            }}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
