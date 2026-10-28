import React, { useEffect, useState, useCallback } from 'react';
import { Box, Tabs, Tab, Badge, CircularProgress, Alert } from '@mui/material';
import {
  Storefront as MarketplaceIcon,
  ShoppingCart as CartIcon,
  ReceiptLong as OrdersIcon,
  LocationOn as AddressIcon,
  Sell as SellIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import { getCartCount } from '../../utils/cart';

import Marketplace from './Marketplace';
import ShopStorefront from './ShopStorefront';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Checkout from './Checkout';
import PaymentProcessing from './PaymentProcessing';
import OrderConfirmation from './OrderConfirmation';
import MyOrders from './MyOrders';
import OrderDetail from './OrderDetail';
import Addresses from './Addresses';
import BecomeSeller from './BecomeSeller';
import MyShopDashboard from './MyShopDashboard';

// Top-level tabs that are always reachable. Sub-views (product detail, checkout, payment, etc.)
// are reached by navigating from within a tab and show a "Back" affordance of their own instead
// of living in this tab bar.
const TOP_TABS = [
  { name: 'marketplace', label: 'Marketplace', icon: <MarketplaceIcon fontSize="small" /> },
  { name: 'cart', label: 'Cart', icon: <CartIcon fontSize="small" /> },
  { name: 'orders', label: 'My Orders', icon: <OrdersIcon fontSize="small" /> },
  { name: 'my-shop', label: 'My Shop', icon: <SellIcon fontSize="small" /> },
  { name: 'addresses', label: 'Addresses', icon: <AddressIcon fontSize="small" /> },
];

// Views reachable only by drilling in from a tab (not shown in the tab bar itself).
const SUB_VIEWS = new Set(['shop', 'product', 'checkout', 'payment', 'order-confirmation', 'order-detail']);

const ShopApp = ({ authToken, user }) => {
  const [view, setView] = useState({ name: 'marketplace', params: {} });
  const [cartCount, setCartCount] = useState(getCartCount());
  const [myShop, setMyShop] = useState(undefined); // undefined = loading, null = none, object = has one
  const [loadingShop, setLoadingShop] = useState(true);

  const navigate = useCallback((name, params = {}) => {
    setView({ name, params });
  }, []);

  useEffect(() => {
    const refreshCount = () => setCartCount(getCartCount());
    window.addEventListener('cyd-cart-updated', refreshCount);
    return () => window.removeEventListener('cyd-cart-updated', refreshCount);
  }, []);

  const loadMyShop = useCallback(() => {
    setLoadingShop(true);
    shopApi
      .getMyShop()
      .then((res) => setMyShop(res.data.shop))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load your shop'))
      .finally(() => setLoadingShop(false));
  }, []);

  useEffect(() => {
    if (view.name === 'my-shop' && myShop === undefined) {
      loadMyShop();
    }
  }, [view.name, myShop, loadMyShop]);

  const activeTabIndex = SUB_VIEWS.has(view.name)
    ? -1
    : TOP_TABS.findIndex((t) => t.name === view.name);

  const renderMyShop = () => {
    if (loadingShop || myShop === undefined) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!myShop) {
      return <BecomeSeller onApplied={loadMyShop} />;
    }

    if (myShop.status === 'pending') {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Your application for "<strong>{myShop.name}</strong>" is pending review. We'll let you
          know once an admin approves it.
        </Alert>
      );
    }

    if (myShop.status === 'rejected') {
      return (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Your application for "<strong>{myShop.name}</strong>" was rejected.
          {myShop.rejection_reason && <> Reason: {myShop.rejection_reason}</>} Please contact an
          admin if you'd like to reapply.
        </Alert>
      );
    }

    if (myShop.status === 'suspended') {
      return (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Your shop "<strong>{myShop.name}</strong>" has been suspended. Please contact an admin
          for details.
        </Alert>
      );
    }

    return <MyShopDashboard shop={myShop} onShopUpdated={setMyShop} navigate={navigate} />;
  };

  const renderView = () => {
    switch (view.name) {
      case 'shop':
        return <ShopStorefront shopId={view.params.shopId} navigate={navigate} />;
      case 'product':
        return <ProductDetail productId={view.params.productId} navigate={navigate} />;
      case 'cart':
        return <Cart navigate={navigate} />;
      case 'checkout':
        return <Checkout navigate={navigate} />;
      case 'payment':
        return <PaymentProcessing orderId={view.params.orderId} navigate={navigate} />;
      case 'order-confirmation':
        return <OrderConfirmation orderId={view.params.orderId} navigate={navigate} />;
      case 'orders':
        return <MyOrders navigate={navigate} />;
      case 'order-detail':
        return (
          <OrderDetail
            orderId={view.params.orderId}
            navigate={navigate}
            currentUserId={user?.id}
            backView={view.params.backView || 'orders'}
          />
        );
      case 'addresses':
        return <Addresses />;
      case 'my-shop':
        return renderMyShop();
      default:
        return <Marketplace navigate={navigate} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs
        value={activeTabIndex === -1 ? false : activeTabIndex}
        onChange={(_, idx) => navigate(TOP_TABS[idx].name)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TOP_TABS.map((t) => (
          <Tab
            key={t.name}
            icon={
              t.name === 'cart' ? (
                <Badge badgeContent={cartCount} color="primary" max={99}>
                  {t.icon}
                </Badge>
              ) : (
                t.icon
              )
            }
            iconPosition="start"
            label={t.label}
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>

      {renderView()}
    </Box>
  );
};

export default ShopApp;
