import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  ManageAccounts as ManageAccountsIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { searchUsers, grantRole, listRoles } from '../api/anubhavApi';
import { PLACES, PLACE_META } from '../utils/anubhavHelpers';

const ROLE_OPTIONS = [
  { value: 'none', label: 'None (Remove role)' },
  { value: 'loc', label: 'LOC — Local Organising Committee' },
  { value: 'dexco', label: 'DEXCO — Diocesan Executive Committee' },
];

const placeLabel = (place) => (PLACE_META[place] && PLACE_META[place].label) || place || '—';

const handleAuthError = (envelope, onLogout) => {
  if (envelope && envelope.status === 401 && typeof onLogout === 'function') {
    toast.error('Session expired. Please login again.');
    onLogout();
    return true;
  }
  return false;
};

const RoleManagement = ({ onLogout }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [grantingId, setGrantingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState({});
  const [selectedPlace, setSelectedPlace] = useState({});
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    const res = await listRoles();
    setRolesLoading(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to load roles');
      return;
    }
    setRoles(Array.isArray(res.data?.roles) ? res.data.roles : Array.isArray(res.data) ? res.data : []);
  }, [onLogout]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await searchUsers(query.trim());
    setSearching(false);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Search failed');
      return;
    }
    setSearchResults(Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : []);
    setSelectedRole({});
    setSelectedPlace({});
  };

  const handleGrant = async (u) => {
    const role =
      selectedRole[u.profile_id] !== undefined
        ? selectedRole[u.profile_id]
        : u.event_role || 'none';
    const place = selectedPlace[u.profile_id] || u.loc_place || null;

    if (role === 'loc' && !place) {
      toast.warning('Please select a place for LOC role');
      return;
    }

    setGrantingId(u.profile_id);
    const body = { event_role: role };
    if (u.user_id) body.user_id = u.user_id;
    else body.profile_id = u.profile_id;
    if (role === 'loc') body.loc_place = place;

    const res = await grantRole(body);
    setGrantingId(null);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to update role');
      return;
    }
    toast.success(`Role updated for ${u.profile_name}`);
    setSearchResults((prev) =>
      prev.map((p) =>
        p.profile_id === u.profile_id
          ? { ...p, event_role: role, loc_place: role === 'loc' ? place : null }
          : p
      )
    );
    fetchRoles();
  };

  const handleRemoveRole = async (u) => {
    setGrantingId(u.profile_id);
    const body = { event_role: 'none' };
    if (u.user_id) body.user_id = u.user_id;
    else body.profile_id = u.profile_id;

    const res = await grantRole(body);
    setGrantingId(null);
    if (handleAuthError(res, onLogout)) return;
    if (!res.success) {
      toast.error(res.message || 'Failed to remove role');
      return;
    }
    toast.success(`Role removed for ${u.profile_name}`);
    fetchRoles();
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Search + assign */}
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ManageAccountsIcon color="primary" />
                <Typography variant="h6">Role Management</Typography>
              </Box>
            }
            subheader="Search youth by name or phone, then assign event roles"
          />
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <TextField
                label="Name or phone number"
                size="small"
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                startIcon={searching ? <CircularProgress size={16} /> : null}
                sx={{ minWidth: 110, flexShrink: 0 }}
              >
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </Stack>

            {!searching && query.trim() && searchResults.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No results found for "{query}".
              </Alert>
            )}

            <Stack spacing={2}>
              {searchResults.map((u) => {
                const noAccount = !u.user_id;
                const curRole =
                  selectedRole[u.profile_id] !== undefined
                    ? selectedRole[u.profile_id]
                    : u.event_role || 'none';

                return (
                  <Box
                    key={u.profile_id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      opacity: noAccount ? 0.65 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {u.profile_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {u.phone} · {u.parish}, {u.deanery}
                        </Typography>
                        {u.event_role && u.event_role !== 'none' && (
                          <Chip
                            size="small"
                            label={
                              u.event_role === 'loc'
                                ? `LOC — ${placeLabel(u.loc_place)}`
                                : 'DEXCO'
                            }
                            color={u.event_role === 'dexco' ? 'primary' : 'secondary'}
                            sx={{ mt: 0.75 }}
                          />
                        )}
                      </Box>

                      {noAccount ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: 'italic', alignSelf: 'center' }}
                        >
                          No login account — cannot promote
                        </Typography>
                      ) : (
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          sx={{ flexShrink: 0 }}
                        >
                          <FormControl size="small" sx={{ minWidth: 210 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                              label="Role"
                              value={curRole}
                              onChange={(e) =>
                                setSelectedRole((prev) => ({
                                  ...prev,
                                  [u.profile_id]: e.target.value,
                                }))
                              }
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {curRole === 'loc' && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Place</InputLabel>
                              <Select
                                label="Place"
                                value={
                                  selectedPlace[u.profile_id] ||
                                  u.loc_place ||
                                  ''
                                }
                                onChange={(e) =>
                                  setSelectedPlace((prev) => ({
                                    ...prev,
                                    [u.profile_id]: e.target.value,
                                  }))
                                }
                              >
                                {PLACES.map((p) => (
                                  <MenuItem key={p} value={p}>
                                    {placeLabel(p)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGrant(u)}
                            disabled={grantingId === u.profile_id}
                            startIcon={
                              grantingId === u.profile_id ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                            sx={{ minWidth: 80 }}
                          >
                            {grantingId === u.profile_id ? 'Saving…' : 'Apply'}
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Current roles table */}
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader title="Current Event Roles" />
          <CardContent>
            {rolesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : roles.length === 0 ? (
              <Alert severity="info">
                No event roles have been granted yet.
              </Alert>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                        Parish
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Place</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((u) => (
                      <TableRow key={u.profile_id} hover>
                        <TableCell>{u.profile_name}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {u.parish}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.event_role.toUpperCase()}
                            color={u.event_role === 'dexco' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          {u.event_role === 'loc' ? placeLabel(u.loc_place) : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ p: 0.5 }}>
                          <Tooltip title="Remove role">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={grantingId === u.profile_id}
                                onClick={() => handleRemoveRole(u)}
                              >
                                <PersonRemoveIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default RoleManagement;
