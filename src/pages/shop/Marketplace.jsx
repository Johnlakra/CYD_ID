import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  CircularProgress,
  Pagination,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import ProductCard from '../../components/shop/ProductCard';
import EmptyState from '../../components/shop/EmptyState';

const Marketplace = ({ navigate }) => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi.getCategories().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shopApi.getProducts({
        page,
        limit: 12,
        category_id: activeCategory || undefined,
        q: search || undefined,
      });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Box>
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          CYD Marketplace
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
          Support youth groups and parishes across the diocese - shop what they make and sell.
        </Typography>
        <TextField
          fullWidth
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{
            maxWidth: 480,
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          onClick={() => {
            setActiveCategory(null);
            setPage(1);
          }}
          color={!activeCategory ? 'primary' : 'default'}
          variant={!activeCategory ? 'filled' : 'outlined'}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => {
              setActiveCategory(cat.id);
              setPage(1);
            }}
            color={activeCategory === cat.id ? 'primary' : 'default'}
            variant={activeCategory === cat.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<StorefrontIcon fontSize="inherit" />}
          title="No products found"
          subtitle="Try a different search or category."
        />
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard
                  product={product}
                  onOpenProduct={(id) => navigate('product', { productId: id })}
                  onOpenShop={(shopId) => navigate('shop', { shopId })}
                />
              </Grid>
            ))}
          </Grid>
          {pagination && pagination.total_pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.total_pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Marketplace;
