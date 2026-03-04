import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Alert,
  Card,
  CardContent,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { getRecipes, deleteRecipes } from '../hooks';
import type { RecipeDetailsResponse, DeleteRecipeRequest } from '../types';
import {useAuthenticationContext} from "../contexts";
import { parseInstant, formatInstantForDisplay } from '../utils';
import type { FilterType } from './LandingPage.types';
import RecipePostDialog from '../components/RecipePostDialog';

export default function LandingPage() {
  const { user, loading: authLoading } = useAuthenticationContext();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<RecipeDetailsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<number>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState<'all' | 'PUBLIC' | 'PRIVATE'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);

      const result = await getRecipes();

      if (result.ok) {
        setRecipes(result.data);
      } else {
        if (typeof result.error.details === 'string') {
          setError(result.error.details);
        } else {
          setError('Failed to load recipes');
        }
      }

      setLoading(false);
    };

    if (user) {
      fetchRecipes();
    }
  }, [user]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreateRecipeSuccess = (recipeId: number) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleToggleSelection = (recipeId: number) => {
    setSelectedRecipeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleDeleteRecipes = async () => {
    if (selectedRecipeIds.size === 0) return;

    setDeleting(true);
    setShowDeleteDialog(false);

    const request: DeleteRecipeRequest = {
      recipeIds: Array.from(selectedRecipeIds),
    };

    const result = await deleteRecipes(request);

    if (result.ok) {
      // Remove deleted recipes from the list
      setRecipes((prev) => prev.filter((recipe) => !selectedRecipeIds.has(recipe.id)));
      setSelectedRecipeIds(new Set());
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to delete recipes');
      }
    }

    setDeleting(false);
  };

  const getSelectedRecipeNames = (): string[] => {
    return recipes
      .filter((recipe) => selectedRecipeIds.has(recipe.id))
      .map((recipe) => recipe.name);
  };

  // Filter recipes based on selected filter, access level, and search query
  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by ownership
    if (selectedFilter === 'my') {
      if (recipe.owner.id !== user.id) return false;
    } else if (selectedFilter === 'shared') {
      if (recipe.owner.id === user.id) return false;
    }

    // Filter by access level
    if (accessLevelFilter !== 'all') {
      if (recipe.accessLevel !== accessLevelFilter) return false;
    }

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      return recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', pt: '64px', backgroundColor: '#f5f5f7' }}>
      {/* Side Panel - 20% */}
      <Box
        sx={{
          width: '20%',
          borderRight: '1px solid #d2d2d7',
          backgroundColor: '#ffffff',
          padding: 3,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#1d1d1f' }}>
            Recipes
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowCreateDialog(true)}
            sx={{
              backgroundColor: '#f5f5f7',
              '&:hover': { backgroundColor: '#e8e8ed' },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        <List component="nav">
          <ListItemButton
            selected={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
            sx={{
              borderRadius: '8px',
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: '#f5f5f7',
              },
              '&:hover': {
                backgroundColor: '#f5f5f7',
              },
            }}
          >
            <ListItemText
              primary="All Recipes"
              primaryTypographyProps={{
                fontSize: '14px',
                color: selectedFilter === 'all' ? '#1d1d1f' : '#86868b',
              }}
            />
          </ListItemButton>

          <ListItemButton
            selected={selectedFilter === 'my'}
            onClick={() => setSelectedFilter('my')}
            sx={{
              borderRadius: '8px',
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: '#f5f5f7',
              },
              '&:hover': {
                backgroundColor: '#f5f5f7',
              },
            }}
          >
            <ListItemText
              primary="My Recipes"
              primaryTypographyProps={{
                fontSize: '14px',
                color: selectedFilter === 'my' ? '#1d1d1f' : '#86868b',
              }}
            />
          </ListItemButton>

          <ListItemButton
            selected={selectedFilter === 'shared'}
            onClick={() => setSelectedFilter('shared')}
            sx={{
              borderRadius: '8px',
              '&.Mui-selected': {
                backgroundColor: '#f5f5f7',
              },
              '&:hover': {
                backgroundColor: '#f5f5f7',
              },
            }}
          >
            <ListItemText
              primary="Shared with me"
              primaryTypographyProps={{
                fontSize: '14px',
                color: selectedFilter === 'shared' ? '#1d1d1f' : '#86868b',
              }}
            />
          </ListItemButton>
        </List>
      </Box>

      {/* Main Content - 80% */}
      <Box
        sx={{
          width: '80%',
          backgroundColor: '#f5f5f7',
          padding: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ color: '#1d1d1f' }}>
              {selectedFilter === 'all' && 'All Recipes'}
              {selectedFilter === 'my' && 'My Recipes'}
              {selectedFilter === 'shared' && 'Shared with me'}
            </Typography>
            <FormControl size="small">
              <Select
                value={accessLevelFilter}
                onChange={(e) => setAccessLevelFilter(e.target.value as 'all' | 'PUBLIC' | 'PRIVATE')}
                sx={{
                  minWidth: 140,
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d2d2d7',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#86868b',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1d1d1f',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="PUBLIC">Public</MenuItem>
                <MenuItem value="PRIVATE">Private</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {selectedRecipeIds.size > 0 && (
            <IconButton
              size="small"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              sx={{
                backgroundColor: '#f5f5f7',
                '&:hover': { backgroundColor: '#e8e8ed' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <TextField
          fullWidth
          placeholder="Search recipes by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#86868b' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 3,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#d2d2d7',
              },
              '&:hover fieldset': {
                borderColor: '#86868b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1d1d1f',
              },
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : filteredRecipes.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No recipes found
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {filteredRecipes.map((recipe) => {
              const isOwned = recipe.owner.id === user.id;

              return (
              <Card
                key={recipe.id}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #d2d2d7',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: '#ffffff',
                  },
                }}
              >
                {isOwned && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                    }}
                  >
                    <Checkbox
                      checked={selectedRecipeIds.has(recipe.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelection(recipe.id);
                      }}
                    />
                  </Box>
                )}
                <Box onClick={() => navigate(`/recipes/${recipe.id}`)}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#1d1d1f',
                      fontSize: '18px',
                      fontWeight: 500,
                      mb: 1,
                    }}
                  >
                    {recipe.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#86868b',
                      fontSize: '14px',
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {recipe.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#86868b',
                      fontSize: '12px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {recipe.accessLevel === 'PRIVATE' ? 'Private' : 'Public'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#86868b',
                      fontSize: '12px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    By {recipe.owner.displayName}
                  </Typography>
                  {recipe.lastUpdatedAt && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#86868b',
                        fontSize: '12px',
                        display: 'block',
                      }}
                    >
                      Last Updated At: {formatInstantForDisplay(parseInstant(recipe.lastUpdatedAt))}
                    </Typography>
                  )}
                </CardContent>
                </Box>
              </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <RecipePostDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateRecipeSuccess}
      />

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the following recipe{selectedRecipeIds.size > 1 ? 's' : ''}?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {getSelectedRecipeNames().map((name, index) => (
              <Typography key={index} variant="body2" sx={{ color: '#1d1d1f', mb: 0.5 }}>
                • {name}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteRecipes}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}