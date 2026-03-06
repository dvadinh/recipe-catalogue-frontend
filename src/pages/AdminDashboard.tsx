import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuthenticationContext } from '../contexts';
import { getUsers, deleteUsers, whoAmI } from '../hooks';
import type { UserDetailsResponse, DeleteUserRequest } from '../types';
import { Authority } from '../types';
import UserPostDialog from '../components/UserPostDialog';

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuthenticationContext();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserDetailsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | typeof Authority.ADMIN | typeof Authority.USER>('all');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.type !== Authority.ADMIN)) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const result = await getUsers(false);

    if (result.ok) {
      setUsers(result.data);
      setSelectedUserIds(new Set());
    } else {
      if (typeof result.error.details === 'string') {
        setError(result.error.details);
      } else {
        setError('Failed to load users');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user && user.type === Authority.ADMIN) {
      // Valid use case: data fetching on component mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchUsers();
    }
  }, [user]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || u.type === typeFilter;

      // Status filter
      const matchesEnabled = enabledFilter === 'all' ||
        (enabledFilter === 'true' ? u.enabled : !u.enabled);

      return matchesSearch && matchesType && matchesEnabled;
    });
  }, [users, searchQuery, typeFilter, enabledFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = page * 10;
    const endIndex = startIndex + 10;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select all users on current page
      const newSelected = new Set(selectedUserIds);
      paginatedUsers.forEach(u => newSelected.add(u.id));
      setSelectedUserIds(newSelected);
    } else {
      // Deselect all users on current page
      const newSelected = new Set(selectedUserIds);
      paginatedUsers.forEach(u => newSelected.delete(u.id));
      setSelectedUserIds(newSelected);
    }
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteError(null);

    const request: DeleteUserRequest = {
      userIds: Array.from(selectedUserIds),
    };

    const result = await deleteUsers(request);

    if (result.ok) {
      // Check if current user still exists
      const whoAmIResult = await whoAmI();

      if (!whoAmIResult.ok) {
        // Current user was deleted, logout
        await logout();
        navigate('/');
      } else {
        // Current user still exists, refresh table
        await fetchUsers();
      }

      setShowDeleteDialog(false);
      setDeleteError(null);
    } else {
      // Display error in dialog
      if (typeof result.error.details === 'string') {
        setDeleteError(result.error.details);
      } else {
        setDeleteError('Failed to delete users');
      }
    }

    setDeleting(false);
  };

  const handleCreateSuccess = async () => {
    await fetchUsers();
  };

  if (authLoading || !user || user.type !== Authority.ADMIN) {
    return null;
  }

  return (
    <Box sx={{ pt: 'calc(64px + 32px)', pb: 4, backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: '#1d1d1f' }}>
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #d2d2d7' }}>
            {/* Search and Filters Toolbar */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search users by username or display name..."
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
                  flex: 1,
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

              {/* Type Filter */}
              <FormControl sx={{ minWidth: 120 }} size="small">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | typeof Authority.ADMIN | typeof Authority.USER)}
                  sx={{
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
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value={Authority.ADMIN}>Admin</MenuItem>
                  <MenuItem value={Authority.USER}>User</MenuItem>
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl sx={{ minWidth: 120 }} size="small">
                <Select
                  value={enabledFilter}
                  onChange={(e) => setEnabledFilter(e.target.value as 'all' | 'true' | 'false')}
                  sx={{
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
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Table Title and Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                Users
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleDeleteClick}
                  color="error"
                  size="small"
                  disabled={selectedUserIds.size === 0}
                  sx={{
                    border: '1px solid',
                    borderColor: selectedUserIds.size === 0 ? '#d2d2d7' : 'error.main',
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  onClick={() => setShowCreateDialog(true)}
                  color="primary"
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          paginatedUsers.some(u => selectedUserIds.has(u.id)) &&
                          !paginatedUsers.every(u => selectedUserIds.has(u.id))
                        }
                        checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.has(u.id))}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 60, wordWrap: 'break-word', whiteSpace: 'normal' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 150, wordWrap: 'break-word', whiteSpace: 'normal' }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>Display Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 100, wordWrap: 'break-word', whiteSpace: 'normal' }}>Password</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 100, wordWrap: 'break-word', whiteSpace: 'normal' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', maxWidth: 120, wordWrap: 'break-word', whiteSpace: 'normal' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#86868b' }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((u) => (
                      <TableRow
                        key={u.id}
                        selected={selectedUserIds.has(u.id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#f5f5f7',
                          },
                        }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedUserIds.has(u.id)}
                            onChange={() => handleSelectUser(u.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#1d1d1f', maxWidth: 60, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>{u.id}</TableCell>
                        <TableCell sx={{ color: '#1d1d1f', maxWidth: 150, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>{u.username}</TableCell>
                        <TableCell sx={{ color: '#1d1d1f', maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>{u.displayName}</TableCell>
                        <TableCell sx={{ color: '#86868b', maxWidth: 100, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>{'••••••••'}</TableCell>
                        <TableCell sx={{ maxWidth: 100, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>
                          <Chip label={u.type} size="small" sx={{ backgroundColor: '#f5f5f7' }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 120, wordWrap: 'break-word', whiteSpace: 'normal' }} onClick={() => handleRowClick(u.id)}>
                          <Chip
                            label={u.enabled ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={u.enabled ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              sx={{
                borderTop: '1px solid #d2d2d7',
                mt: 2,
              }}
            />
          </Paper>
        )}

        {/* Create User Dialog */}
        <UserPostDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onClose={handleDeleteCancel}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            {deleteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {deleteError}
              </Alert>
            )}
            <DialogContentText>
              Are you sure you want to delete {selectedUserIds.size} selected user{selectedUserIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
