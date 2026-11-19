import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { apiErrorMessage } from '../../utils/apiError';
import { formatMoney } from '../../utils/money';
import MoneyText from '../../components/shop/MoneyText';
import AddressForm from '../../components/shop/AddressForm';
import { getCart, applyLookup, groupCartByShop, getGroupSubtotal, clearCartForShop } from '../../utils/cart';

const newIdempotencyKey = () =>
  `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const describeChange = (c) => {
  if (c.type === 'removed') return `"${c.title}" is no longer available and was removed.`;
  if (c.type === 'price') return `"${c.title}" now costs ${formatMoney(c.to)} (was ${formatMoney(c.from)}).`;
  return `Only ${c.to} of "${c.title}" are available; quantity updated.`;
};

const Checkout = ({ navigate }) => {
  const theme = useTheme();
  const [groups, setGroups] = useState([]);
  const [changes, setChanges] = useState([]);
  const [validating, setValidating] = useState(true);
  const [validateError, setValidateError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [methods, setMethods] = useState({});
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  // One key per checkout attempt. It is kept after a failed request so a retry can't create a
  // second set of orders; it is replaced only when the cart or choices change.
  const idempotencyKey = useRef(newIdempotencyKey());

  const revalidate = useCallback(async () => {
    setValidating(true);
    setValidateError(null);
    const cart = getCart();
    if (cart.length === 0) {
      setGroups([]);
      setValidating(false);
      return;
    }
    try {
      const res = await shopApi.lookupProducts(cart.map((i) => i.product_id));
      const result = applyLookup(res.data.products || []);
      setChanges(result.changes);
      const fresh = groupCartByShop(result.cart);
      setGroups(fresh);
      setMethods((prev) => {
        const next = {};
        fresh.forEach((g) => {
          next[g.shop_id] = g.accepts_upi ? prev[g.shop_id] || 'upi' : 'cod';
        });
        return next;
      });
      if (result.changes.length) idempotencyKey.current = newIdempotencyKey();
    } catch (err) {
      setValidateError(apiErrorMessage(err, 'Could not check current prices'));
    } finally {
      setValidating(false);
    }
  }, []);

  const loadAddresses = useCallback((selectId) => {
    setLoadingAddresses(true);
    shopApi
      .getAddresses()
      .then((res) => {
        const list = res.data.addresses || [];
        setAddresses(list);
        setSelectedAddressId((current) => {
          if (selectId) return selectId;
          if (current && list.some((a) => a.id === current)) return current;
          const def = list.find((a) => a.is_default) || list[0];
          return def ? def.id : null;
        });
        if (list.length === 0) setShowAddressForm(true);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load addresses')))
      .finally(() => setLoadingAddresses(false));
  }, []);

  useEffect(() => {
    revalidate();
    loadAddresses();
  }, [revalidate, loadAddresses]);

  const handleAddAddress = async (form) => {
    try {
      const res = await shopApi.createAddress(form);
      toast.success('Address added');
      setShowAddressForm(false);
      loadAddresses(res.data.address.id);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add address'));
    }
  };

  const setMethod = (shopId, method) => {
    setMethods((m) => ({ ...m, [shopId]: method }));
    idempotencyKey.current = newIdempotencyKey();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please choose a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const items = groups.flatMap((g) => g.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));
      const res = await shopApi.checkout(
        { address_id: selectedAddressId, items, payment_methods: methods },
        idempotencyKey.current
      );
      const { orders, checkout_id: checkoutId } = res.data;
      orders.forEach((o) => clearCartForShop(o.shop_id));
      idempotencyKey.current = newIdempotencyKey();

      const upiOrders = orders.filter((o) => o.payment_method === 'upi');
      if (upiOrders.length === 1 && orders.length === 1) navigate('pay', { orderId: upiOrders[0].id });
      else if (upiOrders.length >= 1) navigate('pay-checkout', { checkoutId });
      else navigate('order-confirmation', { orderId: orders[0].id, checkoutId });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to place order'));
      // Prices or stock may have changed; show the current state. A network error keeps the same
      // idempotency key, so pressing Place Order again can't duplicate the order.
      if (err.response) revalidate();
    } finally {
      setPlacing(false);
    }
  };

  if (validating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking current prices and stock…
        </Typography>
      </Box>
    );
  }

  if (validateError) {
    return (
      <Alert severity="error" action={<Button onClick={revalidate}>Retry</Button>} sx={{ borderRadius: 2 }}>
        {validateError}
      </Alert>
    );
  }

  if (groups.length === 0) {
    return (
      <Box>
        {changes.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {changes.map(describeChange).join(' ')}
          </Alert>
        )}
        <Alert severity="info" sx={{ borderRadius: 2 }} action={<Button onClick={() => navigate('marketplace')}>Browse</Button>}>
          Your cart is empty.
        </Alert>
      </Box>
    );
  }

  const grandTotal = groups.reduce((sum, g) => sum + getGroupSubtotal(g), 0);
  const upiCount = groups.filter((g) => methods[g.shop_id] === 'upi').length;

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Checkout
      </Typography>

      {changes.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {changes.map(describeChange).join(' ')}
        </Alert>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Delivery address
      </Typography>
      {loadingAddresses ? (
        <CircularProgress size={24} />
      ) : (
        <Box sx={{ mb: 3 }}>
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              role="radio"
              aria-checked={selectedAddressId === addr.id}
              tabIndex={0}
              onClick={() => setSelectedAddressId(addr.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedAddressId(addr.id)}
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
                  {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}
                  {addr.city}, {addr.state} - {addr.pincode}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {showAddressForm ? (
            <Card sx={{ borderRadius: 3, p: 2, mt: 1 }}>
              <AddressForm onSubmit={handleAddAddress} onCancel={addresses.length ? () => setShowAddressForm(false) : undefined} />
            </Card>
          ) : (
            <Button startIcon={<AddIcon />} onClick={() => setShowAddressForm(true)} sx={{ mt: 1 }}>
              Add new address
            </Button>
          )}
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Payment, per shop
      </Typography>
      {groups.length > 1 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Your cart has items from {groups.length} shops, so it becomes {groups.length} separate orders. Each shop is paid separately.
        </Alert>
      )}
      {groups.map((group) => (
        <Card key={group.shop_id} sx={{ borderRadius: 3, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {group.shop_name}
              </Typography>
              <MoneyText paise={getGroupSubtotal(group)} variant="subtitle2" />
            </Box>
            {group.items.map((item) => (
              <Typography key={item.product_id} variant="body2" color="text.secondary">
                {item.title} × {item.quantity} — {formatMoney(item.price_paise * item.quantity)}
              </Typography>
            ))}
            <RadioGroup
              row
              value={methods[group.shop_id] || 'cod'}
              onChange={(e) => setMethod(group.shop_id, e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="upi"
                control={<Radio />}
                label="UPI — pay the seller directly"
                disabled={!group.accepts_upi}
              />
              <FormControlLabel value="cod" control={<Radio />} label="Cash on delivery" />
            </RadioGroup>
            {!group.accepts_upi && (
              <Typography variant="caption" color="text.secondary">
                This shop only accepts cash on delivery.
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Total</Typography>
        <MoneyText paise={grandTotal} variant="h5" />
      </Box>
      {upiCount > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          After placing the order you'll have 30 minutes to pay each UPI order to the seller's UPI ID.
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handlePlaceOrder}
        disabled={placing || !selectedAddressId}
        startIcon={placing ? <CircularProgress size={18} color="inherit" /> : null}
        sx={{ borderRadius: 2, py: 1.5 }}
      >
        {placing ? 'Placing order…' : 'Place order'}
      </Button>
    </Box>
  );
};

export default Checkout;
