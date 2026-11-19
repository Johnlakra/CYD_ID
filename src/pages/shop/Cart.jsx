import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import MoneyText from '../../components/shop/MoneyText';
import EmptyState from '../../components/shop/EmptyState';
import shopApi from '../../api/shopApi';
import { formatMoney } from '../../utils/money';
import {
  getCart,
  applyLookup,
  getCartGroupedByShop,
  getGroupSubtotal,
  getCartTotal,
  updateCartQuantity,
  removeFromCart,
} from '../../utils/cart';

const Cart = ({ navigate }) => {
  const theme = useTheme();
  const [groups, setGroups] = useState(getCartGroupedByShop());

  const refresh = () => setGroups(getCartGroupedByShop());

  const [changes, setChanges] = useState([]);

  useEffect(() => {
    window.addEventListener('cyd-cart-updated', refresh);
    return () => window.removeEventListener('cyd-cart-updated', refresh);
  }, []);

  // Prices in the cart were saved when items were added; refresh them from the server.
  useEffect(() => {
    const ids = getCart().map((i) => i.product_id);
    if (ids.length === 0) return;
    shopApi
      .lookupProducts(ids)
      .then((res) => setChanges(applyLookup(res.data.products || []).changes))
      .catch(() => {});
  }, []);

  const isEmpty = groups.length === 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Your Cart
      </Typography>

      {changes.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setChanges([])}>
          {changes
            .map((c) =>
              c.type === 'removed'
                ? `"${c.title}" is no longer available and was removed.`
                : c.type === 'price'
                  ? `"${c.title}" now costs ${formatMoney(c.to)} (was ${formatMoney(c.from)}).`
                  : `Only ${c.to} of "${c.title}" are available.`
            )
            .join(' ')}
        </Alert>
      )}

      {isEmpty ? (
        <EmptyState
          icon={<CartIcon fontSize="inherit" />}
          title="Your cart is empty"
          subtitle="Browse the marketplace to find something you like."
          actionLabel="Browse Marketplace"
          onAction={() => navigate('marketplace')}
        />
      ) : (
        <>
          {groups.map((group) => (
            <Box
              key={group.shop_id}
              sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {group.shop_name}
              </Typography>
              {group.items.map((item) => (
                <Box
                  key={item.product_id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'grey.100',
                      flexShrink: 0,
                    }}
                  >
                    {item.image_url && (
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {item.title}
                    </Typography>
                    <MoneyText paise={item.price_paise} variant="body2" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                    <IconButton size="small" aria-label={`Decrease quantity of ${item.title}`} onClick={() => updateCartQuantity(item.product_id, item.quantity - 1) && refresh()}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ px: 1.5 }}>{item.quantity}</Typography>
                    <IconButton size="small" aria-label={`Increase quantity of ${item.title}`} onClick={() => updateCartQuantity(item.product_id, item.quantity + 1) && refresh()}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Remove ${item.title} from cart`}
                    onClick={() => {
                      removeFromCart(item.product_id);
                      refresh();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <MoneyText paise={getGroupSubtotal(group)} variant="subtitle1" />
              </Box>
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Grand Total
              </Typography>
              <MoneyText paise={getCartTotal()} variant="h5" />
            </Box>
            <Button variant="contained" size="large" onClick={() => navigate('checkout')} sx={{ borderRadius: 2, px: 4 }}>
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Cart;
