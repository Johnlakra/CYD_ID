import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Storefront as StorefrontIcon,
  ImageNotSupported as NoImageIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import MoneyText from '../../components/shop/MoneyText';
import EmptyState from '../../components/shop/EmptyState';
import { addToCart } from '../../utils/cart';

const ProductDetail = ({ productId, navigate }) => {
  const theme = useTheme();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    shopApi
      .getProductById(productId)
      .then((res) => setProduct(res.data.product))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load product'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = (goToCart) => {
    if (!product) return;
    const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0];
    addToCart(
      {
        product_id: product.id,
        title: product.title,
        price_paise: product.price_paise,
        image_url: primaryImage?.image_url,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        stock_quantity: product.stock_quantity,
      },
      quantity
    );
    toast.success('Added to cart');
    if (goToCart) navigate('cart');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return <EmptyState title="Product not found" />;
  }

  const images = product.images?.length ? product.images : [null];
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('marketplace')} sx={{ mb: 2 }}>
        Back
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              height: 360,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {images[activeImage]?.image_url ? (
              <img
                src={images[activeImage].image_url}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <NoImageIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
            )}
          </Box>
          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {images.map((img, idx) => (
                <Box
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: idx === activeImage ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  }}
                >
                  {img?.image_url && (
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, cursor: 'pointer', color: 'primary.main' }}
            onClick={() => navigate('shop', { shopId: product.shop_id })}
          >
            <StorefrontIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {product.shop_name}
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {product.title}
          </Typography>

          <MoneyText paise={product.price_paise} comparePaise={product.compare_at_price_paise} variant="h4" />

          <Box sx={{ my: 2 }}>
            {outOfStock ? (
              <Chip label="Out of stock" color="error" size="small" />
            ) : (
              <Chip label={`${product.stock_quantity} in stock`} color="success" variant="outlined" size="small" />
            )}
          </Box>

          {product.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
              {product.description}
            </Typography>
          )}

          {!outOfStock && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="body2">Quantity</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                  <IconButton size="small" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 2 }}>{quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CartIcon />}
                  onClick={() => handleAddToCart(false)}
                  sx={{ borderRadius: 2 }}
                >
                  Add to Cart
                </Button>
                <Button variant="contained" size="large" onClick={() => handleAddToCart(true)} sx={{ borderRadius: 2 }}>
                  Buy Now
                </Button>
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetail;
