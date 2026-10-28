import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Storefront as StorefrontIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import MoneyText from '../../components/shop/MoneyText';
import OrderStatusChip from '../../components/shop/OrderStatusChip';
import EmptyState from '../../components/shop/EmptyState';
import ProductFormDialog from '../../components/shop/ProductFormDialog';
import EncodeBase64 from '../../components/EncodeBase64';

const MyShopDashboard = ({ shop, onShopUpdated, navigate }) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  // --- Profile tab state ---
  const [profileForm, setProfileForm] = useState({
    name: shop.name,
    description: shop.description || '',
    parish: shop.parish || '',
    deanery: shop.deanery || '',
    contact_phone: shop.contact_phone || '',
    upi_id: shop.upi_id || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await shopApi.updateMyShop(profileForm);
      toast.success('Shop profile updated');
      onShopUpdated?.(res.data.shop);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shop');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await EncodeBase64(file);
      const res = await shopApi.updateMyShop({ logo: base64 });
      toast.success('Logo updated');
      onShopUpdated?.(res.data.shop);
    } catch {
      toast.error('Failed to update logo');
    }
  };

  // --- Products tab state ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = () => {
    setLoadingProducts(true);
    shopApi
      .getMyProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load products'))
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => {
    loadProducts();
    shopApi.getCategories().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  const handleProductSubmit = async (payload) => {
    try {
      if (editingProduct) {
        await shopApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated');
      } else {
        await shopApi.createProduct(payload);
        toast.success('Product added');
      }
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
      throw err;
    }
  };

  const handleArchive = async (id) => {
    try {
      await shopApi.archiveProduct(id);
      toast.success('Product archived');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive product');
    }
  };

  // --- Orders tab state ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (tab !== 2) return;
    setLoadingOrders(true);
    shopApi
      .getShopOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load orders'))
      .finally(() => setLoadingOrders(false));
  }, [tab]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar src={shop.logo_url} sx={{ width: 56, height: 56 }}>
          <StorefrontIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {shop.name}
          </Typography>
          <Chip label="Approved" color="success" size="small" />
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Shop Profile" />
        <Tab label="Products" />
        <Tab label="Orders" />
      </Tabs>

      {tab === 0 && (
        <Card sx={{ borderRadius: 4, maxWidth: 640 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" component="label" size="small" startIcon={<PhotoIcon />}>
                Change Logo
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Shop Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={profileForm.description}
                  onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Parish"
                  value={profileForm.parish}
                  onChange={(e) => setProfileForm((p) => ({ ...p, parish: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Deanery"
                  value={profileForm.deanery}
                  onChange={(e) => setProfileForm((p) => ({ ...p, deanery: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={profileForm.contact_phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, contact_phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  value={profileForm.upi_id}
                  onChange={(e) => setProfileForm((p) => ({ ...p, upi_id: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  startIcon={savingProfile ? <CircularProgress size={18} /> : null}
                  sx={{ borderRadius: 2 }}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingProduct(null);
                setDialogOpen(true);
              }}
              sx={{ borderRadius: 2 }}
            >
              Add Product
            </Button>
          </Box>

          {loadingProducts ? (
            <CircularProgress size={24} />
          ) : products.length === 0 ? (
            <EmptyState title="No products yet" subtitle="Add your first product to start selling." />
          ) : (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {product.title}
                        </Typography>
                        <Chip label={product.status} size="small" />
                      </Box>
                      <MoneyText paise={product.price_paise} variant="body1" />
                      <Typography variant="caption" color="text.secondary">
                        Stock: {product.stock_quantity}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingProduct(product);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleArchive(product.id)}>
                          <ArchiveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <ProductFormDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleProductSubmit}
            categories={categories}
            initial={editingProduct}
          />
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {loadingOrders ? (
            <CircularProgress size={24} />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                onClick={() => navigate('order-detail', { orderId: order.id, backView: 'my-shop' })}
                sx={{ borderRadius: 3, mb: 2, cursor: 'pointer', border: `1px solid ${theme.palette.divider}` }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      #{order.order_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customer_username} · {order.items?.length || 0} item(s)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MoneyText paise={order.total_paise} variant="subtitle1" />
                    <OrderStatusChip status={order.status} />
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default MyShopDashboard;
