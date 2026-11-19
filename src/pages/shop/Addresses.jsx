import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Button, Chip, CircularProgress } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import AddressForm from '../../components/shop/AddressForm';
import EmptyState from '../../components/shop/EmptyState';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'new' | address object | null

  const load = () => {
    setLoading(true);
    shopApi
      .getAddresses()
      .then((res) => setAddresses(res.data.addresses || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (form) => {
    try {
      if (editing && editing !== 'new') {
        await shopApi.updateAddress(editing.id, form);
        toast.success('Address updated');
      } else {
        await shopApi.createAddress(form);
        toast.success('Address added');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await shopApi.deleteAddress(id);
      toast.success('Address deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My Addresses
        </Typography>
        {editing === null && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')} sx={{ borderRadius: 2 }}>
            Add Address
          </Button>
        )}
      </Box>

      {editing && (
        <Card sx={{ borderRadius: 3, p: 2, mb: 3 }}>
          <AddressForm
            initial={editing === 'new' ? undefined : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            submitLabel={editing === 'new' ? 'Add Address' : 'Update Address'}
          />
        </Card>
      )}

      {addresses.length === 0 && !editing ? (
        <EmptyState icon={<LocationIcon fontSize="inherit" />} title="No addresses saved" />
      ) : (
        addresses.map((addr) => (
          <Card key={addr.id} sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {addr.full_name}
                  </Typography>
                  {!!addr.is_default && <Chip label="Default" size="small" color="primary" />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {addr.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                </Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => setEditing(addr)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(addr.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default Addresses;
