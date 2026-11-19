#!/usr/bin/env node
// seed-dev-data.js - fills a LOCAL CYD backend with realistic test data through its real API,
// so the mobile app can be developed and tested against every role and screen.
//
// Usage:   node tools/seed-dev-data.js [baseUrl]            (default http://127.0.0.1:3000)
// Needs:   Node 18+ (global fetch) and a running backend whose database was created with
//          `npm run init-db` (creates admin / admin123) and `npm start` (shop migrations).
// Safe to re-run: existing users/shops are reused; it never deletes anything.
// NEVER point this at production: it logs in as the default admin and creates accounts.
//
// Test accounts it creates (all passwords: Passw0rd1)
//   admin     admin / admin123            (from init-db; change it anywhere real!)
//   manager   cydmanager                  role "user" - creates and manages ID-card profiles
//   seller    seller1   -> shop "St. Mary's Youth Shop" (approved, UPI stmarysyouth@okaxis)
//   seller2   seller2   -> shop "Holy Family Candles" (approved, COD only: no UPI id)
//   buyer     buyer1    (default delivery address)
//   holder    created by profile "Anil Masih" -> username printed at the end (password = phone)
const BASE = (process.argv[2] || process.env.CYD_API || 'http://127.0.0.1:3000').replace(/\/$/, '');
const PASSWORD = 'Passw0rd1';

async function call(method, path, body, token, extraHeaders = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

async function must(method, path, body, token, extraHeaders) {
  const r = await call(method, path, body, token, extraHeaders);
  if (!r.json || !r.json.success) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.data;
}

async function loginOrCreate(admin, username, role = 'user') {
  let r = await call('POST', '/auth/login', { username, password: PASSWORD });
  if (r.status === 200) return r.json.data;
  await must('POST', '/auth/register', { username, email: `${username}@test.local`, password: PASSWORD, role }, admin.token);
  return must('POST', '/auth/login', { username, password: PASSWORD });
}

async function main() {
  console.log(`Seeding ${BASE} ...`);
  const health = await call('GET', '/health');
  if (health.status !== 200) throw new Error(`Backend not reachable at ${BASE} (GET /health -> ${health.status})`);

  const admin = await must('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  const manager = await loginOrCreate(admin, 'cydmanager', 'user');
  const seller1 = await loginOrCreate(admin, 'seller1');
  const seller2 = await loginOrCreate(admin, 'seller2');
  const buyer = await loginOrCreate(admin, 'buyer1');

  // Shops (one per user). Approve through the admin API.
  const shops = [];
  for (const [owner, name, upi] of [
    [seller1, "St. Mary's Youth Shop", 'stmarysyouth@okaxis'],
    [seller2, 'Holy Family Candles', ''],
  ]) {
    let shop = (await must('GET', '/shop/shops/mine', null, owner.token)).shop;
    if (!shop) {
      shop = (await must('POST', '/shop/shops/apply', {
        name, contact_phone: '9876543210', parish: "St. Mary's", deanery: 'Jalandhar City',
        description: 'Rosaries, candles and youth retreat T-shirts made by the parish youth.', ...(upi ? { upi_id: upi } : {}),
      }, owner.token)).shop;
    }
    if (shop.status !== 'approved') await must('PUT', `/shop/admin/shops/${shop.id}/review`, { status: 'approved' }, admin.token);
    shops.push({ owner, shop });
  }

  // Products (skip if the shop already has some)
  const catalogue = [
    [0, [['Wooden Rosary', 150, 20, 1], ['Retreat T-shirt', 349.5, 10, 3], ['Youth Day Cap', 220, 0, 3]]],
    [1, [['Beeswax Candle (set of 4)', 280, 15, 5], ['Advent Wreath', 650, 5, 5]]],
  ];
  const categories = (await must('GET', '/shop/categories', null, buyer.token)).categories;
  for (const [idx, items] of catalogue) {
    const { owner, shop } = shops[idx];
    const existing = (await must('GET', '/shop/products/mine', null, owner.token)).products;
    if (existing.length) continue;
    for (const [title, price, stock, cat] of items) {
      await must('POST', '/shop/products', {
        title, price, stock_quantity: stock, status: 'active', category_id: categories[cat - 1]?.id,
        description: `${title}: handmade by the youth of ${shop.name}.`,
      }, owner.token);
    }
  }

  // Buyer address
  const addresses = (await must('GET', '/shop/addresses', null, buyer.token)).addresses;
  if (!addresses.length) {
    await must('POST', '/shop/addresses', {
      full_name: 'Anil Masih', phone: '9000000001', line1: 'Church Road', city: 'Jalandhar', state: 'Punjab', pincode: '144001', is_default: true,
    }, buyer.token);
  }

  // One ID-card profile (creates a profile_holder login; password = phone)
  let holderLine = 'holder     anil1304 / 9000000001   (created on the first run; password is the phone number)';
  const existing = await call('GET', '/profiles?search=Anil%20Masih&limit=1', null, manager.token);
  if (!(existing.json && existing.json.data && existing.json.data.profiles && existing.json.data.profiles.length)) {
    const created = await must('POST', '/profiles', {
      name: 'Anil Masih', father_name: 'Joseph Masih', mother_name: 'Mary Masih', date_of_birth: '2001-04-13',
      date_of_baptism: '2001-06-24', issue_date: new Date().toISOString().slice(0, 10),
      qualification: 'B.Sc. Computer Science', phone: '9000000001', involvement: '2018',
      deanery: 'Jalandhar City', parish: shops[0].shop.parish || "St. Mary's", level: 'parish', designation: 'Member',
      postal_address: 'Church Road, Jalandhar City, Punjab 144001',
      // No photo: uploads go to Cloudinary, which a local backend only has if CLOUDINARY_* is set in
      // its .env. The backend accepts a profile without a photo (the app's own form still requires
      // one). Add a photo from the app once Cloudinary is configured to test uploads and the card.
    }, manager.token);
    holderLine = `holder login -> username: ${created.credentials.username}  password: ${created.credentials.password}`;
  }

  console.log('\nDone. Log in from the app with:');
  console.log('  admin      admin / admin123');
  console.log(`  manager    cydmanager / ${PASSWORD}   (role: user)`);
  console.log(`  seller     seller1 / ${PASSWORD}      (shop with UPI)`);
  console.log(`  seller 2   seller2 / ${PASSWORD}      (COD-only shop)`);
  console.log(`  buyer      buyer1 / ${PASSWORD}`);
  console.log(`  ${holderLine}`);
}

main().catch((e) => { console.error('\nSeed failed:', e.message); process.exit(1); });
