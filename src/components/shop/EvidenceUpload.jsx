import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Link, Alert } from '@mui/material';
import { UploadFile as UploadIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';
import { resizeImageToDataUrl } from '../../utils/image';

const KIND_LABEL = { payment_proof: 'Payment screenshot', refund_proof: 'Refund screenshot', other: 'File' };

// Screenshots stay private: the server returns short-lived signed links visible only to the buyer,
// the seller, and an admin reviewing a dispute.
const EvidenceUpload = ({ orderId, viewerRole, canUpload, onUploaded }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    shopApi
      .getEvidence(orderId)
      .then((res) => {
        setItems(res.data.evidence || []);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load files')))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const image = await resizeImageToDataUrl(file);
      const kind = viewerRole === 'buyer' ? 'payment_proof' : 'refund_proof';
      await shopApi.addEvidence(orderId, image, kind);
      toast.success('Screenshot uploaded');
      load();
      onUploaded?.();
    } catch (err) {
      toast.error(err.response ? apiErrorMessage(err) : err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      {loading ? (
        <CircularProgress size={20} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No screenshots uploaded.
        </Typography>
      ) : (
        items.map((item) => (
          <Typography key={item.id} variant="body2" sx={{ mb: 0.5 }}>
            <Link href={item.url} target="_blank" rel="noopener noreferrer">
              {KIND_LABEL[item.kind] || 'File'}
            </Link>{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              by {item.uploader_username} · {new Date(item.created_at).toLocaleString()}
            </Typography>
          </Typography>
        ))
      )}
      {canUpload && (
        <Button
          variant="outlined"
          component="label"
          size="small"
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          disabled={uploading}
          sx={{ mt: 1.5, borderRadius: 2 }}
        >
          {viewerRole === 'buyer' ? 'Upload payment screenshot' : 'Upload refund screenshot'}
          <input type="file" hidden accept="image/*" onChange={handleFile} />
        </Button>
      )}
    </Box>
  );
};

export default EvidenceUpload;
