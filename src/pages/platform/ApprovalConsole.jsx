// Diocese Approvals console (Platform Phase 1, S2). super_admin only.
// Lists registrations by status; approve activates the diocese and shows the
// auto-created admin credentials once; suspend doubles as reject (the backend
// exposes approve + suspend only — no separate reject endpoint).

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import {
  CheckCircleOutline as ApproveIcon,
  BlockOutlined as SuspendIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  ChurchOutlined as ChurchIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { listDioceses, approveDiocese, suspendDiocese } from '../../api/platformApi';
import { dioceseStatusChip } from '../../utils/platformHelpers';
import ConfirmDialog from '../../components/ConfirmDialog';

const STATUS_TABS = ['pending', 'active', 'suspended'];

const ApprovalConsole = ({ onLogout }) => {
  const [statusTab, setStatusTab] = useState(0);
  const [dioceses, setDioceses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null); // diocese row
  const [approving, setApproving] = useState(false);
  const [credentials, setCredentials] = useState(null); // { name, username, password_hint }
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspending, setSuspending] = useState(false);

  const status = STATUS_TABS[statusTab];

  const fetchDioceses = useCallback(async () => {
    setLoading(true);
    const res = await listDioceses({ status });
    setLoading(false);
    if (res.success) {
      setDioceses(res.data.dioceses || []);
    } else {
      if (res.status === 401 && onLogout) onLogout();
      toast.error(res.message || 'Failed to load dioceses');
    }
  }, [status, onLogout]);

  useEffect(() => {
    fetchDioceses();
  }, [fetchDioceses]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    const res = await approveDiocese(approveTarget.id);
    setApproving(false);

    if (res.success) {
      setCredentials({
        name: approveTarget.name,
        username: res.data.admin.username,
        created: res.data.admin.created,
        password_hint: res.data.admin.password_hint,
        contact_phone: approveTarget.contact_phone,
      });
      setApproveTarget(null);
      fetchDioceses();
    } else {
      toast.error(res.message || 'Approval failed');
      setApproveTarget(null);
      fetchDioceses();
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    const res = await suspendDiocese(suspendTarget.id);
    setSuspending(false);
    setSuspendTarget(null);

    if (res.success) {
      toast.success('Diocese suspended');
      fetchDioceses();
    } else {
      toast.error(res.message || 'Suspend failed');
    }
  };

  const copyText = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error('Copy failed'));
  };

  const headers = ['Diocese', 'Contact', 'Registered', 'Status', 'Actions'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        Diocese Approvals
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review diocese registrations, activate new dioceses and manage platform access
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)}>
              {STATUS_TABS.map((s) => (
                <Tab
                  key={s}
                  label={dioceseStatusChip(s).label}
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
            <Button
              variant="outlined"
              onClick={fetchDioceses}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : dioceses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No {status} dioceses
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  dioceses.map((row) => {
                    const chip = dioceseStatusChip(row.status);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={row.logo_url || ''}
                              sx={{ mr: 1.5, width: 40, height: 40 }}
                            >
                              <ChurchIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {row.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.slug}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.contact_email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.contact_phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.created_at
                            ? dayjs(row.created_at).format('DD/MM/YYYY h:mm A')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={chip.label} color={chip.color} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {row.status !== 'active' && (
                              <Tooltip title="Approve & activate">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => setApproveTarget(row)}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {row.id !== 1 && row.status !== 'suspended' && (
                              <Tooltip
                                title={
                                  row.status === 'pending'
                                    ? 'Reject (suspend) this registration'
                                    : 'Suspend diocese'
                                }
                              >
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setSuspendTarget(row)}
                                >
                                  <SuspendIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Approve confirmation */}
      <Dialog
        open={!!approveTarget}
        onClose={approving ? undefined : () => setApproveTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Approve diocese?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{approveTarget?.name}</strong> will be activated. An administrator
            account <strong>{approveTarget?.slug}.admin</strong> is created
            automatically with the registered contact phone as its password.
          </Typography>
          <Alert severity="info">
            Share the credentials with the diocese contact —
            they are shown only once after approval.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveTarget(null)} disabled={approving}>
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={handleApprove}
            disabled={approving}
            startIcon={
              approving ? <CircularProgress size={16} color="inherit" /> : <ApproveIcon />
            }
          >
            {approving ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials shown once after approval */}
      <Dialog
        open={!!credentials}
        onClose={() => setCredentials(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Diocese activated</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{credentials?.name}</strong> is now active.
            {credentials?.created
              ? ' Admin account created:'
              : ' An admin account already existed:'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'grey.100',
              borderRadius: 2,
              px: 2,
              py: 1,
              mb: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {credentials?.username}
            </Typography>
            <Tooltip title="Copy username">
              <IconButton size="small" onClick={() => copyText(credentials?.username)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {credentials?.created && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Password: the diocese&apos;s registered contact phone
              {credentials?.contact_phone ? (
                <>
                  {' '}
                  (<strong>{credentials.contact_phone}</strong>)
                </>
              ) : null}
              . Ask the admin to change it after first login.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setCredentials(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend / reject confirmation */}
      <ConfirmDialog
        open={!!suspendTarget}
        title={
          suspendTarget?.status === 'pending' ? 'Reject registration?' : 'Suspend diocese?'
        }
        body={
          suspendTarget?.status === 'pending'
            ? `${suspendTarget?.name} will be marked suspended and cannot sign in.`
            : `${suspendTarget?.name} will lose platform access until re-approved.`
        }
        warning="You can re-activate later with the Approve action."
        confirmText={suspendTarget?.status === 'pending' ? 'Reject' : 'Suspend'}
        loading={suspending}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspend}
      />
    </Box>
  );
};

export default ApprovalConsole;
