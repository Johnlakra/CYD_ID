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
import { apiErrorMessage } from '../../utils/apiError';
import { getCartCount } from '../../utils/cart';

import Marketplace from './Marketplace';
import ShopStorefront from './ShopStorefront';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Checkout from './Checkout';
import PayOrder from './PayOrder';
import PayCheckout from './PayCheckout';
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
const SUB_VIEWS = new Set(['shop', 'product', 'checkout', 'pay', 'pay-checkout', 'order-confirmation', 'order-detail']);

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
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load your shop')))
      .finally(() => setLoadingShop(false));
  }, []);

  // Re-check every time "My Shop" is opened, so an approval or suspension shows up without a reload.
  useEffect(() => {
    if (view.name === 'my-shop') loadMyShop();
  }, [view.name, loadMyShop]);

  const activeTabIndex = SUB_VIEWS.has(view.name)
    ? -1
    : TOP_TABS.findIndex((t) => t.name === view.name);

  const renderMyShop = () => {
    if (myShop === undefined || (loadingShop && myShop === null)) {
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
      // A suspended shop can't sell, but must still ship or refund the orders it already took.
      return (
        <Box>
          <Alert severity="warning" sx={{ borderRadius: 2, mb: 3 }}>
            Your shop "<strong>{myShop.name}</strong>" has been suspended
            {myShop.rejection_reason ? <>: {myShop.rejection_reason}</> : ''}. It is hidden from the marketplace and its
            unpaid orders were cancelled. Please finish (or refund) the orders below and contact an admin.
          </Alert>
          <MyShopDashboard shop={myShop} onShopUpdated={setMyShop} navigate={navigate} ordersOnly />
        </Box>
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
      case 'pay':
        return <PayOrder orderId={view.params.orderId} navigate={navigate} />;
      case 'pay-checkout':
        return <PayCheckout checkoutId={view.params.checkoutId} navigate={navigate} />;
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
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
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
