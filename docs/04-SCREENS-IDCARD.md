# 04 · Screens — ID cards, profiles and account

Every screen here is **Designed here (not in mockup)**: the Claude Design mockup covers the shop only. They use the
mockup's visual language (doc 02: tokens, Anton/Archivo/DM Mono, saffron accent, hairline cards, floating pill tab bar).
Geometry of the printed card itself lives in `07-ID-CARD-RENDERING.md`; this document only places the card on screens.
Endpoints are the real backend paths (`/home/user/cyd_id_be`); the authoritative contract is `05-API-CONTRACT.md`.

## Contents

| § | Screen | Id |
|---|---|---|
| 1 | Conventions used in this document | — |
| 2 | Shell and role-based first tab | ID-02 |
| 3 | Login | ID-01 |
| 4 | My ID (profile holder) | ID-03 |
| 5 | Holder photo update (and the shared photo pipeline) | ID-04 |
| 6 | Profiles list and filter sheet | ID-05, ID-06 |
| 7 | Profile detail | ID-07 |
| 8 | Profile form (create / edit) | ID-08 |
| 9 | Credentials dialog and restore notice | ID-09 |
| 10 | Card preview and export | ID-10 |
| 11 | Delete confirmation | ID-11 |
| 12 | Account (home, information, password, create user, appearance, sign out) | ID-12 … ID-17 |
| 13 | Session-expired, account-disabled and offline states | ID-18 |
| 14 | Role acceptance checklists | — |

---

## 1. Conventions used in this document

**Screen ids.** `ID-01 … ID-18` are stable ids for `design/SCREEN-MAP.md` and the test plan. Every screen below is
**Designed here (not in mockup)** — there is no mockup artboard for any of them; they are derived from the web
app's behaviour and drawn in the mockup's language (`02-DESIGN-SYSTEM.md`, esp. §10).

**Template per screen:** Route · Roles · Purpose · Layout · States · Copy · Interactions · API · Acceptance.

**Roles** (from `user.role` returned by `POST /auth/login`):

| Role value | Meaning in this doc |
|---|---|
| `admin` | CYD Office administrator. Sees every profile, stats, can create users. |
| `user` | Standard user ("CYD manager" in the kit). Sees **only profiles they created**. |
| `profile_holder` | The youth member. Sees only their own profile and card. Created automatically with each profile. |

Any signed-in user can also shop, and an approved seller owns a shop; those are in `03-SCREENS-SHOP.md`. Rows in the
Account screen for the shop are listed here only as navigation entries.

**Universal rules (from doc 01 §10, doc 02):**
- Four states on every data screen: **loading** (skeleton with the real layout, shown after 150 ms), **empty** (dashed card), **error** (dashed card + "Tap to retry"), **data**.
- Mutations disable their button, show an inline 18 px spinner and a progress label; a second tap is ignored.
- A toast confirms every successful mutation. Toast, dialog, sheet, chips, inputs, buttons are the components of doc 02 §9 — measurements are not repeated here unless a screen overrides them.
- Names are displayed through `capitalizeName` (doc 07 §6.1). The backend stores names **lower-cased on create** but **as typed on update**, so mixed case can occur; always run the helper.
- Dates: API dates parsed by `parseApiDate` (doc 07 §7.4). List/validity display `DD/MM/YYYY`; the printed card uses `DD-MM-YYYY`; the form submits `YYYY-MM-DD`.
- Server messages are shown verbatim (they are user-facing English). Validation `errors[]` is a list of plain strings, not keyed by field.
- Screen padding 20 (16 below 360 px). Tab roots keep `130` bottom padding for the floating bar.

**Copy that does not exist on the web** (new strings written for the app) is marked ✎ so the owner can review wording.

**Field-name mismatch (profile).** Write: `father_name`, `mother_name`, `date_of_birth`. Read: `father`, `mother`, `dob`. Photo is `photo` on write
(base64 data URL **or** an existing https URL) and `photo_url` on read. The mapping lives only in the model (`Profile.toRequest()` / `Profile.fromJson()`, doc 08).

---

## 2. Shell and role-based first tab  *(ID-02 · Designed here)*

**Route:** the shell wraps `/id`, `/shop`, `/cart`, `/orders`, `/account` (doc 01 §6). **Roles:** all signed-in users.

**Tab bar:** the floating pill of doc 02 §9.19 with five items in this order. Marks are single letters in Anton 14 (doc 02 §7); the first item changes by role:

| # | `admin` / `user` | `profile_holder` | Mark | Branch root |
|---|---|---|---|---|
| 1 | **Profiles** | **My ID** | `P` / `ID` | `/id` → `ProfilesScreen` (admin, user) or `MyIdScreen` (holder) |
| 2 | Shop | Shop | `S` | `/shop` |
| 3 | Cart | Cart | `₹` | `/cart` |
| 4 | Orders | Orders | `O` | `/orders` |
| 5 | Account | Account | `A` | `/account` |

- The **branch list never changes**; only the root widget of branch 1 and its label/mark are chosen from `session.user.role` (`IdHomeByRole`). The router redirect guard sends a signed-in user from `/login` and `/splash` to `/id`.
- Badges: none on tab 1. Shop/Cart badges per doc 02 §9.19 (shop spec).
- The bar hides on: ID card preview, holder photo, profile form, profile detail, credentials dialog (it is a dialog, bar stays behind the scrim), password and user-creation forms, keyboard open. It shows on `/id` roots and Account root and one-level lists.
- **Role-gated routes** (`/id/profiles/*` for holders; `/account/users/new` for non-admins; `/admin/*` for non-admins): redirect to the branch root with toast ✎ `You don't have access to that screen.`
- Switching tabs keeps each branch's state (`StatefulShellRoute.indexedStack`). Tapping the active tab pops to its root and scrolls to top.
- **Cold start / restore:** `/splash` reads secure storage; token and user present → `/id`; otherwise `/login`. No network call is needed to enter the app; the first data call discovers an expired token (§13).

**Acceptance (all roles):** the first tab is labelled and routed per role; a holder can never reach a profile form by deep link; hardware back at a branch root exits the app and never goes to `/login`.

---

## 3. Login  *(ID-01 · Designed here)*

**Route:** `/login` (public). **Roles:** signed-out only. **API:** `POST /auth/login` for **every** role including holders (the web does the same; `POST /profile-holder/login` exists but is not used).
Body `{ "username": string, "password": string }` — `username` may be a username **or an email address** (backend message: "Username or email is required").
Success → `data.token` (JWT, 24 h, no refresh) and `data.user` (`id, username, email, role, …`); store both in secure storage.

**Layout (390 × 844 reference):**
- Background `bg`. Hero block at the top: `assets/idcard/login-overlay.jpg` as `BoxFit.cover`, opacity **.35** in dark / **.24** in light (the web uses .24), fading to `bg` over the bottom 40 % with a gradient. Height `max(260, 34 % of screen)`.
- Over the hero, bottom-left, `screenPadding`: mono label `CATHOLIC YUVA DHARA · JALANDHAR` (DM Mono 500 9, +.16em, `faint`) then the title **`SIGN IN`** in Anton 40/.95 `ink` (doc 02 §10.8). Under it, Archivo 400 13 `mute`: `Welcome back! Please sign in to your account`.
- Form (scroll area, padding `20`, gap 14): labelled inputs (doc 02 §9.8): `USERNAME` (text, `autofillHints: [username]`, `textInputAction: next`, no auto-capitalisation, no autocorrect), `PASSWORD` (obscured, trailing show/hide toggle 44×44 with semantics "Show password"/"Hide password", `autofillHints: [password]`, `textInputAction: done` submits).
- Primary CTA, height **56**, full width, label `Sign in`; loading: spinner + `Logging in…`. One accent CTA per screen (glow allowed).
- Under the CTA, Archivo 400 12 `mute`, centred ✎: `Profile holders: use the username and password given to you by the CYD Office.`
- Footer: mono 9 `faint` ✎ `v{version}` (from package info; helps support).

**States**
| State | UI |
|---|---|
| Idle | CTA enabled only when both fields are non-empty (the web enables it always; the app also validates on submit) |
| Submitting | fields disabled, CTA loading; keyboard dismissed |
| Wrong credentials (401) | banner under the form (not a toast): `Invalid credentials` — `danger` text on `card` with 1 px `danger` border, radius 14, padding `12 14`, `liveRegion`. Fields keep their values; password field is focused |
| Rate limited (429) | same banner: `Too many failed login attempts. Please try again in 15 minutes.` (server wording). The limiter is **10 failed attempts per 15 min per IP + username**; successful logins do not count. Keep the CTA enabled (the lock is per user name) |
| Empty field on submit | inline field error (doc 02 §9.8): `Username or email is required` / `Password is required` (the backend's messages) |
| Network/timeout | banner `Could not reach the server. Check your connection and try again.` |
| Cold start (first request > 8 s) | secondary line under the CTA ✎ `Waking up the server… this can take up to a minute.`; the request keeps running (receive timeout 30 s; a timeout shows the network banner and the user retries) |
| 5xx / other | banner with the server `message` (`Login failed`) |

**Interactions:** tapping outside dismisses the keyboard. No "forgot password", no registration (accounts are created by CYD Office; see doc 12 for the reset-flow ask). After success: clear any previous user's caches only if the user id differs from the stored last user; navigate to `/id`. No success toast (the screen change is the confirmation); the web's `Login successful!` is dropped.

**Theme:** follows the system until the user picks one in Account → Appearance; the hero overlay is a light image — in dark mode draw it with `BlendMode.softLight` at the opacity above so it does not glow.

**Acceptance:** each seeded account (admin, manager, holder, buyer, seller) signs in and lands on the right first tab; wrong password shows exactly `Invalid credentials`; the 11th wrong attempt for the same username within 15 minutes shows the 15-minute message; password toggle works and is announced; landscape/small-height keeps the CTA reachable (form scrolls); no password text in logs.

---

## 4. My ID  *(ID-03 · Designed here)*

**Route:** `/id` (root of tab 1) · **Roles:** `profile_holder` only (admin/user see Profiles, §6).
**Purpose:** the holder's home: their ID card, whether it is still valid, their details, and a way to change their photo.
This closes a gap in the web app, where the holder dashboard's "view card" button is commented out (improvement I1, doc 00).

**API:** `GET /profile-holder/my-profile` → `data.profile` (all profile columns, read names `father`, `mother`, `dob`, `photo_url`).
`404 {message:"Profile not found"}` when the holder's profile was deleted. **Do not** call `GET /profile-holder/my-id-card` for validity (its rule differs from the web's, doc 07 §7.2) — compute locally. `GET /profiles/:id` is **not** usable by holders (it returns 404 for anyone but admin/creator).
Cache the profile JSON and photo for offline (doc 01 §5); refresh on pull-to-refresh and on screen focus when older than 5 minutes.

**Layout (scroll, padding `20 20 130`):**
1. Title `MY ID` (Anton 40/.95). Subline Archivo 400 13 `mute`: `View your profile information and ID card` (web subtitle).
2. **Card tile.** The ID card widget (doc 07 §11.3) at width `screenWidth − 40` (350 on a 390 screen; aspect 146.3 : 221.8), light always, with a 1 px `line2` border drawn **outside** the capture boundary, radius 12. Tap → `/id/card` (hero transition of the card). Semantics: the card label of doc 07 §13 + "Double tap to open".
3. **Status block** (section label `STATUS`, then a `card` with padding 16): row of the **validity chip** (26 high, doc 02 §3; labels below) and, right-aligned, mono 11 `faint` `Expires {DD/MM/YYYY}`; under it a tinted message box (radius 14, padding 14, the chip's foreground colour at .14 fill, text `ink` Archivo 500 13):

   | Computed state (doc 07 §7) | Chip | Message (verbatim from the web) |
   |---|---|---|
   | valid, `days > 60` | `Valid` (green) | `Your ID card is valid and in good standing.` |
   | valid, `days ≤ 60` | `Expires in {n} days` (amber) | `Your ID card will expire in {n} days. Please contact CYD Office for renewal.` |
   | expired | `Expired` (red) | `Your ID card has expired. Please contact CYD Office for renewal.` |
   | no `issue_date` | no status block at all | — (web behaviour; legacy rows only) |

   > Doc 02 §3.1 names the amber key `expiring` with the label "Expiring soon". For validity chips use the **web label `Expires in {n} days`** instead (doc 07 §7.1); the colour and glyph stay as in doc 02. (Doc 02 should be updated to match.)
4. **Actions:** primary `View full card` (height 56, accent, opens `/id/card`) and, below it, outline `Update photo` (height 50, opens `/id/photo`). Share/save/print live on the preview (§10).
5. **Details** (section label `MY DETAILS`, one `card`, key/value rows doc 02 §9.30, hairlines between):
   name (Anton 24, capitalised) with an info chip `{deanery} · {parish}` (web: `{deanery} - {parish}`), then rows in this order: `Phone` · `Date of Birth` · `Qualification` · `Father's Name` · `Address` (these five labels and order are the web's) followed by ✎ `Mother's Name` · `Designation` · `Level` · `Date of Baptism` · `Involvement since` · `Issue Date` (all dates `DD/MM/YYYY`). Missing values show `—`.
6. Footer note (Archivo 400 12 `mute`, ✎): `To change anything other than your photo, please contact CYD Office.`

**States**
| State | UI |
|---|---|
| Loading | skeleton: card-shaped block 350 × 531 (radius 12), two chip-height lines, five key/value lines |
| No profile (404) | dashed empty card: icon tile `?`, title `No profile found`, body `Please contact CYD Office.` No retry button (it will not change) but pull-to-refresh works |
| Error (network/5xx) | dashed error card `!`, title `Couldn't load your ID`, body the server message or `Could not reach the server. Check your connection and try again.`, button `Tap to retry`. If a cached profile exists, show it instead with the offline banner |
| Offline with cache | the cached card and details plus a banner under the title: mono 10 `faint` `OFFLINE · UPDATED {h:mm a, DD MMM}`; Update photo is disabled with helper ✎ `Connect to the internet to change your photo.` |
| Photo missing (`photo_url` null) | the card draws the silhouette (doc 07 §10.3) and an Info card ✎ above the actions: `Your card has no photo yet. Add one so it can be shared or printed.` with the primary action switching to `Add photo` |
| Data | as above |

**Interactions:** pull-to-refresh; card tap; both buttons; phone value is plain text (no dialer for the holder's own number). Back at the tab root exits the app (never to login).

**Acceptance (holder):** the card matches the printed design for the same data (doc 07 calibration); status chip and message follow the table for 61, 60, 1, 0 days left and for a past expiry; deleting the profile on the server and refreshing shows `No profile found`; offline after one online load still shows card, status and details; admin/user never see this screen.

---

## 5. Holder photo update  *(ID-04 · Designed here)*

**Route:** `/id/photo` · **Roles:** `profile_holder` · tab bar hidden.
**API:** `PUT /profile-holder/update-profile` body `{ "photo": "data:image/jpeg;base64,…" }` → `data.profile`. (The web used `PUT /profiles/update-limited`, which does the same; the app uses the holder-scoped route.) The backend also accepts `qualification` (≤ 200 chars) and `postal_address` (≤ 500) here, but the web UI keeps them disabled and the product rule is "you can only update your photo" — the app does the same (owner may change this, doc 12).

**Layout:** app bar (back + inline title `UPDATE PHOTO`, Anton 26). Content, padding 20, centred column:
1. Info card (`accSoft`, radius 16, padding 14): `Limited Access: You can only edit your photo. For other changes, please contact CYD Office.` (web copy, verbatim).
2. **Photo tile** 200 × 231 (aspect 58 : 67, the card's photo box, doc 07 §10.2), radius 16, 1 px `line`; shows the new photo if one is picked, else the current `photo_url`, else the silhouette.
3. Two secondary buttons (height 50, gap 10): `Take photo` and `Choose from gallery` (icons `photo_camera_outlined`, `add_photo_alternate_outlined`).
4. Helper (Archivo 400 12 `mute`, centred) ✎: `JPG, PNG, GIF, BMP or WebP. The app shrinks large photos for you.` (The web said "JPG, PNG, GIF. Max size: 5MB"; the server accepts the six formats above and ≤ 5 MB per image, 10 MB per request.)
5. Sticky bottom bar: primary `Update photo` (disabled until a new photo is chosen); loading label `Updating…`. It rises with the keyboard rules of doc 02 §8.3 (no keyboard here).

**Photo pipeline (shared with the profile form, §8):** pick (`image_picker`, camera or gallery; on Android 13+ the system photo picker needs no permission) → **crop screen** → resize/encode.
- **Crop screen:** full-screen dark backdrop; the image is movable/zoomable (`InteractiveViewer`, 1×–5×) under a fixed **58 : 67** frame with a dimmed outside and rule-of-thirds guide; caption mono 10 `faint` ✎ `PINCH AND DRAG TO FIT THE FACE`; buttons `Cancel` (outline) and `Use photo` (accent). Output = the framed region. (`image_cropper` is an acceptable package if the architect prefers it at M3; record the choice in `docs/DECISIONS.md`. A custom `InteractiveViewer` crop avoids a native dependency.)
- **Encode:** bake EXIF rotation, scale so the long side ≤ **1600 px**, JPEG quality 0.85 → 0.70 → 0.55 until ≤ **1 MB**, shrinking the side by 0.7 up to 5 times, on a background isolate (the web helper `src/utils/image.js` does exactly this). Result is a `data:image/jpeg;base64,…` string. Never log it.
- Error strings (from the web helper): `Please choose an image file.` · `That file is not an image we can read.` · `That image is too large. Please crop it and try again.` Camera permission denied: ✎ `Camera access is off. You can turn it on in Settings, or choose a photo from your gallery.` (button `Open Settings`).

**States:** idle (nothing picked) · picked (new photo shown, CTA enabled, a text button `Undo` ✎ under the tile restores the current photo) · saving (buttons disabled, CTA loading) · error banner above the CTA with the server message (`Photo must be a valid base64 image`, `Photo upload failed: …`, `Profile not found`, or the network sentence) · success.
**On success:** toast `Profile updated successfully` (server message), invalidate `myProfile`, evict the old photo from the image cache and the cached card data, pop to My ID.
**Leaving with an unsaved new photo:** dialog (doc 02 §9.17) title `DISCARD THIS PHOTO?`, body `Your new photo has not been saved.`, left `Keep editing`, right (danger) `Discard`.

**Acceptance (holder):** a 12 MP portrait phone photo ends ≤ 1 MB, upright, centred as framed, and the card shows it after saving; a non-image file is rejected with the exact message; offline shows the disabled state; the previous photo is restored by `Undo`; admin/user cannot open the route.

---

## 6. Profiles list and filter sheet  *(ID-05, ID-06 · Designed here)*

**Route:** `/id` (root of tab 1) · **Roles:** `admin`, `user` · **Purpose:** find, create, preview, edit and delete ID-card profiles. Replaces the web's *Dashboard stats* + *Manage Profiles* table.
Role scope is enforced by the server: **admin** sees all active profiles; **user** sees only profiles they created (`created_by`).

**API**
| Call | When | Notes |
|---|---|---|
| `GET /profiles?page&limit=25&search&deanery&parish&level&designation&sort_by&sort_order` | list | `data.profiles[]` (each with `created_by_username`), `data.pagination{current_page, per_page, total, total_pages, has_next, has_prev}`. Only `status = 1` rows are returned (deleted profiles never appear). `sort_by` ∈ `name, created_at, deanery, parish, level, designation` (default `created_at`), `sort_order` `ASC|DESC` (default `DESC`). `limit` 1–100. Filters are exact matches on the stored strings |
| `GET /profiles/filter-options` | on open, cached 5 min | `data{deaneries[], parishes[], levels[], designations[], deanery_parish_map{deanery:[parish]}}` — **distinct values from the caller's own saved profiles**, the source of truth for *filtering* (not for the create form, §8) |
| `GET /profiles/stats` | **admin only**, on open + pull-to-refresh | `data.stats{total_profiles, total_creators, profiles_with_photos, created_today, created_this_week}`. `user` gets 403 — do not call it for `user` |

**Layout (scroll, padding `20 20 130`)**
1. **Title row:** `PROFILES` (Anton 40/.95) left; right, a 44 × 44 accent circle `+` (semantics `Create ID card`) → `/id/profiles/new`. This is the screen's single accent control.
2. **Stats** (section label `OVERVIEW`):
   - **admin:** a 2 × 2 grid of stat tiles (doc 02 §10.5; gap 8; padding 14; radius 16; number Anton 28 `ink`, label DM Mono 500 9 +.14em `faint`): `TOTAL PROFILES` ← `total_profiles`, `WITH PHOTOS` ← `profiles_with_photos`, `CREATED TODAY` ← `created_today`, `THIS WEEK` ← `created_this_week` (labels from the web's `Total Profiles / With Photos / Created Today / This Week`). A small ⓘ on `TOTAL PROFILES` opens a sheet ✎ `Includes profiles that were deleted. The list below shows active profiles only.` — **backend quirk: `stats` counts soft-deleted rows** (doc 11/12); remove the note when the backend is fixed.
   - **user:** one wide tile ✎ `PROFILES YOU CREATED` showing `pagination.total` from the list call (no stats call). The web's fallback showed wrong "with photos / today / week" numbers for non-admins; the app omits them.
   - Skeleton: tile-shaped blocks. Stats failure never blocks the list: tiles show `—` with a retry icon.
3. **Search field** (height 48, radius 14, leading `⌕`, trailing `×` when non-empty; placeholder `Search profiles…`; web: `Search profiles...`) with a 48 × 48 outline **filter button** to its right (icon `tune`, a small accent dot when any filter is active; semantics `Filters`). Search matches name, father, mother, phone, parish, deanery, designation, qualification and address (server). **Debounce 500 ms**, resets to page 1.
4. **Active filters row** (only when some filter/search is active): mono label `ACTIVE FILTERS`, then removable chips (doc 02 §9.6, height 30) in a horizontally scrolling row: `Search: "{q}"` · `Deanery: {d}` · `Parish: {p}` · `Level: {l}` · `Designation: {s}` (web strings). Removing the deanery chip also clears the parish. Trailing text button `Clear all`.
5. **Results line:** Archivo 400 12 `mute` `Showing {loaded} of {total} profiles` (web: `Showing x of y profiles`); when filtering, an info chip `{total} results`.
6. **List** of member rows (doc 02 §10.1 with the overrides below), gap 10, infinite scroll (`has_next`, load the next page when within 600 px of the end; a 56 px skeleton row as footer while loading; footer text `You've reached the end` ✎ in mono 9 `faint` after the last page).
7. Pull-to-refresh refreshes list, stats and filter-options.

**Member row** (card, radius 20, padding 14, min-height 84): photo thumb **56 × 70** radius 12 (initials tile on a tint if no photo; Cloudinary thumbnail transform allowed, doc 07 §10.4) · line 1 name (capitalised, Archivo 700 15) · line 2 `{designation} · {level}` (Archivo 400 12 `mute`) · line 3 `{deanery} · {parish}` (DM Mono 10 `faint`; **when the search text is all digits show the phone number instead** ✎ so a phone search visibly matches) · top-right **validity chip** (24 high; none when `issue_date` is null) · bottom-right the **overflow button** `⋯` (44 × 44, `Icons.more_horiz`).
- Overrides of doc 02 §10.1: the 32 × 32 chevron is replaced by the overflow button because doc 02 §11 rule 8 forbids actions that exist only on long-press; **long-press still opens the same sheet**.
- **Level chip** (small, beside line 2 or replacing the text `· {level}`): `parish` → green (`ok`), `deanery` → amber, `dexco` → blue, mirroring the web's success/warning/info chips; label is the level text, no glyph.
- Tap → `/id/profiles/:id` (detail, §7). Overflow/long-press → bottom sheet (doc 02 §9.16) titled with the name: `Preview ID card` → `/id/profiles/:id/card` · `Edit` → `/id/profiles/:id/edit` · `Share card` → opens the preview and starts sharing (export always starts from the preview, doc 07 §12.2) · `Delete` (danger text) → §11.

**Filter sheet (ID-06)** — standard sheet (doc 02 §9.16), max height 80 %, title `FILTERS` (Anton 26), `Reset` text button top-right, sticky CTA `Apply filters` (accent) with a secondary `Cancel`. The CTA does not show a result count: the server `total` for a pending selection is not available without a request, and the app does not fire one per tap. Fields:
- `DEANERY`: searchable select sheet (rows height 52, current ✓; first row `All deaneries`) from `filter-options.deaneries`.
- `PARISH`: disabled with helper `Choose a deanery first` until a deanery is chosen; then the list from `deanery_parish_map[deanery]` (web behaviour); `All parishes` first.
- `LEVEL`: chip group (`parish`, `deanery`, `dexco`, from `filter-options.levels`) single-select.
- `DESIGNATION`: searchable select from `filter-options.designations`.
- `SORT BY`: radio rows: `Newest first` (`created_at DESC`, default) · `Oldest first` (`created_at ASC`) · `Name A–Z` · `Name Z–A` · `Deanery A–Z` · `Parish A–Z` ✎ (the web has no sort control; the API supports it).
- Selections are applied together on `Apply filters`, persisted per user in preferences (last-used filters, doc 01 §5) but **not** restored across sign-out.

**States**
| State | UI |
|---|---|
| Loading (first page) | 6 member-row skeletons (photo block + three lines at 70 / 50 / 40 %), stats skeleton |
| Empty, no filters | dashed card, icon tile `+` (accent): title ✎ `No profiles yet`, body ✎ `Create the first ID card to see it here.`, button `Create ID card` |
| Empty with filters | dashed card, neutral tile `?`: title `No profiles found` (web), button `Clear filters to see all profiles` (web) |
| Error (first page) | dashed card `!`: title `Failed to fetch profiles` (web), body ✎ `Check your connection and try again.`, button `Tap to retry` |
| Error (later page) | inline row `Couldn't load more` + `Retry`; loaded rows stay |
| Offline | cached first page (and its filters) with banner `OFFLINE · UPDATED {time}`; search/filter/pagination disabled; `+`, Edit, Delete disabled with toast ✎ `You're offline.` |
| Data | as above |

**Interactions & rules:** a successful create/edit/delete elsewhere invalidates the list; the new row appears at the top for the default sort. Deleting removes the row with a toast. The tab-1 root keeps its scroll offset when switching tabs.

**Acceptance**
- `admin`: stats tiles show the API numbers; the list includes profiles of all creators; `+` creates; search, each filter, dependent parish and sort return server-filtered results; chips remove correctly; 1 000 rows scroll smoothly (virtualised).
- `user`: only own profiles; **no stats call is made** (verify no 403 in logs); one tile shows the own total.
- Both: empty/filtered-empty/error/offline states as specified; long-press and overflow sheets are identical; a phone-number search shows the phone line.

---

## 7. Profile detail  *(ID-07 · Designed here)*

**Route:** `/id/profiles/:id` · **Roles:** `admin` (any), `user` (own created only) · tab bar hidden.
**API:** `GET /profiles/:id` → `data.profile` (+ `created_by_username`, `created_by_email`). `404 {message:"Profile not found or access denied"}` for a missing, deleted or not-yours profile. (The list row can seed the screen instantly; always refetch.)

**Layout:** hero-style sub-screen: back button (40) top-left on the photo area.
1. **Photo** full content width, aspect 58 : 67 (the card's photo box), radius 20, `cover` (silhouette tile if none).
2. Name Anton 32/.95 (capitalised); beneath, chips: level chip (as in §6), designation info chip, **validity chip** (26 high) with `Issued {DD/MM/YYYY} · Expires {DD/MM/YYYY}` in mono 11 `faint` (omitted when `issue_date` is null).
3. **Details card** (key/value rows): `Phone` (tap → `tel:` dialer ✎) · `Father's Name` · `Mother's Name` · `Date of Birth` · `Date of Baptism` · `Educational Qualification` · `Involvement since` · `Deanery` · `Parish` · `Postal Address` (multi-line) · `Issue Date`. Labels are the web form's labels. Admin additionally sees ✎ `Created by` → `created_by_username` and `Created on`.
4. **Holder login** (collapsed row, ✎): title `Holder login`; expanded body: `The username was shown when this profile was created: the first four letters of the name followed by the day and month of birth (for example anil1304); a number is added if that name was taken. The password starts as the holder's phone number until they change it.` The app **cannot display the holder's credentials** — the server only returns them once, at creation. (Backend ask in doc 12.)
5. Sticky bottom bar: primary `ID card` (56, → `/id/profiles/:id/card`), outline `Edit` (→ edit form), and a text button in `danger` `Delete profile` above them (opens §11).

**States:** skeleton (photo block + name + 8 rows) · error dashed card with retry · 404 dashed card: title `Profile not found`, body `It may have been deleted, or it belongs to another user.`, button `Back to profiles` (doc 02 §9.15) · data.
**Acceptance:** admin opens any profile; user opening another user's id (deep link) sees the 404 card; phone tap opens the dialer; Edit/ID card/Delete navigate correctly; photo missing shows silhouette.

---

## 8. Profile form — create and edit  *(ID-08 · Designed here)*

**Routes:** `/id/profiles/new` (create) · `/id/profiles/:id/edit` (edit) · **Roles:** `admin`, `user` (`user` can edit only profiles they created) · tab bar hidden. The web's *Create ID Card* tab and edit mode are one screen with two modes.

**API**
| Mode | Call | Body | Success |
|---|---|---|---|
| Create | `POST /profiles` | the 14 fields + `photo` (data URL) — write names, see below | `201` `data.profile` + `data.credentials{username, password, message}`; `message` is `Profile created successfully` **or** `Profile restored successfully` (see §9) |
| Edit | `PUT /profiles/:id` | **the full set of 14 fields** (+ `photo` only if changed) | `200` `data.profile` |
| Prefill (edit) | `GET /profiles/:id` (or the row passed from the list; refetch anyway) | — | read names, mapped below |

> **Edit must send every field.** The backend's `UPDATE` sets each column from the body and writes `null` for anything missing, so a partial body **erases data**. Always send the whole form. Omit `photo` when it is unchanged (the server then keeps the stored URL; sending the existing https URL also works, as the web does).
> Edit does **not** lower-case the name (create does) and does **not** touch the holder's login: changing the phone later does **not** change the holder's password.

**Write ↔ read mapping** (model-level only): `father_name`↔`father`, `mother_name`↔`mother`, `date_of_birth`↔`dob`, `photo`↔`photo_url`; all other names are identical.

**Fields** (in this order; labels are the web's; **all 14 are required in the app**, as in the web form):

| # | Label | Key (write) | Control | Rules and **verbatim messages** | Backend limit |
|---|---|---|---|---|---|
| 1 | Name | `name` | text, `TextCapitalization.words` | `Name is required.` | ≤ 100 (`Name must not exceed 100 characters`) |
| 2 | Father's Name | `father_name` | text, words | `Father's name is required.` | ≤ 100 |
| 3 | Mother's Name | `mother_name` | text, words | `Mother's name is required.` | ≤ 100 |
| 4 | Date of Birth | `date_of_birth` | date picker, shows `DD/MM/YYYY`, sends `YYYY-MM-DD` | `Date of Birth is required.` (**the backend treats it as optional but the create call fails with a 500 without it** — it builds the holder username from it) | ISO date |
| 5 | Date of Baptism | `date_of_baptism` | date picker | `Date of Baptism is required.` | ISO date |
| 6 | Educational Qualification | `qualification` | text | `Educational Qualification is required.` | ≤ 200 in the app ✎ (DB is `TEXT`; the holder route caps 200) |
| 7 | Phone | `phone` | phone keyboard, digits only, max 10 | `Phone is required.` · `Invalid phone number format.` (exactly 10 digits, `^[0-9]{10}$`). Helper ✎ `Also the holder's first password.` | `phone` column 20 |
| 8 | Involvement since | `involvement` | text | `Involvement since is required.` Helper ✎ `For example: 2019` | ≤ 200 ✎ |
| 9 | Deanery | `deanery` | select sheet | `Deanery is required.` | ≤ 100 |
| 10 | Parish | `parish` | select sheet, dependent | `Parish is required.` | ≤ 100 |
| 11 | Level | `level` | chip group `Parish / Deanery / Dexco` → sends `parish`/`deanery`/`dexco` | `Level is required.` | ≤ 50 |
| 12 | Designation | `designation` | select sheet | `Designation is required.` | ≤ 100 |
| 13 | Postal Address | `postal_address` | multi-line (3 rows → 6) | `Postal Address is required.` | ≤ 500 in the app ✎ |
| 14 | Issue Date | `issue_date` | date picker, **default today** | `Issue Date is required.` Helper ✎ `The card is valid for two years from this date.` | ISO date |
| — | Photo | `photo` | photo tile (below) | **create:** `Please upload a photo` (web toast text, shown inline); **edit:** optional | JPEG/PNG/GIF/BMP/WebP data URL; ≤ 5 MB, body ≤ 10 MB |

Client-side extras ✎ (not in the web): DOB, baptism and issue dates may not be in the future (`Date cannot be in the future`); fields are trimmed; the name field collapses repeated spaces. No other rule is invented.

**Option lists**
- **Deanery / parish:** `assets/data/deaneries.json` (16 deaneries, 154 parishes), source `FormDetails.jsx`. Keep the **original strings** when saving (one parish is stored as `"Ajnala "` with a trailing space); trim only for display. Changing the deanery **clears** the parish. The web *preselects the first deanery*; the app does **not** — the user must choose (avoids silently wrong data) ✎.
- **Edit with a value not in the list** (older records, or the filter list's spelling): add the stored value as an extra first option labelled `{value}` + mono `NOT IN LIST` so saving does not blank it.
- **Level:** `parish`, `deanery`, `dexco` (`assets/data/levels.json`); helper under the chips ✎ `Decides the card design: Parish, Deanery or Dexco.`
- **Designation:** the 13 values of `assets/data/designations.json` (`Member … Girl Spokesperson`).

**Layout** (sub-screen; app bar = back + inline title `NEW ID CARD` / `EDIT PROFILE`, Anton 26; scroll area padding `20 20 120`; fields stack with gap 16; related pairs may be two columns only at ≥ 600 px):
1. Section `PHOTO`: tile **96 × 111** (aspect 58 : 67 — this overrides doc 02 §10.4's 96 × 120 so the tile equals the crop and the card box), radius 14, `1.5px dashed line2` when empty with `+` and the caption `Add photo`; filled shows the cropped image with a small `Change` text button. Tapping opens a sheet `Take photo` / `Choose from gallery`, then the **crop screen and resize pipeline of §5** (58 : 67 frame, ≤ 1600 px, ≤ 1 MB JPEG). Helper `JPG, PNG, GIF, BMP or WebP. The app shrinks large photos for you.`
2. Section `PERSONAL`: fields 1–8.
3. Section `CHURCH`: fields 9–12 (deanery → parish → level → designation).
4. Section `ADDRESS`: field 13.
5. Section `CARD`: field 14.
6. Sticky bottom bar: primary **`Generate ID Card`** (create) / **`Update Profile`** (edit), height 56, loading labels `Submitting…` / `Updating…`; on create a text button `Reset` (clears after a confirm dialog `Clear all fields?`) sits in the app bar's right slot (web parity: *Reset* on create, *Cancel* on edit — edit's cancel is the back button with the discard guard).

**Validation timing:** on submit all fields validate, the first invalid field is scrolled into view and focused; afterwards each field re-validates on blur and clears its error when edited (doc 01 §8). Backend `errors[]` that cannot be mapped (strings such as `phone is required`, `Date of birth must be a valid date (YYYY-MM-DD)`, `Photo must be a valid base64 image (jpeg, png, gif, bmp, webp)`) are shown as a bulleted banner above the CTA, joined by the server message `Validation failed`; keyword mapping to a field (`Name`→1, `Father`→2, `Mother`→3, `birth`→4, `baptism`→5, `phone`→7, `Designation`→12, `Level`→11, `issue_date`→14, `photo`/`Photo`→photo) is a best-effort extra.

**Submit flow:** validate → build the body (`Profile.toRequest()`; dates `YYYY-MM-DD`) → disable the form → request → on 2xx:
- Create → invalidate `profiles`, `stats`, `filterOptions`; open the **credentials dialog** (§9) over the form; when it closes navigate to the list (`/id`).
- Edit → toast `Profile updated successfully!`, invalidate list/detail/filter options, pop to the detail screen.
- Errors: 401 → global session-expired handling (§13); other → banner with the server `message` or `Failed to create profile` / `Failed to update profile`; network → `Could not reach the server. Check your connection and try again.`; `413` → `Request body is too large` (server wording) with the hint ✎ `Choose a smaller photo.`
- **Never** auto-retry a failed create; a second tap after an error is a new attempt (and may hit restore-by-recreation, §9). The form keeps its values after errors.

**Unsaved changes:** back/gesture with edits → dialog `DISCARD CHANGES?`, body ✎ `Your changes will be lost.`, left `Keep editing`, right (danger) `Discard`. **Drafts are not persisted** (minors' personal data must not be written to local storage unencrypted).

**States:** edit-mode loading = form skeleton (label + 50 px field blocks); edit load error = dashed error card with retry; 404 = dashed card `Profile not found` + `Back to profiles`; submitting; field-error; banner-error.

**Acceptance**
- `admin`/`user`: all 14 fields enforce their exact messages; phone accepts only 10 digits; parish list follows the deanery; level/designation values send as stored values; creating returns credentials and the holder can then log in (username/password from the dialog).
- Edit prefills every field from `dob`/`father`/`mother`; saving an unchanged form changes nothing server-side (no field erased); a phone change leaves the holder's password unchanged.
- Date of birth missing is blocked client-side (no 500). A 6 MB photo is accepted after the app's shrink; a corrupt file shows `That file is not an image we can read.`
- A `user` cannot open `/id/profiles/:id/edit` for another user's profile (404 card).

---

## 9. Credentials dialog and restore notice  *(ID-09 · Designed here)*

**When:** after a successful `POST /profiles` (never after edit). Opens over the form as a non-dismissible-by-scrim dialog (doc 02 §9.17, inset 24, radius 24, padding 22, content scrolls). **Roles:** `admin`, `user`.

**Data:** `data.credentials{username, password}` from the create response. The server returns them **only once**; they cannot be fetched later. Keep them in memory only while the dialog is open; never log or persist them.

**Two variants** (decided by `message`):
| `message` | Title | Intro text |
|---|---|---|
| `Profile created successfully` | `PROFILE CREATED` (Anton 24) | `Login credentials were generated for the profile holder:` (web: "The following credentials have been generated for the profile holder:") |
| `Profile restored successfully` ✎ | `PROFILE RESTORED` | `A deleted profile with the same name and phone number was found and has been restored with the details you entered. The holder's login was re-activated and its password was reset to their phone number.` — then the line above |

**Body:** an `ok`-tinted info card with section label `LOGIN CREDENTIALS CREATED` (web: "Login Credentials Created") and two **copy-rows** (doc 02 §9.21): `USERNAME` and `PASSWORD` with values in DM Mono 500 15; tapping copies and toasts `Username copied to clipboard` / `Password copied to clipboard` (web copy). Caption (Archivo 400 12 `mute`): `Please share these credentials with the profile holder securely. They can use the same login page with these credentials.` (web, verbatim) + ✎ `You will not be able to see this password again.`

**Actions (stacked, full width):** primary `Preview ID card` (56 → `/id/profiles/:id/card`, the new profile's id from `data.profile.id`) · outline `Share credentials` (system share sheet, ✎ text: `CYD ID card login\nUsername: {username}\nPassword: {password}`) · text button `Close` (→ the profiles list).

**Acceptance:** the username follows the server rule (first four letters of the name + `DDMM` of birth, a counter appended on collision) — display whatever the server returns, never recompute; copy and share work; re-creating a deleted profile (same name **and** phone) shows the restore variant; closing without copying is allowed (no extra guard) but the caption warns; credentials never appear in logs or crash reports.

---

## 10. Card preview and export  *(ID-10 · Designed here)*

**Routes:** `/id/profiles/:id/card` (admin, user) · `/id/card` (profile holder, own card) · tab bar hidden.
**Data:** admin/user — `GET /profiles/:id` (the row from the list may seed it); holder — the cached `GET /profile-holder/my-profile` result (refetched when online). The card widget takes the strict `CardData` of doc 07 §3.1, built by `CardData.fromProfile(profile)`; the card's geometry, fonts, backgrounds and long-text policy are in `07-ID-CARD-RENDERING.md` and are not repeated here.

**Layout (always dark, regardless of the app theme — it is a presentation surface):** backdrop = the **dark theme's `bg` token** (`#0A0A0B`; do **not** use `stageBg`, which doc 02 §2.4 reserves for the mockup frame); texts/buttons use the **dark-theme** tokens even when the app is in light mode.
1. Top bar: back button (40, `card` fill) · centre mono 10 +.16em `faint` `ID CARD` · right: overflow `⋯` (44) → `More` sheet (below).
2. Identity strip (padding `0 20`): name (Archivo 700 15, capitalised) with the **validity chip** (24 high) on the right; under it mono 11 `faint` `Issued {DD/MM/YYYY} · Expires {DD/MM/YYYY}` (omitted without `issue_date`). When not plain "Valid", an info card under the strip with the **web preview wording**: expired → `This ID card has expired on {DD/MM/YYYY}` (danger tint); expiring → `This ID card will expire in {n} days` (amber tint). Chips and strip are **outside** the `RepaintBoundary`.
3. **Card stage:** the card centred, width `min(screenWidth − 32, 480)` (height follows the 146.3 : 221.8 aspect; in landscape reduce the width so the height fits `screenHeight − 220`), radius 12, 1 px `line2` border **outside** the capture boundary. `InteractiveViewer` pinch zoom 1×–4×; double-tap toggles 1× / 2.5×; the card never scrolls horizontally at 1×. A hint line the first time ✎ `Pinch to zoom`.
4. **Actions** (sticky bottom bar, padding `12 16 max(26, inset + 12)`): primary `Share card` (height 56) and, beneath, a row of two outline buttons (height 50): `Save PDF` · `Print`.
   - `Share card` → PNG **1728 × 2620** through the system share sheet (`share_plus`), file name per doc 07 §12.1 (`{Name}-{Parish}-{phone}.png`, sanitised). "Save to device / Files" is available on that sheet — v1 does **not** add a gallery plugin (doc 07 §12.4 option a; record in `13-RELEASE.md`).
   - `Save PDF` → one-page PDF of exactly **146.3 × 221.8 mm**, zero margins, shared with `Printing.sharePdf` (file `{…}.pdf`).
   - `Print` → the same PDF to the OS print dialog (`Printing.layoutPdf`); a text link under the buttons ✎ `Print tip: choose "Actual size / 100 %" so the card prints at its real size.` and, in the `More` sheet, `Print on A4 (card centred)` for printers that clip edges.
   - `More` sheet (`⋯`): `Share as JPG (smaller)` ✎ · `Share original quality (2744 × 4160 PNG)` · `Print on A4 (card centred)` · for admin/user: `Edit profile` and `Delete profile`.
5. **Export progress:** while capturing, the three buttons are disabled, the primary shows spinner + `Preparing…`, and a 2 px accent progress bar appears under the top bar (capture takes ~0.3–1.5 s). Preconditions per doc 07 §12.2: background and photo decoded (`precacheImage` + one frame), card painted on screen, photo present, name non-empty.

**States and errors**
| Case | Behaviour |
|---|---|
| Loading profile | card-shaped skeleton on the dark backdrop; actions disabled |
| Profile 404 | dashed card `Profile not found` + `Back` (admin/user), or `No profile found` / `Please contact CYD Office.` (holder) |
| No photo | the card shows the silhouette (preview only); export buttons stay enabled but tapping shows toast `Add a photo first` (doc 07 §10.3) with action `Add photo` → edit form / holder photo screen |
| Photo still loading | buttons show `Preparing…` until decoded; if the image fails: toast ✎ `The photo could not be loaded. Check your connection and try again.` |
| Out of memory during capture | retry once at 1200 px wide; toast `Exported in standard quality` ✎; if it still fails: ✎ `Couldn't create the image. Please try again.` |
| Offline | the cached card still renders and exports (photo from the image cache); if the photo is not cached, as "Photo still loading" |
| Expired / expiring | allowed to export (the web allowed it); the banner says why it matters |

**Interactions:** share/PDF/print never upload anything; temp files are deleted after the share completes or on next start (doc 07 §12.3). No analytics. Back returns to the previous screen (list, detail or My ID).
**Acceptance:** side by side with the web card for the same data (doc 07 §11.3.1 calibration) every value is within 1 mm; exported PNG is 1728 × 2620 (2744 × 4160 for the "original quality" option); the PDF page is exactly 146.3 × 221.8 mm; the holder can open and share their own card after one online load, with the device offline; `user` cannot open another user's card route (404 card); chips never appear in the exported image.

---

## 11. Delete confirmation  *(ID-11 · Designed here)*

**Where:** from the Profiles list row sheet, the Profile detail bar and the card preview `More` sheet. **Roles:** `admin` (any profile), `user` (own created only). **API:** `DELETE /profiles/:id` → `{success:true, message:"Profile deleted successfully"}`. The backend does a **soft delete**: the profile gets `status = 0` and the holder's user account is deactivated. It disappears from lists; it can be brought back by **creating a profile again with the same name and phone number** (restore-by-recreation, §9). There is no "deleted profiles" list endpoint.

**Dialog** (doc 02 §9.17 destructive pattern; the web's "Confirm Delete / Are you sure you want to delete this profile? This action cannot be undone." is replaced because it is inaccurate and vague):
- Title (Anton 24 uppercase): `DELETE PROFILE`
- Body: ✎ `{Name}'s profile will be removed from the list and their login will stop working. To bring it back, create the profile again with the same name and phone number.`
- Left outline `Keep it` · right danger-filled `Delete profile` (loading `Deleting…`; both disabled in flight; scrim tap disabled in flight).

**Result:** success → toast `Profile deleted successfully`; invalidate list/stats/filter-options; from the detail or preview screen pop back to the list. Errors: `404 Profile not found or access denied` → toast with that message and refresh the list (someone else already deleted it); other → toast `Failed to delete profile` (web) or the server message; network → the network sentence. 401 → §13.
**Acceptance:** `user` cannot delete another user's profile (404 message); after deleting, the holder cannot log in (`Invalid credentials`); re-creating the same name + phone restores it with new credentials (restore dialog).

---

## 12. Account area  *(ID-12 … ID-17 · Designed here)*

### 12.1 Account home  *(ID-12)*

**Route:** `/account` (root of tab 5) · **Roles:** all. The web's *Profile & Settings* tabs (Profile Information / Change Password / User Management) and the holder's *Settings* (Edit Profile / Change Password) become this list. Shop rows are defined in `03-SCREENS-SHOP.md`; they are listed here only as navigation entries.

**Layout (scroll, padding `20 20 130`):**
1. Title `ACCOUNT` (Anton 40/.95).
2. **Identity card** (`card`, radius 20, padding 16): avatar 56 (initials of the username in Anton; holders show their profile photo when cached), username Archivo 700 16, subline: holders → `{deanery} · {parish}` (from the cached profile, DB-54 in doc 11), others → the role label; a role chip (`Administrator` / `Standard user` / `Profile holder` ✎ — web used `Administrator` / `User`) and mono 10 `faint` `JOINED {MMM DD, YYYY}` from `created_at` (web: `Joined MMM DD, YYYY`).
3. **Row groups** (section label + one `card` of rows; row height 56, label Archivo 600 14 + secondary line Archivo 400 12 `mute` + chevron):

| Group | Row | Roles / condition | Goes to |
|---|---|---|---|
| `ACCOUNT` | `Profile information` — `Username and email` | `admin`, `user` | `/account/profile` |
| | `Update photo` — `Change the photo on your ID card` | `profile_holder` | `/id/photo` |
| | `Change password` | all | `/account/password` |
| | `Create user` — `Add an administrator or standard user` | `admin` | `/account/users/new` |
| | `Appearance` — `System, light or dark` (current value on the right) | all | opens the appearance sheet (§12.5, no route) |
| `SHOP` | `My addresses` | all | `/account/addresses` |
| | `Become a seller` / `My shop` (label and badge from the shop state of `GET /shop/shops/mine`) | all (a holder may also sell) | `/account/sell` or `/my-shop` |
| | `Shop applications` | `admin` | `/admin/shops` |
| | `Payment disputes` (badge = open disputes) | `admin` | `/admin/disputes` |
| `ABOUT` | `Privacy policy` | shown **only when the owner supplies a URL** (doc 13) | opens the URL in the browser |
| | `App version` ✎ | all | non-interactive, shows `v{version} ({build})` in mono |

4. **Sign out**: outline danger button (height 50) full width at the bottom → §12.6.

**States:** no network calls are required to render (identity comes from the session and cache). Holder subline falls back to `Profile holder` when the profile is not cached. Shop-row labels show skeleton chips while the shop state loads.
**Acceptance:** each role sees exactly its rows (holder never sees Create user or Profile information; user never sees admin rows); Appearance changes the theme immediately and survives a restart; Sign out opens the confirmation.

### 12.2 Account information  *(ID-13)*

**Route:** `/account/profile` · **Roles:** `admin`, `user`. A holder opening it is redirected to `/account` with toast `You don't have access to that screen.` (their email is a generated `@profile.local` address and is not meant to be edited).
**API:** `GET /auth/profile` → `data.user{id, username, email, role, created_at, updated_at}` · `PUT /auth/profile` body `{ "username"?, "email"? }` → `data.user`. Send **only changed fields**; with nothing to change the server answers `400 No fields to update` (the Save button stays disabled until something changed).

**View mode:** header avatar 80 (initials) + username Anton 24 + role chip + `Joined {MMM DD, YYYY}` chip; key/value rows with the web labels `Username` · `Email Address` · `Account Type` (`Administrator` / `Standard User`) · `Member Since` (`MMMM DD, YYYY`) · `Last Updated` (`MMMM DD, YYYY [at] h:mm A`, only when present). Top-right text button `Edit Profile`.
**Edit mode** (same screen): info card `Update your profile information below. Changes will be saved immediately.`; fields `USERNAME`, `EMAIL ADDRESS`; buttons `Cancel` (outline) and `Save Changes` (primary, loading `Saving…`).
**Validation (verbatim):** `Username is required` · `Username must be at least 3 characters` · `Username can only contain letters, numbers, hyphens, and underscores` (also ≤ 50 characters on the server: `Username must be between 3 and 50 characters`) · `Email is required` · `Must be a valid email address`.
**Result:** toast `Profile updated successfully!`; update the stored user JSON and the session; leaving edit mode. If the **username changed**, show first a dialog ✎ `CHANGE USERNAME?` — `You will need the new username the next time you sign in.` (`Back` / `Change`). Server errors verbatim: `Username or email already exists` (400) · `Must be a valid email address` · network sentence. The server normalises the email (`normalizeEmail`), so display what it returns, not what was typed.
**States:** loading skeleton rows · error dashed card `Failed to load profile information` (web toast text) with retry · view · edit · saving.
**Acceptance:** admin and user can change username/email; a duplicate shows `Username or email already exists`; the new username works at the next login; holder cannot reach the screen.

### 12.3 Change password  *(ID-14)*

**Route:** `/account/password` · **Roles:** all. **API:** `PUT /auth/change-password` (admin, user) and `PUT /profile-holder/change-password` (holder), body `{ "currentPassword", "newPassword" }` → `{message:"Password changed successfully"}`. (The web calls the `/auth` endpoint for every role, which also works for holders; the holder route exists and only checks length ≥ 6. The app follows doc 09's split **but enforces the strict rule below for both**, so a weaker server check is never reached.)
Holders start with their **phone number** as password (digits only), so they have good reason to open this screen.

**Layout:** sub-screen `CHANGE PASSWORD`; (web subtitle) `Update your account password for security`; info card with the web's **Password Requirements:** `• At least 6 characters long` · `• Contains uppercase and lowercase letters` · `• Contains at least one number`.
Fields (each with show/hide toggle, `autofillHints: [password]` / `[newPassword]`): `CURRENT PASSWORD`, `NEW PASSWORD`, `CONFIRM NEW PASSWORD`. Under the new-password field the **strength meter** — mono 10 `STRENGTH:` + label, and a 3-segment bar (segments 4 px high, radius 2, gap 4):
`score = count of true among [len ≥ 6, has a–z, has A–Z, has digit, has special from !@#$%^&*(),.?":{}|<>, len ≥ 12]`; `score ≤ 2` → **Weak** (1 segment, `danger`) · `≤ 4` → **Medium** (2, amber) · else **Strong** (3, `ok`). Hidden while the field is empty. The meter is advisory; only the three requirements are enforced.
Primary `Change Password` (56), loading `Changing…`.

**Validation (verbatim):** `Current password is required` · `New password is required` · `Password must be at least 6 characters long` · `Password must contain at least one uppercase letter, one lowercase letter, and one number` · `Please confirm your new password` · `Passwords must match`. Server: `Current password is incorrect` (400, shown under the current-password field) · backend rule text `New password must contain at least one uppercase letter, one lowercase letter, and one number`.
**Result:** inline success card `Your password has been changed successfully!` + toast `Password changed successfully!`; fields cleared; the session stays valid (the JWT is not revoked, doc 12); keyboard dismissed.
**Acceptance:** all three roles can change their password and log in with the new one; the old one fails with `Invalid credentials`; a holder whose current password is the phone number can set `Abcdef1`; wrong current password shows the server message; the strength bar matches the formula for `abc` (1 → Weak), `Abcdef1` (4 → Medium), `Abcdef1!xyzw` (6 → Strong).

### 12.4 Create user  *(ID-15)*

**Route:** `/account/users/new` · **Roles:** `admin` only (others are redirected; if the screen is reached it shows the dashed card `Access denied. This section is only available to administrators.` — web text). **API:** `POST /auth/register` body `{ username, email, password, role }` → `201` `{message:"User registered successfully"}`. (The endpoint is admin-only on the hotfixed backend; it used to be public.)

**Layout:** title `CREATE NEW USER`, subline `Add a new user to the system (Admin Only)`; warning card (amber tint): `Admin Privileges: You are creating a new user account. Please ensure the user information is correct before proceeding.` Fields: `USERNAME`, `EMAIL ADDRESS`, `PASSWORD` (show/hide), `USER ROLE` (two radio rows: `Standard User` → `user` [default], `Administrator` → `admin`). Password requirements info card (same three bullets as §12.3). Buttons: `Reset Form` (text) · `Create User` (primary 56, loading `Creating…`). The web offers only `user`/`admin`; the backend also accepts `profile_holder` — the app does **not** offer it (holder accounts are created with their profile, §8).
**Validation (verbatim):** `Username is required` · `Username must be at least 3 characters` · `Username can only contain letters, numbers, hyphens, and underscores` · `Email is required` · `Must be a valid email address` · `Password is required` · `Password must be at least 6 characters long` · `Password must contain at least one uppercase letter, one lowercase letter, and one number` · `Role is required` · `Role must be either admin or user`. Server: `Username or email already exists` (400).
**Result:** success card `User has been created successfully! They can now login with their credentials.` + toast `User "{username}" created successfully!`; form reset. Creating an **administrator** first asks ✎ `CREATE AN ADMINISTRATOR?` — `Administrators can see every profile and manage all users and shops.` (`Back` / `Create administrator`).
**Acceptance:** admin creates a `user` who can sign in and sees only their own profiles; a duplicate username/email shows the server message; a non-admin cannot reach the route.

### 12.5 Appearance  *(ID-16)*

Bottom sheet (doc 02 §9.16) titled `APPEARANCE`, three radio rows `System` (follow the device) · `Light` · `Dark`; selecting applies immediately and closes the sheet. Stored in preferences (kept across sign-out). Default `System`. The ID card and its preview are unaffected (the card is always light).

### 12.6 Sign out  *(ID-17)*

Dialog (doc 02 §9.17): title `SIGN OUT`, body ✎ `You will need to sign in again. The cart on this device will be cleared.`, left outline `Stay signed in`, right danger `Sign out`.
**On confirm:** no server call is needed (the web does none; `POST /auth/logout` only returns success). Clear, in this order: secure-storage token and user, this user's cart and wishlist, cached profile pages / own profile / card data / filter options and the card-photo image cache, last-used filters; **keep** theme mode and recent searches (doc 01 §5). Reset all providers, then go to `/login`. The next user must not see any of the previous user's data (acceptance test).

---

## 13. Session-expired, account-disabled and offline states  *(ID-18 · Designed here)*

These are global behaviours, not screens, implemented once in the network layer (`auth_interceptor`, `error_mapper`) and the shell.

**401 on any call except the login call**
- The auth middleware re-reads the user from the database on every request (`status = 1`), so a 401 can mean the 24 h token expired **or** the account was deleted/deactivated (for example the profile was deleted). Server `message` → behaviour:

| Server message | User sees | Action |
|---|---|---|
| `Token expired` · `Invalid token` · `Access token required` | toast + login banner `Session expired. Please login again.` | clear the session, go to `/login` |
| `Invalid token - user not found` | ✎ `Your account is no longer active. Please contact CYD Office.` (login banner) | same |

- Handle **once** even if several requests fail together (debounce the expiry action); cancel in-flight requests. After login always go to `/id` (the next user may differ; do not restore deep links). The login screen shows the message in the banner position of §3 (not as a toast only, because the screen is replaced).
- A `403` (role gate, e.g. `Profile holder access required`, `Admin access required`) is **not** a session problem: show the server message in a toast and stay.
- `POST /auth/login` returning 401 is always `Invalid credentials` (§3), never "session expired".

**Offline / unreachable**
- Detect by request outcome (connection error, timeout, DNS failure); no connectivity plugin is required. After such a failure show a slim banner under the status bar (height 28, `accSoft`, mono 10 `faint`): `OFFLINE — SHOWING SAVED DATA` when the screen has cache, otherwise the screen's error card with title `You're offline` and body `Check your connection and try again.` Remove the banner after the next successful response.
- Screens with cache and their wording: Profiles list (first page, §6), My ID (profile, card, validity, §4), card preview/export (§10). Everything else shows the error card with retry.
- **Mutations are never queued.** Create/edit/delete profile, change password, create user, photo update: when offline the action fails with the banner `Could not reach the server. Check your connection and try again.` and the form keeps its values.
- Cold start on Render's free tier: first request > 8 s → hint `Waking up the server… this can take up to a minute.` on the current screen (login: under the CTA); `502/503` → ✎ `The server is starting up. Please try again in a minute.` GET requests retry once on timeout; mutations do not.

**Acceptance:** deleting a holder's profile in the admin app makes the holder's next request show the account-disabled message and return them to login; two simultaneous 401s produce one toast and one navigation; airplane mode on My ID shows the cached card with the offline banner; airplane mode on the create form fails cleanly without losing input.

---

## 14. Role acceptance checklists

Use the seeded accounts from `tools/seed-dev-data.js` (password `Passw0rd1`): admin, `cydmanager` (role `user`), holder `anil1304`, plus a buyer and a seller for shop checks (`docs/10-TESTING-QA.md`). Run each list in **dark and light**, at **360, 390 and 412 px**, text scale 1.0 and 1.3.

### 14.1 `admin`
- [ ] Login lands on **Profiles** (tab label `Profiles`, mark `P`); wrong password → `Invalid credentials`.
- [ ] Stats tiles show the four API numbers; the ⓘ on `TOTAL PROFILES` explains the deleted-rows quirk.
- [ ] List shows profiles of **all** creators; search (debounced), each filter, dependent parish, sort, active chips, `Clear all`, infinite scroll, pull-to-refresh, empty / filtered-empty / error / offline states.
- [ ] Create: every one of the 14 fields rejects empty with its exact message; phone only 10 digits; photo required (`Please upload a photo`); crop frame 58 : 67; success opens the credentials dialog; copy toasts; the holder can log in with those credentials.
- [ ] Re-create a deleted profile (same name + phone) → `PROFILE RESTORED` variant.
- [ ] Edit any profile: prefilled; unchanged save erases nothing; phone change does not change the holder's password.
- [ ] Delete any profile with the confirmation; it disappears; the holder can no longer log in.
- [ ] Card preview/export: PNG 1728 × 2620, PDF 146.3 × 221.8 mm, print dialog, zoom; expired / expiring banners.
- [ ] Account: edit username/email (duplicate error), change password, **create user** (both roles; admin confirmation), appearance, sign out wipes caches.
- [ ] Session expiry (edit the stored token or wait) → `Session expired. Please login again.`

### 14.2 `user` (CYD manager)
- [ ] Login lands on **Profiles**; **no stats request** is made (no 403 in the log); a single `PROFILES YOU CREATED` tile.
- [ ] Sees **only** profiles they created; filter options reflect only those profiles.
- [ ] Create / edit / delete / preview own profiles exactly as the admin list above; opening another user's profile id (deep link) shows the 404 card (`Profile not found or access denied` handling).
- [ ] No `Create user`, no admin rows in Account; deep link to `/account/users/new` is redirected with `You don't have access to that screen.`
- [ ] Account information editable; password change works.

### 14.3 `profile_holder`
- [ ] Login lands on **My ID** (tab label `My ID`, mark `ID`); no Profiles list, no create/edit routes (deep links redirect).
- [ ] Card displays correctly; status chip and message right for 61 / 60 / 1 / 0 days left, expired, and no `issue_date`; details rows in the web order plus the extra rows.
- [ ] `View full card` → preview with zoom; Share / Save PDF / Print work; **offline after one online load**: card, status and details still open and export.
- [ ] `Update photo`: camera and gallery, crop, shrink ≤ 1 MB, upload, card refreshed; invalid file message; discard guard; offline disabled state.
- [ ] Profile deleted by an admin → next refresh `No profile found` / account-disabled message on a protected call.
- [ ] Account: no `Profile information` and no `Create user`; `Update photo` row; change password (works from the phone-number password to `Abcdef1`); sign out wipes the cached profile and photo.

### 14.4 Cross-cutting
- [ ] Every screen has loading / empty / error / data; no lone spinners; skeletons match layout.
- [ ] All touch targets ≥ 44 dp; icon-only buttons have semantics labels; status chips read their label; the card has one semantics node (doc 07 §13).
- [ ] No colours/sizes hard-coded (tokens only); both themes legible; the card and its preview unaffected by theme.
- [ ] No tokens, passwords, photos (base64) or credentials in logs; drafts are never persisted; sign-out leaves no personal data.
- [ ] Every ✎ string reviewed by the owner; every screen in §2–§13 signed off visually (all are *Designed here*).
