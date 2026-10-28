import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Divider,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import MoneyText from '../../components/shop/MoneyText';
import AddressForm from '../../components/shop/AddressForm';
import { getCartGroupedByShop, getGroupSubtotal, clearCartForShop } from '../../utils/cart';

const Checkout = ({ navigate }) => {
  const theme = useTheme();
  const [groups] = useState(getCartGroupedByShop());
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);

  const loadAddresses = () => {
    setLoadingAddresses(true);
    shopApi
      .getAddresses()
      .then((res) => {
        const list = res.data.addresses || [];
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.is_default) || list[0];
          setSelectedAddressId(def.id);
        } else {
          setShowAddressForm(true);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load addresses'))
      .finally(() => setLoadingAddresses(false));
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = async (form) => {
    try {
      const res = await shopApi.createAddress(form);
      toast.success('Address added');
      setShowAddressForm(false);
      setSelectedAddressId(res.data.address.id);
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    if (groups.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setPlacing(true);
    const createdOrders = [];
    try {
      for (const group of groups) {
        const res = await shopApi.placeOrder({
          shop_id: group.shop_id,
          address_id: selectedAddressId,
          items: group.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          payment_method: paymentMethod,
        });
        createdOrders.push(res.data.order);
        clearCartForShop(group.shop_id);
      }

      const firstUpiOrder = createdOrders.find((o) => o.payment_method === 'upi' || paymentMethod === 'upi');
      if (firstUpiOrder) {
        navigate('payment', { orderId: firstUpiOrder.id });
      } else {
        navigate('order-confirmation', { orderId: createdOrders[0].id });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (groups.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Your cart is empty.{' '}
        <Button onClick={() => navigate('marketplace')}>Go to Marketplace</Button>
      </Alert>
    );
  }

  const grandTotal = groups.reduce((sum, g) => sum + getGroupSubtotal(g), 0);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Checkout
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Delivery Address
      </Typography>
      {loadingAddresses ? (
        <CircularProgress size={24} />
      ) : (
        <Box sx={{ mb: 3 }}>
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              onClick={() => setSelectedAddressId(addr.id)}
              sx={{
                borderRadius: 3,
                mb: 1.5,
                cursor: 'pointer',
                border: `2px solid ${selectedAddressId === addr.id ? theme.palette.primary.main : theme.palette.divider}`,
                bgcolor: selectedAddressId === addr.id ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
              }}
            >
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {addr.full_name} · {addr.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {showAddressForm ? (
            <Card sx={{ borderRadius: 3, p: 2, mt: 1 }}>
              <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
            </Card>
          ) : (
            <Button startIcon={<AddIcon />} onClick={() => setShowAddressForm(true)} sx={{ mt: 1 }}>
              Add New Address
            </Button>
          )}
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Payment Method
      </Typography>
      <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ mb: 3 }}>
        <FormControlLabel value="upi" control={<Radio />} label="UPI (pay online now)" />
        <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery" />
      </RadioGroup>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Order Summary
      </Typography>
      {groups.map((group) => (
        <Box key={group.shop_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {group.shop_name} ({group.items.length} item{group.items.length > 1 ? 's' : ''})
          </Typography>
          <MoneyText paise={getGroupSubtotal(group)} variant="body2" />
        </Box>
      ))}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Total</Typography>
        <MoneyText paise={grandTotal} variant="h5" />
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handlePlaceOrder}
        disabled={placing || !selectedAddressId}
        startIcon={placing ? <CircularProgress size={18} /> : null}
        sx={{ borderRadius: 2, py: 1.5 }}
      >
        {placing ? 'Placing Order...' : 'Place Order'}
      </Button>
    </Box>
  );
};

export default Checkout;
