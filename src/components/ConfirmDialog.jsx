import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

// Shared destructive-action confirm dialog. Reused everywhere a delete /
// un-allot / un-register happens. Confirm button is always color="error".
//
// Props:
//   open        : boolean
//   title       : ReactNode      — short headline ("Remove youth?")
//   body        : ReactNode      — main description shown above the warning
//   warning     : ReactNode|null — optional MUI Alert content (cascade text)
//   confirmText : string         — default "Confirm"
//   cancelText  : string         — default "Cancel"
//   loading     : boolean        — disables both buttons and shows spinner
//   onClose     : () => void
//   onConfirm   : () => void
const ConfirmDialog = ({
  open,
  title,
  body,
  warning = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof body === 'string' ? (
          <Typography variant="body2">{body}</Typography>
        ) : (
          body
        )}
        {warning && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {warning}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ minHeight: 44 }}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ minHeight: 44 }}
        >
          {loading ? 'Working…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
