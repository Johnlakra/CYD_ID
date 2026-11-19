import { addToCart, getCart, getCartCount, clearCartForUser, applyLookup, cartKeyFor, updateCartQuantity } from './cart';

const signIn = (id) => localStorage.setItem('user', JSON.stringify({ id, username: `u${id}` }));
const item = { product_id: 1, title: 'Rosary', price_paise: 10000, shop_id: 7, shop_name: 'Youth Shop', stock_quantity: 5 };

beforeEach(() => localStorage.clear());

test('each signed-in user has their own cart', () => {
  signIn(1);
  addToCart(item, 2);
  expect(getCartCount()).toBe(2);

  signIn(2);
  expect(getCart()).toEqual([]);
  addToCart({ ...item, product_id: 2 }, 1);
  expect(getCartCount()).toBe(1);

  signIn(1);
  expect(getCart().map((i) => i.product_id)).toEqual([1]);
});

test('the old shared cart key is dropped instead of being shown to whoever signs in', () => {
  localStorage.setItem('cyd_shop_cart', JSON.stringify([{ ...item, quantity: 3 }]));
  signIn(9);
  expect(getCart()).toEqual([]);
  expect(localStorage.getItem('cyd_shop_cart')).toBeNull();
});

test('logout clears only that user\'s cart', () => {
  signIn(1);
  addToCart(item, 1);
  signIn(2);
  addToCart(item, 1);
  clearCartForUser(1);
  expect(localStorage.getItem(cartKeyFor(1))).toBeNull();
  expect(getCartCount()).toBe(1);
});

test('quantities are limited by stock', () => {
  signIn(1);
  addToCart(item, 4);
  addToCart(item, 4);
  expect(getCart()[0].quantity).toBe(5);
  updateCartQuantity(1, 0);
  expect(getCart()[0].quantity).toBe(1);
});

test('server lookup refreshes prices, clamps quantities and removes unavailable items', () => {
  signIn(1);
  addToCart(item, 4);
  addToCart({ ...item, product_id: 2, title: 'Candle' }, 1);
  const { cart, changes } = applyLookup([
    { id: 1, title: 'Rosary', price_paise: 12000, stock_quantity: 2, shop_id: 7, shop_name: 'Youth Shop', accepts_upi: true, available: true },
    { id: 2, title: 'Candle', price_paise: 500, stock_quantity: 0, shop_id: 7, shop_name: 'Youth Shop', accepts_upi: true, available: false },
  ]);
  expect(cart).toHaveLength(1);
  expect(cart[0]).toMatchObject({ price_paise: 12000, quantity: 2, accepts_upi: true });
  expect(changes.map((c) => c.type).sort()).toEqual(['price', 'quantity', 'removed']);
  expect(getCart()).toEqual(cart);
});
