import React from 'react';
import { Card, CardContent, CardMedia, Box, Typography, useTheme, alpha } from '@mui/material';
import { Storefront as StorefrontIcon, ImageNotSupported as NoImageIcon } from '@mui/icons-material';
import MoneyText from './MoneyText';

const ProductCard = ({ product, onOpenProduct, onOpenShop }) => {
  const theme = useTheme();
  const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0];

  return (
    <Card
      sx={{
        borderRadius: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
      onClick={() => onOpenProduct(product.id)}
    >
      {primaryImage ? (
        <CardMedia component="img" height="160" image={primaryImage.image_url} alt={product.title} sx={{ objectFit: 'cover' }} />
      ) : (
        <Box
          sx={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <NoImageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
          {product.title}
        </Typography>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary' }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenShop?.(product.shop_id);
          }}
        >
          <StorefrontIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" noWrap>
            {product.shop_name}
          </Typography>
        </Box>
        <Box sx={{ mt: 'auto' }}>
          <MoneyText paise={product.price_paise} comparePaise={product.compare_at_price_paise} variant="subtitle1" />
          {product.stock_quantity <= 0 && (
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
              Out of stock
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
