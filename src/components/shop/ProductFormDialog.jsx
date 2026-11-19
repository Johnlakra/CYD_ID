import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  MenuItem,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import EncodeBase64 from '../EncodeBase64';

const EMPTY = {
  title: '',
  description: '',
  price: '',
  compare_at_price: '',
  stock_quantity: '',
  category_id: '',
  status: 'active',
};

const ProductFormDialog = ({ open, onClose, onSubmit, categories, initial }) => {
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]); // base64 strings or existing URLs
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        price: initial.price_paise ? (initial.price_paise / 100).toString() : '',
        compare_at_price: initial.compare_at_price_paise ? (initial.compare_at_price_paise / 100).toString() : '',
        stock_quantity: initial.stock_quantity?.toString() || '0',
        category_id: initial.category_id || '',
        status: initial.status || 'active',
      });
      setImages((initial.images || []).map((i) => i.image_url));
    } else {
      setForm(EMPTY);
      setImages([]);
    }
  }, [initial, open]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - images.length);
    try {
      const encoded = await Promise.all(files.map((f) => EncodeBase64(f)));
      setImages((prev) => [...prev, ...encoded].slice(0, 6));
    } catch {
      toast.error('Failed to process one or more images');
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.title || !form.price || form.stock_quantity === '') {
      toast.error('Title, price, and stock quantity are required');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : undefined,
        stock_quantity: parseInt(form.stock_quantity, 10),
        category_id: form.category_id || undefined,
        images: images.length ? images : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit Product' : 'Add Product'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Title" value={form.title} onChange={set('title')} required />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={set('description')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Price (₹)" type="number" value={form.price} onChange={set('price')} required />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Compare-at Price (₹)" type="number" value={form.compare_at_price} onChange={set('compare_at_price')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Stock Quantity" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} required />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Category" value={form.category_id} onChange={set('category_id')}>
              <MenuItem value="">None</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth select label="Status" value={form.status} onChange={set('status')}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" component="label" size="small" disabled={images.length >= 6}>
              Add Images ({images.length}/6)
              <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
            </Button>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {images.map((img, idx) => (
                <Box key={idx} sx={{ position: 'relative', width: 64, height: 64 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  <IconButton
                    size="small"
                    onClick={() => removeImage(idx)}
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          {initial ? 'Save Changes' : 'Add Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
