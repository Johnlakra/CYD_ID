# Running the CYD backend locally for app development

The app talks to the real CYD backend (`Johnlakra/cyd_Id_BE`). Develop against a **local copy**, never
against production data. Everything below was run and verified while writing this kit (backend on
Node 22, MariaDB 10.11; the backend's CI also passes on MySQL 8.0).

## 1. Prerequisites
- Node.js 18+ (22 recommended) and npm
- MariaDB 10.11+ or MySQL 8.0+ running locally, with a user that can create a database
- (Optional but needed for photo features) a free Cloudinary account — see "Photos" below

## 2. Get the backend
```bash
git clone https://github.com/Johnlakra/cyd_Id_BE.git
cd cyd_Id_BE
# The shop with peer-to-peer UPI payments lives on this branch until its PR is merged to main:
git checkout claude/happy-bell-oy6or2        # (use `main` once PR #1 and the security hotfix PR #2 are merged)
npm install
```

## 3. Database
```sql
CREATE DATABASE cyd_dev CHARACTER SET utf8mb4;
CREATE USER 'cyd'@'localhost' IDENTIFIED BY 'cydpass';
GRANT ALL ON cyd_dev.* TO 'cyd'@'localhost';
```

## 4. Configuration — create `.env` in the backend folder
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cyd
DB_PASSWORD=cydpass
DB_NAME=cyd_dev
JWT_SECRET=change-me-to-any-long-random-string
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development

# Photos (profile photos, shop logos, product images, payment screenshots) are uploaded to Cloudinary.
# Without real values every upload fails with "Cloudinary upload failed". Everything else works.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Shorter timers make the payment flow testable in minutes (production defaults in brackets)
PAY_WINDOW_MINUTES=3        # [30]  buyer must pay + submit the UTR
# default 10 — silent extra time before an unpaid order is cancelled
PAY_GRACE_MINUTES=1
# default 24 — seller must confirm before the buyer may dispute (minimum 1 hour)
CONFIRM_WINDOW_HOURS=1
# default 24 — buyer's time to upload proof after "not received" (minimum 1 hour)
DISPUTE_PROOF_HOURS=1
```

## 5. Create tables and start
```bash
npm run init-db     # creates users + profile tables and the default admin: admin / admin123
npm start           # applies the shop schema/migrations, then starts the API on :3000
curl http://127.0.0.1:3000/health        # -> {"success":true,"message":"Server is running",...}
```
Order matters: `init-db` once first, then `npm start` (which also re-runs migrations on every start).

## 6. Seed realistic test data
```bash
node <this-kit>/tools/seed-dev-data.js http://127.0.0.1:3000
```
Creates (and prints) logins for every role: admin, a `user`-role ID-card manager, two sellers (one
with a UPI ID, one COD-only), a buyer with a saved address, a profile holder, two approved shops with
five products. Safe to re-run.

## 7. Pointing the Flutter app at it
| Where the app runs | Base URL |
|---|---|
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://127.0.0.1:3000` |
| Physical phone on the same Wi‑Fi | `http://<your-computer-LAN-IP>:3000` (allow port 3000 in the firewall) |
| Production | `https://cyd-id-be.onrender.com` (Render free tier sleeps: the first request after idle can take 30–60 s) |

Pass it as `--dart-define=API_BASE_URL=...` (see docs/01-ARCHITECTURE.md). Plain `http://` needs a
dev-only exception: Android `usesCleartextTraffic` in a **debug** manifest and iOS App Transport
Security for the dev host. Never ship either in a release build. CORS does not apply to mobile apps.

## 8. Testing the payment flow with real timers
1. Log in as `buyer1`, add a product from `St. Mary's Youth Shop`, check out with UPI.
2. Copy the UPI ID, "pay" (nothing real happens: any 12-digit number works as the UTR, e.g. `401234567890`) and submit it.
3. Log in as `seller1` → My shop → Orders → open the order → confirm the payment.
4. To test expiry: place a UPI order and wait `PAY_WINDOW_MINUTES + PAY_GRACE_MINUTES` — the order cancels itself and stock returns.
5. Disputes: have `seller1` choose "Payment not received", then log in as `admin` → Shop disputes to resolve.

## 9. Things that will confuse you (all expected)
- **429 "Too many failed login attempts"**: 10 wrong passwords for one username in 15 minutes. Restart the backend to reset it while developing.
- **A new admin cannot be created from the app until you are logged in as an admin**: `POST /auth/register` is admin-only by design (security fix).
- **Photos fail locally** until Cloudinary is configured. Profile creation works without a photo through the API, but the app's form requires one.
- **Stats include deleted profiles** (`/profiles/stats` does not filter by status) — a backend quirk, documented in docs/05-API-CONTRACT.md.
- **Backend tests** (optional): `npm test` needs a throwaway database and `TEST_DB_HOST/PORT/USER/PASSWORD/NAME` variables (see the backend's `tests/setup/env.js`).

## Running the app on a physical Android phone (USB)
`10.0.2.2` is the **emulator's** alias for the host machine; on a real phone it reaches nothing. Forward the port over USB and point the app at `localhost`:
```bash
adb reverse tcp:3000 tcp:3000          # repeat after each reconnect / reboot
flutter run --dart-define=API_BASE_URL=http://localhost:3000 --dart-define=FLAVOR=dev
```
Verified at M0 (2026-11-20) on an Android 14 phone: the debug "Backend health" screen shows `OK: Server is running`.
