import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Avatar, CircularProgress, Button, useTheme, alpha } from '@mui/material';
import { ArrowBack as BackIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import ProductCard from '../../components/shop/ProductCard';
import EmptyState from '../../components/shop/EmptyState';

const ShopStorefront = ({ shopId, navigate }) => {
  const theme = useTheme();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([shopApi.getShopById(shopId), shopApi.getProducts({ shop_id: shopId, limit: 50 })])
      .then(([shopRes, productsRes]) => {
        if (!active) return;
        setShop(shopRes.data.shop);
        setProducts(productsRes.data.products || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load shop'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [shopId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shop) {
    return <EmptyState icon={<StorefrontIcon fontSize="inherit" />} title="Shop not found" />;
  }

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('marketplace')} sx={{ mb: 2 }}>
        Back to Marketplace
      </Button>

      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 3,
          background: shop.banner_url
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.7)}, ${alpha(theme.palette.primary.main, 0.5)}), url(${shop.banner_url})`
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Avatar src={shop.logo_url} sx={{ width: 72, height: 72, bgcolor: 'white', color: 'primary.main' }}>
          <StorefrontIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {shop.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {[shop.parish, shop.deanery].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </Box>

      {shop.description && (
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          {shop.description}
        </Typography>
      )}

      {products.length === 0 ? (
        <EmptyState title="No products yet" subtitle="This shop hasn't listed any products." />
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} onOpenProduct={(id) => navigate('product', { productId: id })} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ShopStorefront;
