// Client-side cart, persisted in localStorage. There is no cart API - the backend only knows
// about orders, created once per shop at checkout time.
const CART_KEY = 'cyd_shop_cart';

export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cyd-cart-updated'));
  return items;
};

export const addToCart = (item, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((i) => i.product_id === item.product_id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product_id: item.product_id,
      title: item.title,
      price_paise: item.price_paise,
      image_url: item.image_url,
      shop_id: item.shop_id,
      shop_name: item.shop_name,
      stock_quantity: item.stock_quantity,
      quantity,
    });
  }
  return saveCart(cart);
};

export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  return saveCart(cart);
};

export const removeFromCart = (productId) => {
  const cart = getCart().filter((i) => i.product_id !== productId);
  return saveCart(cart);
};

export const clearCartForShop = (shopId) => {
  const cart = getCart().filter((i) => i.shop_id !== shopId);
  return saveCart(cart);
};

export const clearCart = () => saveCart([]);

export const getCartCount = () => getCart().reduce((sum, i) => sum + i.quantity, 0);

export const getCartGroupedByShop = () => {
  const cart = getCart();
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shop_id]) {
      groups[item.shop_id] = { shop_id: item.shop_id, shop_name: item.shop_name, items: [] };
    }
    groups[item.shop_id].items.push(item);
  });
  return Object.values(groups);
};

export const getGroupSubtotal = (group) =>
  group.items.reduce((sum, i) => sum + i.price_paise * i.quantity, 0);

export const getCartTotal = () => getCart().reduce((sum, i) => sum + i.price_paise * i.quantity, 0);
