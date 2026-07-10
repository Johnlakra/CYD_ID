// Per-user access drawer (Platform Phase 3). Opened from the Permission
// Matrix: search a user, assign/remove diocese roles (with optional
// deanery/parish/event scope) and set per-permission allow/deny overrides
// ('deny' always wins in resolution). Backend: /permissions/users/*.

import React, { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { searchUsers } from '../../api/anubhavApi';
import {
  assignUserRole,
  getUserAccess,
  removeUserRole,
  setUserOverride,
} from '../../api/platformApi';

const SCOPE_TYPES = ['diocese', 'deanery', 'parish', 'event'];

const UserAccessDrawer = ({ open, onClose, roles, permissions }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [access, setAccess] = useState(null); // GET /permissions/users/:id data
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignScopeType, setAssignScopeType] = useState('diocese');
  const [assignScopeRef, setAssignScopeRef] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [overridePerm, setOverridePerm] = useState(null);
  const [savingOverride, setSavingOverride] = useState(false);

  const resetSelection = () => {
    setAccess(null);
    setAssignRoleId('');
    setAssignScopeType('diocese');
    setAssignScopeRef('');
    setOverridePerm(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    setSearching(true);
    const res = await searchUsers(term);
    setSearching(false);
    if (res.success) {
      setResults(res.data.results || []);
      if (!(res.data.results || []).length) toast.info('No matching youth found');
    } else {
      toast.error(res.message || 'Search failed');
    }
  };

  const loadAccess = async (userId) => {
    setLoadingAccess(true);
    const res = await getUserAccess(userId);
    setLoadingAccess(false);
    if (res.success) {
      setAccess(res.data);
    } else {
      toast.error(res.message || 'Could not load user access');
    }
  };

  const handlePick = (row) => {
    if (!row.user_id) return;
    resetSelection();
    loadAccess(row.user_id);
  };

  const handleAssign = async () => {
    if (!access || !assignRoleId) return;
    setAssigning(true);
    const res = await assignUserRole(access.user.id, {
      role_id: assignRoleId,
      scope_type: assignScopeType,
      scope_ref: assignScopeType === 'diocese' ? null : assignScopeRef.trim() || null,
    });
    setAssigning(false);
    if (res.success) {
      toast.success(res.message || 'Role assigned');
      setAssignRoleId('');
      setAssignScopeRef('');
      loadAccess(access.user.id);
    } else {
      toast.error(res.message || 'Could not assign role');
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!access) return;
    const res = await removeUserRole(access.user.id, roleId);
    if (res.success) {
      toast.success(res.message || 'Role removed');
      loadAccess(access.user.id);
    } else {
      toast.error(res.message || 'Could not remove role');
    }
  };

  const applyOverride = async (permKey, effect) => {
    if (!access) return;
    setSavingOverride(true);
    const res = await setUserOverride(access.user.id, { perm_key: permKey, effect });
    setSavingOverride(false);
    if (res.success) {
      setOverridePerm(null);
      loadAccess(access.user.id);
    } else {
      toast.error(res.message || 'Could not save override');
    }
  };

  const overrideFor = (permKey) =>
    access && (access.overrides || []).find((o) => o.perm_key === permKey);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Per-user access
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="close drawer">
          <CloseIcon />
        </IconButton>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Assign roles or override single permissions for one user. A
        &lsquo;deny&rsquo; override always wins.
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" disabled={searching || query.trim().length < 2}>
          {searching ? <CircularProgress size={20} /> : 'Search'}
        </Button>
      </Box>

      {!access && results.length > 0 && (
        <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          {results.map((row) => (
            <Tooltip
              key={row.profile_id}
              title={row.user_id ? '' : 'No login account — promote this profile first'}
            >
              <span>
                <ListItemButton onClick={() => handlePick(row)} disabled={!row.user_id}>
                  <ListItemText
                    primary={row.profile_name}
                    secondary={`${row.parish || '—'} · ${row.phone || ''}${row.username ? ` · @${row.username}` : ''}`}
                  />
                </ListItemButton>
              </span>
            </Tooltip>
          ))}
        </List>
      )}

      {loadingAccess && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {access && !loadingAccess && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>{access.user.username}</strong> — system role: {access.user.role}
          </Alert>
          <Button size="small" onClick={resetSelection} sx={{ mb: 2 }}>
            ← Pick another user
          </Button>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Assigned roles
          </Typography>
          {(access.roles || []).length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No extra roles assigned.
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {(access.roles || []).map((role) => (
              <Chip
                key={role.id}
                label={
                  role.scope_type === 'diocese'
                    ? role.label
                    : `${role.label} · ${role.scope_type}: ${role.scope_ref || '—'}`
                }
                onDelete={() => handleRemoveRole(role.id)}
                deleteIcon={<DeleteIcon />}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              select
              size="small"
              label="Role"
              value={assignRoleId}
              onChange={(e) => setAssignRoleId(e.target.value)}
              sx={{ flex: 1 }}
            >
              {(roles || []).map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Scope"
              value={assignScopeType}
              onChange={(e) => setAssignScopeType(e.target.value)}
              sx={{ width: 120 }}
            >
              {SCOPE_TYPES.map((scope) => (
                <MenuItem key={scope} value={scope}>
                  {scope}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          {assignScopeType !== 'diocese' && (
            <TextField
              size="small"
              fullWidth
              label={`${assignScopeType} name`}
              value={assignScopeRef}
              onChange={(e) => setAssignScopeRef(e.target.value)}
              sx={{ mb: 1 }}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={handleAssign}
            disabled={!assignRoleId || assigning}
            sx={{ mb: 2 }}
          >
            {assigning ? 'Assigning…' : 'Assign role'}
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Permission overrides
          </Typography>
          {(access.overrides || []).map((override) => (
            <Box
              key={override.perm_key}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Chip
                size="small"
                color={override.effect === 'allow' ? 'success' : 'error'}
                label={override.effect}
              />
              <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
                {override.perm_key}
              </Typography>
              <Button
                size="small"
                disabled={savingOverride}
                onClick={() => applyOverride(override.perm_key, null)}
              >
                Clear
              </Button>
            </Box>
          ))}

          <Autocomplete
            size="small"
            options={permissions || []}
            getOptionLabel={(option) => `${option.perm_key} — ${option.label}`}
            value={overridePerm}
            onChange={(_, value) => setOverridePerm(value)}
            renderInput={(params) => (
              <TextField {...params} label="Add override for permission" sx={{ my: 1 }} />
            )}
          />
          {overridePerm && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={(overrideFor(overridePerm.perm_key) || {}).effect || null}
              onChange={(_, effect) => effect && applyOverride(overridePerm.perm_key, effect)}
              disabled={savingOverride}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="allow" color="success">
                Allow
              </ToggleButton>
              <ToggleButton value="deny" color="error">
                Deny
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Effective permissions ({(access.effective_permissions || []).length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(access.effective_permissions || []).map((permKey) => (
              <Chip key={permKey} size="small" variant="outlined" label={permKey} />
            ))}
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default UserAccessDrawer;
