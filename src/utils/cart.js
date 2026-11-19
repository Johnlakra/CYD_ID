// Client-side cart, persisted in localStorage per signed-in user, so two people sharing a browser
// never see each other's cart. There is no cart API; prices here are only a preview and are
// re-checked against the server (/shop/products/lookup) at checkout.
const LEGACY_SHARED_KEY = 'cyd_shop_cart';

const currentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.id ? user.id : null;
  } catch {
    return null;
  }
};

export const cartKeyFor = (userId) => `cyd_shop_cart:${userId || 'guest'}`;

const cartKey = () => cartKeyFor(currentUserId());

export const getCart = () => {
  try {
    // The old shared cart could belong to anyone who used this browser, so it is dropped.
    if (localStorage.getItem(LEGACY_SHARED_KEY) !== null) {
      localStorage.removeItem(LEGACY_SHARED_KEY);
    }
    const raw = localStorage.getItem(cartKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  try {
    localStorage.setItem(cartKey(), JSON.stringify(items));
  } catch {
    // Storage full or blocked: the cart simply won't persist.
  }
  window.dispatchEvent(new Event('cyd-cart-updated'));
  return items;
};

const clampQuantity = (quantity, stock) => {
  const max = Number.isFinite(stock) && stock > 0 ? Math.min(stock, 99) : 99;
  return Math.max(1, Math.min(quantity, max));
};

export const addToCart = (item, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((i) => i.product_id === item.product_id);
  if (existing) {
    existing.quantity = clampQuantity(existing.quantity + quantity, item.stock_quantity ?? existing.stock_quantity);
  } else {
    cart.push({
      product_id: item.product_id,
      title: item.title,
      price_paise: item.price_paise,
      image_url: item.image_url,
      shop_id: item.shop_id,
      shop_name: item.shop_name,
      stock_quantity: item.stock_quantity,
      quantity: clampQuantity(quantity, item.stock_quantity),
    });
  }
  return saveCart(cart);
};

export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (item) {
    item.quantity = clampQuantity(quantity, item.stock_quantity);
  }
  return saveCart(cart);
};

export const removeFromCart = (productId) => saveCart(getCart().filter((i) => i.product_id !== productId));

export const clearCartForShop = (shopId) => saveCart(getCart().filter((i) => i.shop_id !== shopId));

export const clearCart = () => saveCart([]);

// Removes the given user's cart; called on logout.
export const clearCartForUser = (userId) => {
  try {
    localStorage.removeItem(cartKeyFor(userId));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('cyd-cart-updated'));
};

// Replace cart lines with fresh server data from /shop/products/lookup. Unavailable products are
// removed; prices, stock and shop names are refreshed; quantities are clamped to stock.
// Returns { cart, changes } where changes describe what moved, for showing to the buyer.
export const applyLookup = (products) => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const changes = [];
  const next = [];
  getCart().forEach((item) => {
    const fresh = byId.get(item.product_id);
    if (!fresh || !fresh.available) {
      changes.push({ type: 'removed', title: item.title });
      return;
    }
    const updated = {
      ...item,
      title: fresh.title,
      price_paise: fresh.price_paise,
      stock_quantity: fresh.stock_quantity,
      shop_id: fresh.shop_id,
      shop_name: fresh.shop_name,
      image_url: fresh.image_url || item.image_url,
      accepts_upi: Boolean(fresh.accepts_upi),
    };
    if (fresh.price_paise !== item.price_paise) {
      changes.push({ type: 'price', title: fresh.title, from: item.price_paise, to: fresh.price_paise });
    }
    const clamped = clampQuantity(item.quantity, fresh.stock_quantity);
    if (clamped !== item.quantity) {
      changes.push({ type: 'quantity', title: fresh.title, from: item.quantity, to: clamped });
      updated.quantity = clamped;
    }
    next.push(updated);
  });
  saveCart(next);
  return { cart: next, changes };
};

export const getCartCount = () => getCart().reduce((sum, i) => sum + i.quantity, 0);

export const groupCartByShop = (cart) => {
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shop_id]) {
      groups[item.shop_id] = { shop_id: item.shop_id, shop_name: item.shop_name, accepts_upi: item.accepts_upi, items: [] };
    }
    groups[item.shop_id].items.push(item);
  });
  return Object.values(groups);
};

export const getCartGroupedByShop = () => groupCartByShop(getCart());

export const getGroupSubtotal = (group) => group.items.reduce((sum, i) => sum + i.price_paise * i.quantity, 0);

export const getCartTotal = () => getCart().reduce((sum, i) => sum + i.price_paise * i.quantity, 0);
