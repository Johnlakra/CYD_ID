// Permission Matrix (Platform Phase 3, Pillar C). Roles × permissions grid
// grouped by module with instant checkbox toggles, search, custom roles
// (create/duplicate/delete) and a per-user override drawer. The admin system
// role is immutable — it always resolves to every permission. Gating existing
// Jalandhar screens is untouched; this matrix drives NEW ui.*/resource.action
// keys enforced by the backend permission engine.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  ManageAccounts as ManageAccountsIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  createRole,
  deleteRole,
  duplicateRole,
  getPermissionMatrix,
  setRolePermissions,
} from '../../api/platformApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  groupByModule,
  isValidRoleKey,
  matchesPermissionSearch,
  moduleLabel,
  toggleKey,
} from '../../utils/permissionKeys';
import UserAccessDrawer from './UserAccessDrawer';

const isAdminSystemRole = (role) => !!role.is_system && role.role_key === 'admin';

const PermissionMatrix = ({ onLogout }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [grid, setGrid] = useState({}); // roleId -> [perm_key]
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingRoleId, setSavingRoleId] = useState(null);
  // Role dialog state: { mode: 'create' } | { mode: 'duplicate', source } | null
  const [roleDialog, setRoleDialog] = useState(null);
  const [roleKeyDraft, setRoleKeyDraft] = useState('');
  const [roleLabelDraft, setRoleLabelDraft] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null); // { el, role }
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    const res = await getPermissionMatrix();
    setLoading(false);
    if (res.success) {
      setPermissions(res.data.permissions || []);
      setRoles(res.data.roles || []);
      setGrid(res.data.grid || {});
    } else {
      if (res.status === 401 && onLogout) onLogout();
      toast.error(res.message || 'Failed to load permission matrix');
    }
  }, [onLogout]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const visibleModules = useMemo(() => {
    const filtered = permissions.filter((permission) =>
      matchesPermissionSearch(permission, search)
    );
    return groupByModule(filtered);
  }, [permissions, search]);

  const hasKey = (role, permKey) => (grid[role.id] || []).includes(permKey);

  const handleToggle = async (role, permKey) => {
    if (isAdminSystemRole(role) || savingRoleId) return;
    const previous = grid[role.id] || [];
    const next = toggleKey(previous, permKey);
    setGrid((current) => ({ ...current, [role.id]: next }));
    setSavingRoleId(role.id);
    const res = await setRolePermissions(role.id, next);
    setSavingRoleId(null);
    if (!res.success) {
      setGrid((current) => ({ ...current, [role.id]: previous }));
      toast.error(res.message || 'Could not update role permissions');
    }
  };

  const openRoleDialog = (dialog) => {
    setRoleDialog(dialog);
    setRoleKeyDraft('');
    setRoleLabelDraft(dialog.mode === 'duplicate' ? `${dialog.source.label} (copy)` : '');
  };

  const handleSaveRole = async () => {
    const roleKey = roleKeyDraft.trim().toLowerCase();
    const label = roleLabelDraft.trim();
    if (!isValidRoleKey(roleKey) || label.length < 2) return;
    setSavingRole(true);
    const res =
      roleDialog.mode === 'duplicate'
        ? await duplicateRole(roleDialog.source.id, { role_key: roleKey, label })
        : await createRole({ role_key: roleKey, label });
    setSavingRole(false);
    if (res.success) {
      toast.success(res.message || 'Role saved');
      setRoleDialog(null);
      fetchMatrix();
    } else {
      toast.error(res.message || 'Could not save role');
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteRole(deleteTarget.id);
    setDeleting(false);
    if (res.success) {
      toast.success('Role deleted');
      setDeleteTarget(null);
      fetchMatrix();
    } else {
      toast.error(res.message || 'Could not delete role');
    }
  };

  const roleKeyError =
    roleKeyDraft.trim() !== '' && !isValidRoleKey(roleKeyDraft.trim().toLowerCase());

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Grant or revoke any capability per role — including single tabs and
          buttons (the <code>ui.*</code> keys). Use the drawer for one-off
          per-user overrides.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search permissions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          startIcon={<ManageAccountsIcon />}
          onClick={() => setDrawerOpen(true)}
        >
          Per-user overrides
        </Button>
        <Button startIcon={<RefreshIcon />} onClick={fetchMatrix} disabled={loading}>
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openRoleDialog({ mode: 'create' })}
        >
          New role
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 280, fontWeight: 600 }}>Permission</TableCell>
                  {roles.map((role) => (
                    <TableCell key={role.id} align="center" sx={{ minWidth: 130 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {role.label}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={role.is_system ? 'system' : 'custom'}
                            color={role.is_system ? 'default' : 'primary'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                        {isAdminSystemRole(role) ? (
                          <Tooltip title="The admin role always has every permission">
                            <LockIcon fontSize="small" color="disabled" />
                          </Tooltip>
                        ) : (
                          <IconButton
                            size="small"
                            aria-label={`options for ${role.label}`}
                            onClick={(e) => setMenuAnchor({ el: e.currentTarget, role })}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleModules.map((group) => (
                  <React.Fragment key={group.module}>
                    <TableRow>
                      <TableCell
                        colSpan={roles.length + 1}
                        sx={{ bgcolor: 'grey.100', fontWeight: 600, py: 0.75 }}
                      >
                        {moduleLabel(group.module)}
                      </TableCell>
                    </TableRow>
                    {group.permissions.map((permission) => (
                      <TableRow key={permission.perm_key} hover>
                        <TableCell>
                          <Typography variant="body2">{permission.label}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                          >
                            {permission.perm_key}
                          </Typography>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={role.id} align="center" padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={isAdminSystemRole(role) || hasKey(role, permission.perm_key)}
                              disabled={isAdminSystemRole(role) || savingRoleId === role.id}
                              onChange={() => handleToggle(role, permission.perm_key)}
                              inputProps={{
                                'aria-label': `${role.label} — ${permission.perm_key}`,
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {visibleModules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={roles.length + 1} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No permissions match “{search}”.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Menu
        anchorEl={menuAnchor?.el}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            openRoleDialog({ mode: 'duplicate', source: menuAnchor.role });
            setMenuAnchor(null);
          }}
        >
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} /> Duplicate role
        </MenuItem>
        {!menuAnchor?.role?.is_system && (
          <MenuItem
            onClick={() => {
              setDeleteTarget(menuAnchor.role);
              setMenuAnchor(null);
            }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete role
          </MenuItem>
        )}
      </Menu>

      <Dialog open={!!roleDialog} onClose={() => setRoleDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {roleDialog?.mode === 'duplicate'
            ? `Duplicate “${roleDialog.source.label}”`
            : 'New custom role'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Role key"
            helperText={
              roleKeyError
                ? 'Lowercase letters, numbers, underscores (2–60 chars)'
                : 'e.g. parish_president'
            }
            error={roleKeyError}
            value={roleKeyDraft}
            onChange={(e) => setRoleKeyDraft(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Display label"
            value={roleLabelDraft}
            onChange={(e) => setRoleLabelDraft(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(null)} disabled={savingRole}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={
              savingRole ||
              !isValidRoleKey(roleKeyDraft.trim().toLowerCase()) ||
              roleLabelDraft.trim().length < 2
            }
          >
            {savingRole ? 'Saving…' : roleDialog?.mode === 'duplicate' ? 'Duplicate' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete role?"
        body={`"${deleteTarget?.label}" will be removed.`}
        warning="Users holding this role lose the permissions it granted."
        confirmText="Delete"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRole}
      />

      <UserAccessDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        roles={roles}
        permissions={permissions}
      />
    </Box>
  );
};

export default PermissionMatrix;
