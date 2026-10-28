import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
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
import {
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

  useEffect(() => {
    window.addEventListener('cyd-cart-updated', refresh);
    return () => window.removeEventListener('cyd-cart-updated', refresh);
  }, []);

  const isEmpty = groups.length === 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Your Cart
      </Typography>

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
                    <IconButton size="small" onClick={() => updateCartQuantity(item.product_id, item.quantity - 1) && refresh()}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ px: 1.5 }}>{item.quantity}</Typography>
                    <IconButton size="small" onClick={() => updateCartQuantity(item.product_id, item.quantity + 1) && refresh()}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
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
