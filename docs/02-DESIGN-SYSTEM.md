# 02 — CYD Design System

Source of truth for visuals: the Claude Design mockup `design/CYD Shop Mobile.dc.html` (theme block + component markup). Machine-readable values: `design/tokens.json`. This document explains them, adds the components the mockup does not show (P2P payment, chat, evidence, ID cards) and states the rules an implementer must follow.

Provenance legend used throughout: **[Mockup]** = measured from the mockup markup; **[Designed here]** = extension designed for this kit in the same visual language (no mockup artboard exists); **[Illustrative]** = Dart sketch, not compiled or run.

---

## 1. Principles

1. **Editorial, not generic.** Big condensed display type (Anton) for titles and money, quiet grotesque (Archivo) for UI, mono (DM Mono) for tiny tracked labels. The app should look like a printed programme for a youth festival, not a Material template.
2. **One accent, used sparingly.** Saffron `#FFA51F` marks the single primary action per screen, the selected tab, active step and key badges. Everything else is neutral ink/mute/faint on hairline cards.
3. **Hairlines, not shadows.** Cards are a 1px `line` border on `card` fill. The only shadows are the accent glow on the main CTA, the promo card and the confirmation tick.
4. **Dark first, light equal.** Both themes come from one token set (§2). Never hard-code a colour in a widget; always read a token.
5. **Glyphs over icon packs.** The mockup uses typographic glyphs (← ⌕ ♡ ♥ ✓ ! ◔ ‖ ₹). Keep them where they are legible and map the rest to Material Symbols (§9). Do not mix icon styles on one screen.
6. **Honest money.** Prices are integers in paise, shown `₹x.xx`. Never show a price the server did not confirm; carts revalidate before checkout.
7. **Server-driven actions.** Buttons on order screens come from `allowed_actions`; the UI never infers permissions from status alone.
8. **Calm motion.** One easing curve (`cubic-bezier(.19,1,.22,1)`) for entrances; shimmer/pulse only for loading/waiting. Respect `MediaQuery.disableAnimations`.
9. **Thumb-reachable.** Primary actions live in sticky bottom bars; tap targets ≥ 44 logical px (§11).
10. **Same language for ID cards.** Identity screens (My ID, Profiles, forms) reuse the exact tokens and components (§10) so the app feels like one product, even though the mockup only covers the shop.

---

## 2. Colour tokens

All values **[Mockup]**; `rgba` shown as CSS. Flutter: `Color.fromRGBO(r,g,b,a)` or `Color(0xAARRGGBB)` (alpha `.58` ≈ `0x94`, `.4` ≈ `0x66`, `.14` ≈ `0x24`, `.08` ≈ `0x14`, `.09` ≈ `0x17`, `.15` ≈ `0x26`, `.2` ≈ `0x33`, `.6` ≈ `0x99`, `.45` ≈ `0x73`, `.07` ≈ `0x12`, `.88` ≈ `0xE0`, `.9` ≈ `0xE6`).

### 2.1 Accent (both themes)

| Token | Value | Use |
|---|---|---|
| `accent` | `#FFA51F` | primary button fill, selected tab, active step, switch on, accent chips, default pill |
| `onAccent` | `#0A0A0B` | text/icon on accent fills (always near-black, in both themes) |
| `accentGlow` | `0 10px 24px -12px rgba(255,165,31,.8)` | main CTA only (one per screen) |
| `linkHover` | `#FFC266` | pressed/hover state of accent text links and accent buttons |

### 2.2 Surface and text — dark theme

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0A0B` | scaffold |
| `card` | `#141417` | cards, inputs, back button (hero variant) |
| `raised` | `#1E1E22` | sheets, dialogs, raised promo card, tab pill base |
| `sunk` | `#101012` | empty/error card fill, recessed areas |
| `ink` | `#F5F5F0` | primary text, selected chip fill, toast bg |
| `mute` | `rgba(255,255,255,.58)` | secondary text |
| `faint` | `rgba(255,255,255,.4)` | labels, captions, strike prices |
| `line` | `rgba(255,255,255,.08)` | card borders, dividers |
| `line2` | `rgba(255,255,255,.14)` | input borders, outline buttons, dashed borders, sheet top border |
| `accSoft` | `rgba(255,165,31,.14)` | selected-row tint, info cards, removable chip fill |
| `accText` | `#FFB547` | accent-coloured **text** on `bg`/`card` (links, "Read more", step labels) |
| `danger` | `#FF6A55` | errors, destructive text/borders, cart badge fill |
| `ok` | `#3DD68C` | success, "approved shop" label, in-stock |
| `tabbg` | `rgba(30,30,34,.88)` | floating tab pill |
| `skel` | `rgba(255,255,255,.07)` | skeleton blocks |

### 2.3 Surface and text — light theme

| Token | Value | Use |
|---|---|---|
| `bg` | `#F2F0EA` | scaffold (warm paper) |
| `card` | `#FFFFFF` | cards, inputs |
| `raised` | `#FFFFFF` | sheets, dialogs |
| `sunk` | `#E9E6DD` | empty/error fills |
| `ink` | `#0A0A0B` | primary text, selected chip fill |
| `mute` | `rgba(10,10,11,.6)` | secondary text |
| `faint` | `rgba(10,10,11,.45)` | labels, captions |
| `line` | `rgba(10,10,11,.09)` | borders, dividers |
| `line2` | `rgba(10,10,11,.15)` | input borders, outline buttons |
| `accSoft` | `rgba(255,165,31,.2)` | tints |
| `accText` | `#9A5200` | accent **text** (the bright saffron fails contrast on white/paper) |
| `danger` | `#C8321F` | errors |
| `ok` | `#1B7A3A` | success |
| `tabbg` | `rgba(255,255,255,.9)` | tab pill |
| `skel` | `rgba(10,10,11,.07)` | skeletons |

### 2.4 Fixed colours (theme-independent)

| Token | Value | Use |
|---|---|---|
| `likedHeart` | `#FF5A45` | ♥ when wishlisted |
| `soldOutOverlay` | `rgba(10,10,11,.5)` | veil over sold-out product tile |
| `sheetScrim` | `rgba(0,0,0,.55)` | behind bottom sheets |
| `dialogScrim` | `rgba(0,0,0,.6)` | behind dialogs |
| `badgeFg` | `#FFFFFF` | text on `danger` badge |
| `stageBg` | `#0E0E10` | presentation stage only (mockup frame); **not used in the app** |
| `toastBg` / `toastFg` | `ink` / `bg` of the active theme | toast (inverted surface) |

### 2.5 Category tints (per category hue `h`)

| Theme | Tile fill | Mark (letter) colour |
|---|---|---|
| Dark | `hsla(h, 55%, 55%, .16)` | `hsl(h, 70%, 72%)` |
| Light | `hsla(h, 70%, 62%, .24)` | `hsl(h, 55%, 30%)` |

Flutter: `HSLColor.fromAHSL(.16, h, .55, .55).toColor()` (dark tile) — note Flutter HSL saturation/lightness are 0–1.

| id | Name | Short | Mark | Hue |
|---|---|---|---|---|
| 1 | Devotional Items | Devotional | D | 28 |
| 2 | Books & Booklets | Books | B | 205 |
| 3 | Apparel & Merchandise | Apparel | A | 345 |
| 4 | Event Tickets | Tickets | T | 265 |
| 5 | Handmade & Crafts | Handmade | H | 150 |
| 6 | Food & Snacks | Food | F | 12 |
| 7 | Other | Other | O | 45 |

Shops and products with no photo use the tint of their category (products) or a shop-specific hue (shops: derive `hue = hash(shop.id) % 360` if the server sends none; the mockup assigns hues 28/205/345/12/265 by hand). Real photos always replace the tint tile.

### 2.6 Rules

- Text on `accent` is always `onAccent`. Accent **text** on neutral surfaces uses `accText`, never raw `accent`.
- Never place `mute`/`faint` text on `accSoft` smaller than 12px (contrast, §11).
- Danger fills (confirm-destructive buttons) use `danger` with white text; danger outlines use 1px `danger` border + `danger` text.
- Do not add new colours. If a new state needs colour, reuse a semantic colour in §3.

---

## 3. Semantic colours and status chips

Semantic roles: **info** (neutral blue family used for "placed"/"claimed"), **warning** (amber `#FFC53D`/`#8A5A00`), **success** (`ok`), **error** (`danger`), **neutral** (grey `#A8A8B0`/`#55555C`), **special** (violet `#BBA2FF`/`#5B3BC4` for packed and cash-on-delivery).

**Chip anatomy [Mockup]:** pill (radius 99), padding `0 10`, gap 5, glyph + label, Archivo 700, 10 px (24-high in lists) / 11 px (26-high on detail) / 10 px (22-high in owner product rows and review sheet). Foreground = `fg` for the theme; background = `fg` at alpha `.14` (dark) / `.20` (light). No border.

### 3.1 Status chip table

`darkFg` is the foreground colour in the dark theme, `lightFg` in the light theme. Key = the server value (or UI-derived key).

| Key | Label | Glyph | darkFg | lightFg | Scope | Provenance |
|---|---|---|---|---|---|---|
| `pending_payment` | Awaiting payment | ◔ | `#FFC53D` | `#8A5A00` | order.status | Mockup |
| `placed` | Placed | ● | `#7CB2FF` | `#1F5FC4` | order.status | Mockup |
| `accepted` | Accepted | ✓ | `#FFB547` | `#A35400` | order.status | Mockup |
| `packed` | Packed | ▣ | `#BBA2FF` | `#5B3BC4` | order.status | Mockup |
| `shipped` | Shipped | → | `#4FD1C5` | `#0F7A70` | order.status | Mockup |
| `delivered` | Delivered | ✓ | `#3DD68C` | `#1B7A3A` | order.status | Mockup |
| `cancelled` | Cancelled | × | `#A8A8B0` | `#55555C` | order.status | Mockup |
| `rejected` | Rejected | ! | `#FF6A55` | `#B82A18` | order.status | Mockup |
| `pending` | Pending review | ◔ | `#FFC53D` | `#8A5A00` | shop.status | Mockup |
| `approved` | Approved | ✓ | `#3DD68C` | `#1B7A3A` | shop.status | Mockup |
| `suspended` | Suspended | ‖ | `#A8A8B0` | `#55555C` | shop.status | Mockup |
| `active` | Active | ● | `#3DD68C` | `#1B7A3A` | product.status | Mockup |
| `draft` | Draft | ○ | `#A8A8B0` | `#55555C` | product.status | Mockup |
| `out` | Out of stock | ! | `#FF6A55` | `#B82A18` | product.stock (0) | Mockup |
| `archived` | Archived | ▤ | `#A8A8B0` | `#55555C` | product.status | Mockup |
| `stock_low` | Only N left | ! | `#FFC53D` | `#8A5A00` | product.stock (1–3) | Mockup |
| `stock_ok` | In stock | ✓ | `#3DD68C` | `#1B7A3A` | product.stock (≥4) | Mockup |
| `awaiting_payment` | Awaiting payment | ◔ | `#FFC53D` | `#8A5A00` | payment_status | Designed here |
| `claimed` | Paid — awaiting seller | ◔ | `#7CB2FF` | `#1F5FC4` | payment_status | Designed here |
| `confirmed` | Payment confirmed | ✓ | `#3DD68C` | `#1B7A3A` | payment_status | Designed here |
| `disputed` | In dispute | ! | `#FF6A55` | `#B82A18` | payment_status | Designed here |
| `refund_due` | Refund due | ↺ | `#FFC53D` | `#8A5A00` | payment_status | Designed here |
| `refunded` | Refunded | ↺ | `#A8A8B0` | `#55555C` | payment_status | Designed here |
| `void` | No payment | ○ | `#A8A8B0` | `#55555C` | payment_status | Designed here |
| `written_off` | Closed by admin | ▤ | `#A8A8B0` | `#55555C` | payment_status | Designed here |
| `cod_pending` | Cash on delivery | ₹ | `#BBA2FF` | `#5B3BC4` | payment_status | Designed here |
| `cod_collected` | Cash collected | ✓ | `#3DD68C` | `#1B7A3A` | payment_status | Designed here |
| `valid` | Valid | ✓ | `#3DD68C` | `#1B7A3A` | idcard.validity | Designed here |
| `expiring` | Expires in {n} days | ◔ | `#FFC53D` | `#8A5A00` | idcard.validity | Designed here |
| `expired` | Expired | ! | `#FF6A55` | `#B82A18` | idcard.validity | Designed here |

Label wording for payment_status matches the existing web app's `PaymentStatusChip` so the two clients agree: Awaiting payment / Paid — awaiting seller / Payment confirmed / In dispute / Refund due / Refunded / No payment / Closed by admin / Cash on delivery / Cash collected.

### 3.2 Which chip where

- **Order lists (buyer & seller):** show the *order status* chip. If `payment_status` is one of `claimed`, `disputed`, `refund_due` show a **second** chip with the payment label (these need attention); otherwise suppress the payment chip to reduce noise. For status `pending_payment` only the order chip shows (identical colour to `awaiting_payment`).
- **Order detail:** both chips side-by-side under the order number.
- **Product card:** only the stock overlay (SOLD OUT) — chips appear in owner lists and the product page.
- **Owner product row:** status chip (22-high) + stock chip.
- **ID-card thumbnails:** validity chip (§10.1).

### 3.3 Dart sketch [Illustrative]

```dart
class ChipSpec { final String label, glyph; final Color darkFg, lightFg; const ChipSpec(this.label,this.glyph,this.darkFg,this.lightFg); }
Color chipBg(Color fg, Brightness b) => fg.withOpacity(b == Brightness.dark ? .14 : .20);
```
Unknown keys must degrade to label = raw key, neutral grey, no glyph (the mockup falls back to `#999`/`#555`).

---

## 4. Typography

### 4.1 Families [Mockup]

| Role | Family | google_fonts | Weights used | Fallback |
|---|---|---|---|---|
| Display | **Anton** | `GoogleFonts.anton` | 400 only | `Impact, sans-serif` |
| UI / body | **Archivo** | `GoogleFonts.archivo` | 400, 500, 600, 700, 800 | system sans |
| Mono labels | **DM Mono** | `GoogleFonts.dmMono` | 400, 500 | monospace |

UI fonts (Anton, Archivo, DM Mono) come from `google_fonts` (runtime fetch with its on-disk cache) with the fallbacks in the table above, so first paint never blocks on the network. Anton has no bold: never apply `fontWeight` to it. The **ID-card fonts are different: they must be bundled as assets** so card preview and export never depend on the network — the kit ships `assets/fonts/Gafata-Regular.ttf`; the M4 task is to download `Vidaloka-Regular.ttf` and `Roboto-Regular/Medium/Bold.ttf`, register them in `pubspec.yaml`, and assert they are loaded before exporting (doc 07 §fonts).

### 4.2 Anton ladder [Mockup]

Line-height is `.95`–`1.0` for Anton unless noted; mostly UPPERCASE (use `.toUpperCase()` in the widget, not `textCapitalization`). Letter-spacing `0` except where noted.

| Size | Used for |
|---|---|
| 46 | Home hero ("Shop the / diocese."), product tile initial letter |
| 44 | Payment amount (pay the seller) |
| 42 | Order-placed confirmation title |
| 40 / .95 | Tab-screen titles (Shop, Cart, Orders, Account, Profiles, My ID) |
| 34 | Order shop/customer name, status headings ("Application in review"), product price |
| 32 | Storefront name, product title |
| 30 | Promo headline |
| 28 | Shop stats numbers |
| 26 | Sub-screen titles (Checkout, Addresses…), account name, cart total, filter sheet title |
| 24 | Payment status title, my-shop name, review sheet name, dialog title, grand total |
| 22 | Checkout step headings, order totals |
| 20 | Large initials/marks |
| 14 | Small initials/marks, tab-bar mark |

### 4.3 Recurring text styles [Mockup]

| Style | Spec |
|---|---|
| Section label | DM Mono 500, 9, tracking +0.16em, UPPERCASE, `faint` |
| Input label | DM Mono 500, 9, +0.14em, UPPERCASE, `faint` (gap 6 to field) |
| Meta | DM Mono 500, 10–11, +0.06–0.1em, UPPERCASE, `faint`/`mute` |
| Photo caption | DM Mono 500, 8, +0.14em, UPPERCASE ("PHOTO", "PRODUCT PHOTO 1 / 4") |
| Body | Archivo 400, 13/1.5, `mute` |
| Body strong | Archivo 600, 13/1.3, `ink` |
| Card title | Archivo 700, 15/1.3, `ink` |
| Input text | Archivo 500, 14, `ink` (textarea 14/1.45) |
| Error | Archivo 500, 11, `danger` |
| Price | Archivo 700, 14, `ink`; strike Archivo 400, 11, `faint`, line-through |
| Primary button | Archivo 700, 13–15 (14 default) |
| Secondary button | Archivo 600, 13 |
| Chip | Archivo 600, 12 |
| Status chip | Archivo 700, 10 (11 on detail) |
| Tab label | Archivo 600, 9 |
| Badge | Archivo 700, 9, white |
| Product title | Archivo 600, 13/1.3, 2-line clamp |
| Shop name (under product) | Archivo 400, 11, `mute` |

Money amounts in tables/summary rows: Archivo 700 tabular figures (`FontFeature.tabularFigures()`); big money uses Anton.

### 4.4 Dart sketch [Illustrative]

```dart
TextStyle anton(double s, {Color? c, double h = .95}) => GoogleFonts.anton(fontSize: s, height: h, color: c);
TextStyle mono(double s, {Color? c, double ls = .14}) =>
    GoogleFonts.dmMono(fontSize: s, fontWeight: FontWeight.w500, letterSpacing: s * ls, color: c);
```

---

## 5. Spacing, radius, border, shadow

### 5.1 Spacing [Mockup]

| Token | Value | Notes |
|---|---|---|
| `screenPadding` | 20 | horizontal padding of scroll content; 16–18 on sticky bars |
| unit | 4 | most gaps are multiples of 4 (6, 8, 10, 12, 14, 16, 18, 20, 24) |
| grid gap | 12 × 18 | product grid (skeleton 12 × 16) |
| card padding | 14–16 | 16 default; 22 dialogs; 14 featured-shop cards |
| scroll bottom padding | 130 | on tab screens so content clears the floating bar; 240 on Cart (summary bar) |
| sticky bar padding | `12 16 26` | product bottom bar; bottom 26 includes home-indicator allowance |

### 5.2 Radius [Mockup]

99 pills/chips/badges; 28 top of sheets; 24 dialogs; 22 promo cards & tab pill & cart summary top; 20 cards (shop, category, empty); 18 tiles; 16 primary/secondary buttons & product tile; 15 tab item & icon tile 48; 14 inputs & inline buttons & product stepper; 13 "Pay now" button; 12 retry button & tab pills (my shop); 10 cart stepper; 6 skeleton lines; 2 grabber.

### 5.3 Border & shadow

- Card/hairline: `1px solid line`. Inputs, outline buttons, unselected chips: `1px solid line2`. Focused search: `1px solid accent`.
- Dashed (empty/error cards, add buttons): `1.5px dashed line2` — implement with `dotted_border` package or a `CustomPainter` (Flutter has no dashed border built in).
- Back button hero: no border, `card` fill.
- Logo ring (storefront): 4px `bg` border so the logo "cuts" into the banner.
- Shadows: only CTA glow `0 10px 24px -12px rgba(255,165,31,.8)`, promo glow `0 14px 30px -18px rgba(255,165,31,.9)`, confirm-tick glow `0 20px 40px -18px rgba(255,165,31,.9)`. Flutter: `BoxShadow(color: accent.withOpacity(.8), blurRadius: 24, offset: Offset(0,10), spreadRadius: -12)`.

---

## 6. Motion

All **[Mockup]** except where noted. Durations are milliseconds. Honour reduced motion by replacing each animation with an instant state change (shimmer/pulse → static).

| Name | Duration / curve | Effect | Flutter hint |
|---|---|---|---|
| `cydIn` | 400 · `Cubic(.19,1,.22,1)` | translateY 12→0 + opacity 0→1; staggered children by 40–60 ms (**[Designed here]** stagger) | `TweenAnimationBuilder` / `flutter_animate`'s `.fadeIn().slideY(begin: .03)` |
| toast in | 300 · same curve | same as cydIn | `AnimatedSlide` + `AnimatedOpacity` |
| `cydShim` | 1400 · easeInOut · loop | skeleton opacity .45 → .9 → .45 | one shared `AnimationController(repeat(reverse: true))`; `FadeTransition` |
| checking dot | 1000 · easeInOut · loop | same as shimmer, faster | same controller at 1 s |
| `cydPulse` | 1800 · easeOut · loop | ring scale .9 → 1.35, opacity .6 → 0; second ring delayed 900 | two `ScaleTransition`+`FadeTransition` offset by half period (waiting-for-seller indicator) |
| `cydPop` | 600 · `Cubic(.19,1,.22,1)` | scale .6 → 1.08 → 1 | `TweenSequence` (confirmation tick) |
| dialog pop | 300 · same | scale .6 → 1.08 → 1 compressed | `showGeneralDialog` + `ScaleTransition` |
| `cydSheet` | 420 · same | translateY 102% → 0 | `showModalBottomSheet` with custom `transitionAnimationController`, or `AnimationStyle(duration: 420ms, curve: Cubic(.19,1,.22,1))` |
| scrim | 250 (sheet) / 200 (dialog) · ease | opacity 0 → 1 | `barrierColor` fade |
| press | 180 | scale 1 → .97 on pointer down | `AnimatedScale` in `GestureDetector.onTapDown/Up/Cancel`; product cards and category tiles only |
| gallery dot | 300 | width 6 ↔ 18 (active) | `AnimatedContainer` |
| step bar | 300 | segment colour line2 → accent | `AnimatedContainer` |
| tab bg | 300 | selected item bg transitions | `AnimatedContainer` |
| switch | 200 | knob slide + track colour | custom `AnimatedAlign` |
| snap paging | — | promo carousel & gallery snap | `PageView` / `ListView` + `PageScrollPhysics`; promo uses `viewportFraction ≈ 300/390` |
| toast dismiss | auto 2800 | — | `Timer` in the toast controller |

Skeletons share one controller for the whole screen so they pulse in sync. Do not animate list items on every rebuild — run `cydIn` once per screen entry.

---

## 7. Iconography

The mockup uses typographic glyphs rendered in Archivo (or Anton for marks). Keep glyph rendering for chips/marks (consistent with the status table); for interactive icons use the mapping below to avoid font-coverage issues (some glyphs such as ◔ ▣ ‖ may be missing from Archivo on Android — bundle a fallback or draw them as small vector shapes).

| Mockup glyph | Meaning | Flutter implementation |
|---|---|---|
| ← | back | `Icons.arrow_back` (Material) / `CupertinoIcons.back` on iOS, 18 px inside the 40 px circle |
| ⌕ | search | `Icons.search` |
| × | clear / remove | `Icons.close` |
| ↺ | recent search / refund | `Icons.history` / `Icons.undo` |
| ♡ / ♥ | wishlist off / on | `Icons.favorite_border` / `Icons.favorite` (`likedHeart` when on) |
| ⓘ | info | `Icons.info_outline` |
| ⛪ | parish | `Icons.church_outlined` (Material Symbols) — use `Icons.church` if the outlined glyph is missing; never ship emoji |
| → | chevron / shipped | `Icons.chevron_right` for rows; the `→` glyph inside the shipped chip |
| + / − | accordion, stepper | `Icons.add` / `Icons.remove` (text glyph acceptable in steppers) |
| ✓ | success | `Icons.check` |
| ! | error | text `!` in Anton 24 (error card) or `Icons.priority_high` |
| ? | no results | text `?` in the empty tile |
| ☼ | empty home | `Icons.wb_sunny_outlined` |
| ◔ | pending | `Icons.hourglass_empty` (or a custom 270° arc painter) |
| ‖ | suspended | `Icons.pause` |
| ₹ | cart / rupee | text `₹` (Archivo has it); never `Icons.currency_rupee` inside chips |
| ▣ ▤ ○ ● | packed / archived / draft / active | text glyph if the font has it; else `Icons.inventory_2_outlined` / `Icons.archive_outlined` / `Icons.circle_outlined` / `Icons.circle` (size 8) |
| copy | copy-row action | `Icons.content_copy` |
| camera / photo | add photo | `Icons.photo_camera_outlined` / `Icons.add_photo_alternate_outlined` |
| share | share card | `Icons.ios_share` |

**Tab-bar marks rule [Mockup + Designed here]:** the tab bar uses a *letter/glyph mark in Anton 14* above a 9 px label, not icons. Marks for this app: **My ID → `ID`**, **Profiles → `P`**, **Shop → `S`**, **Cart → `₹`**, **Orders → `O`**, **Account → `A`**. Marks must be a single visual unit (≤ 2 characters). Do not substitute Material icons in the tab bar.

---

## 8. Layout rules

### 8.1 Reference sizes

- Reference frame **390 × 844** (iPhone 14/15). Design for 360 × 800 (small Android) and 412 × 915 (large Android) as the supported range; 320 wide is the hard minimum.
- Horizontal screen padding 20 at ≥ 360; 16 at < 360.
- Product grid: 2 columns at < 600 logical width; 3 columns 600–839; 4 columns ≥ 840 (tablet, **[Designed here]**). Column width = `(width − 2×20 − 12)/2` at phone widths so the 4:5 tile scales.
- Max content width on tablets: 640 centred (forms and order screens); grids may go to 960.

### 8.2 Safe areas

- Wrap screens in `SafeArea(bottom: false)` and handle the bottom manually: tab screens leave `130` px bottom padding; sticky-bar screens place the bar inside `SafeArea(top: false)` with `max(26, viewPadding.bottom + 12)`.
- Status bar: transparent; icons follow theme (`SystemUiOverlayStyle.light` in dark, `.dark` in light). Hero screens (storefront, product) draw under the status bar; their back button sits at top 56 / left 18 (hero variant) i.e. `viewPadding.top + 12` on devices where the top inset differs.
- Android gesture nav: treat `viewPadding.bottom` ≥ 24 as authoritative; never hard-code 34.

### 8.3 Keyboard

- Forms scroll (`SingleChildScrollView` + `resizeToAvoidBottomInset: true`); the focused field must remain visible (`Scrollable.ensureVisible` on focus).
- Sticky CTAs rise **with** the keyboard on form screens (address form, UTR entry, product form) — wrap in `AnimatedPadding(viewInsets.bottom)`; on non-form screens they stay put.
- The floating tab bar is hidden whenever the keyboard is open.
- Use `textInputAction: next` through forms and `done` on the last field; numeric fields use `TextInputType.number` (UTR, pincode, quantity), `TextInputType.phone` (mobile), `TextInputType.numberWithOptions(decimal: true)` (price).

### 8.4 Bottom-bar offsets [Mockup]

| Element | Bottom offset |
|---|---|
| Floating tab bar | outer padding `10 14 18`; total height ≈ 92 |
| Cart summary bar | `bottom: 92` (sits above the tab bar), radius `22 22 0 0` |
| Scroll content on tab screens | `padding-bottom 130` |
| Cart scroll content | `padding-bottom 240` |
| Toast | 104 above bottom on tab screens; 100 on product, checkout, product form, shop order, address form; 30 elsewhere |

Screens **without** the tab bar [Mockup]: storefront, product, checkout, payment, confirmation, order detail, address form, shop order, product form. Addresses list keeps content padding 130 but hides the bar. **[Designed here]:** also hide the bar on Pay-the-seller, Pay-your-orders, Order chat full view, Dispute resolve, ID card preview, holder photo, all forms; show it on tab roots and one-level lists (Categories, Search is full-screen without the bar).

---

## 9. Component catalogue

Each entry: **Spec** (measurements) → **States** → **Notes**. All measurements logical px, **[Mockup]** unless tagged.

### 9.1 Back button
- 40×40 circle, 1px `line2` border, "←" 16 (Archivo), `ink`. Hero variant (over banner/gallery): `card` fill, no border, positioned top 56, left 18.
- Pressed: opacity .7. Semantics: label "Back". Always pops the route; never exits the app from a root.

### 9.2 Primary button (accent)
- Fill `accent`, text `onAccent`, radius 16, Archivo 700 14. Heights: **56** final CTAs (Place order, Pay now, Add to cart in sticky bar uses 52), **54** (Proceed to checkout), **52**, **50** inline (radius 14), **46** compact "Pay now" (radius 13), **44** retry (radius 12, padding `0 22`).
- Glow `accentGlow` on one CTA per screen only.
- Disabled: fill `accent` at .35 opacity, no glow, not tappable. Loading: label replaced by 18 px spinner (`onAccent`) + "Placing order…" style text; keep width stable.
- Pressed: colour → `linkHover`.

### 9.3 Secondary (outline) button
- Height 50, radius 16, border 1px `line2`, text `ink` Archivo 600 13, transparent fill. Disabled: .4 opacity. Used for Cancel, Back, "Keep it"/"Back" dialog left button, sign out (with danger text).

### 9.4 Danger button
- **Outline:** border 1px `danger`, text `danger` Archivo 700 13, height 50 radius 16 (Reject, Cancel order, Sign out).
- **Filled (confirm destructive):** fill `danger`, text white, Archivo 700 13/14; disabled `danger` at .4 (review sheet reason confirm until ≥ 5 chars; mockup behaviour).

### 9.5 Text button & dashed add button
- Text button: Archivo 600 13 `accText`, no fill, min 44 tap height.
- Dashed add (Add address, Add photo): height 50 radius 16, `1.5px dashed line2`, text `mute` Archivo 600 13 with "+" prefix; photo tile variant is square (aspect 1).

### 9.6 Chips
- **Filter chip:** height 36, padding `0 13–14`, radius 99, Archivo 600 12. Selected: fill `ink`, text `bg`, border `ink`. Unselected: transparent, `mute`, border `line2`. Count suffix " · {n}" in order filters.
- **Form chip** (address label, deanery select in forms): height 34, same colours.
- **Removable chip:** height 30, fill `accSoft`, `accText` text, trailing "×".
- **Info chip** (parish/deanery on storefront): height 26, padding `0 10`, fill `card`, 1px `line`, Archivo 600 11.
- **DEFAULT pill:** solid `accent`, `onAccent`, Archivo 700 9 +.06em, padding `3 8`, radius 99.
- **Status chip:** §3.

### 9.7 Cards
- Base: `card` fill, 1px `line`, radius 20 (list cards 16–20), padding 16. No shadow. Tappable cards have a 150 ms pressed fill to `raised`.
- **Info card:** `accSoft` fill, no border, radius 16, padding 14, body text `ink`/`mute` (awaiting/pending notices).
- **Ended card:** `sunk` fill, 1px `line`, radius 16 (cancelled/rejected explanations).
- **Order card:** padding 14, radius 20; row 1 = order number (mono 11) + status chip right; row 2 = overlapping 44×44 thumbs (radius 12, 2px `card` border, margin-left −10 after the first) + shop name Archivo 700 14 + "{n} items · ₹x.xx"; footer mono date.

### 9.8 Inputs
- **Label** above (DM Mono 500 9 +.14em UPPERCASE `faint`), gap 6.
- **Field:** height 50, radius 14, 1px `line2`, `card` fill, padding `0 14`, Archivo 500 14. Placeholder `faint`. **Focus:** border `accent` (1px; do not thicken). **Error:** border `danger` + message below (Archivo 500 11 `danger`, margin-top 6). **Disabled:** fill `sunk`, text `mute`.
- **Textarea:** padding `12 14`, 3 rows default (grow to 6), line-height 1.45.
- **Search field:** height 48, border 1px `accent` always (the search screen), leading ⌕, trailing × when non-empty.
- **Keyboard types:** mobile `phone` (10 digits, placeholder "98765 43210", format `#####-#####` on display, strip spaces on submit), pincode `number` max 6, UTR `number` max 12 (spaced display, §9.20), price `numberWithOptions(decimal:true)`, stock `number`, email `emailAddress`, password obscured with show/hide toggle, free text `text` with `TextCapitalization.sentences` (names: `words`).
- Required marker: none in the mockup; errors appear on submit/blur only.

### 9.9 Radio row
- 20 px circle, 2px border (`line2`; `accent` when selected) + 10 px `accent` dot when selected. Row height 46 (sort options) or auto (dispute reasons); entire row tappable; label Archivo 500 14.

### 9.10 Switch
- 44×26 pill; off: `line2` track, on: `accent` track; 22 px white knob with 2 px inset; 200 ms. Row container height 54–56, radius 16, `card` fill, 1px `line`, label left. Semantics: `toggled`.

### 9.11 Quantity stepper
- **Product bar stepper:** height 52, radius 14, 1px `line2`; buttons 40×50; count 22 wide, Archivo 700 15, centred.
- **Cart stepper:** height 34, radius 10; buttons 32×32; count 20 wide Archivo 700 13. At limit (1 or stock/99) the corresponding button is .35 opacity and inert. Decrementing from 1 on the cart removes after confirmation toast with **Undo** action (**[Designed here]**).

### 9.12 Price text
- `₹` + integer part + `.` + two decimals, e.g. `₹249.00`; thousands grouping en-IN (`₹1,24,500.00`) in lists and totals. Strike (MRP) shown only when `compare_price_paise > price_paise`: Archivo 400 11 `faint`, `TextDecoration.lineThrough`, margin-left 6. Discount pill "{n}% off": `accSoft`, `accText`, Archivo 700 10, radius 99, `n = round((1 − price/mrp)×100)`.
- Dart [Illustrative]: `String fmt(int paise) => '₹' + NumberFormat('#,##,##0.00','en_IN').format(paise/100);` (verify grouping against `intl` en_IN).

### 9.13 Product card (grid)
- Width = column; tile `AspectRatio(4/5)`, radius 16, tinted fill (category) or photo, 1px `line`. Centre initial Anton 46 in `markFg`; "PHOTO" caption DM Mono 500 8 +.14em bottom-left (10, 10) — only when no real photo.
- Heart button: 40×40 circle, `card` fill, top 6 right 6; glyph ♡/♥.
- **SOLD OUT:** `soldOutOverlay` veil + centred pill (DM Mono 500 10 +.14em white, 1px `rgba(255,255,255,.5)` border, padding `7 10`, radius 99).
- Below tile: title Archivo 600 13/1.3 (2-line clamp), shop name Archivo 400 11 `mute` (margin-top −3), price row. **Storefront variant:** no shop name, no PHOTO caption.
- Press: scale .97 (180 ms). Cached image with tint placeholder fade 200 ms.

### 9.14 Skeletons
- Blocks use `skel` fill, shimmer §6. Product skeleton: tile + three lines 12px@90%, 10px@55%, 12px@38% radius 6, grid gap 12×16. List skeleton: card-height blocks radius 20. Always render the **same layout** as the loaded content to avoid jumps; show after 150 ms delay to avoid flash.

### 9.15 Empty and error cards
- Container: `1.5px dashed line2`, radius 20, `sunk` fill, padding `32–40 20`, centred column.
- Icon tile 56×56 radius 16. **Error:** `card` fill, `danger` "!" Anton 24. **Empty:** `accent` fill + `onAccent` glyph, or neutral `card` fill with `mute` glyph for "no results".
- Title Archivo 700 15/1.3; body Archivo 400 12/1.5 `mute`, max-width 240–250; gap 6 / 14.
- Retry button "Tap to retry": height 44, padding `0 22`, radius 12, accent. Offline errors say "You're offline" (**[Designed here]**) with the same card.

### 9.16 Bottom sheet
- Scrim `sheetScrim`; sheet `raised`, radius `28 28 0 0`, border-top 1px `line2`, padding `12 20 30`, grabber 40×4 radius 2 `line2` centred (margin-bottom 16). Max height 80% (filter) / 86% (review/confirm); content scrolls; sticky CTA row at the bottom inside the sheet. Title Anton 26. Dismiss: drag down, scrim tap, back button (except while a request is in flight → inert).
- Keyboard: sheet content padded by `viewInsets.bottom`.

### 9.17 Dialog
- Inset 24 l/r, centred, `raised`, 1px `line2`, radius 24, padding 22. Title Anton 24 UPPERCASE; body Archivo 400 13/1.5 `mute`. Two buttons: height 48, radius 14, flex 1, gap 8. **Left = safe/back (outline) — wording must match the action** (use "Back" or "Not now"; the mockup's "Keep it" is only valid for delete/cancel-keep flows). **Right = confirm** (accent/`onAccent`, or `danger`/white for destructive). Scrim `dialogScrim`. Dismissible by scrim unless request in flight.

### 9.18 Toast
- Position: bottom offsets §8.4, left/right 16, padding `14 16`, radius 16, fill `toastBg` (ink), text `toastFg`, Archivo 500 13; optional action Archivo 700 13 `#FFA51F`. Auto-dismiss 2800 ms (extend to 5 s when an action is present **[Designed here]**). One toast at a time; a new one replaces the old. `liveRegion` semantics.

### 9.19 Floating pill tab bar
- Outer: absolute bottom, padding `10 14 18`, background gradient `to top, bg 60%, transparent` (ignore pointer on the transparent part).
- Pill: row, gap 4, padding 8, radius 22, fill `tabbg`, 1px `line`, `BackdropFilter(blur 20)`.
- Item: `Expanded`, padding `11 4 9`, radius 15, column gap 5, mark Anton 14, label Archivo 600 9. Selected: fill `accent`, mark/label `onAccent`. Unselected: transparent, `mute`. Transition 300 ms.
- **Badge:** only on **Cart** (quantity total) and **Shop** (needs-action count, **[Designed here]**, from `GET /shop/orders/action-count`, see doc 03). Position top 4 right 14, min 16×16, padding `0 4`, radius 99, `danger` fill, white Archivo 700 9; hide at 0; cap display at "99+".
- Role-based first tab: `My ID` (holders) / `Profiles` (admin, user). Six candidate marks, five shown. Implementation: `StatefulShellRoute.indexedStack` with branch order `[id|profiles, shop, cart, orders, account]`; keep each branch's state alive.
- Hidden on screens listed in §8.4 and while the keyboard is open.

### 9.20 UTR input (12 digits, grouped 4-4-4) [Designed here]
- Field behaves as 9.8 with `TextInputType.number`, digits only, max 12; a `TextInputFormatter` inserts a space after each group of four for display (`4291 8830 1127`); on submit send digits only (`normalizeUtr` strips spaces and hyphens, mirrors the backend). Mono 500 18 +.08em text for legibility, height 56.
- Helper (idle): "12-digit UPI Ref No (not the Transaction ID). Find it in your UPI app under the payment details." Error (on blur or submit when ≠ 12 digits): "Enter the 12-digit UPI Ref No exactly as your UPI app shows it". Valid: a small ✓ in `ok` at the right.
- Paste support: strip non-digits from pasted text; if > 12 digits take the first 12 and toast "Pasted number was longer than 12 digits — check it".

### 9.21 Copy-row [Designed here]
- Row: label (mono 9 `faint`) above value (Archivo 700 15, or Anton 24 for the big variant — seller UPI ID uses `big`), right-aligned 44×44 copy icon button. Container `card`, 1px `line`, radius 16, padding `12 8 12 14`. Tap anywhere copies: `Clipboard.setData`, haptic light, toast "{label} copied". The value `wordBreak` anywhere (UPI IDs are long). Semantics label "Copy {label}".

### 9.22 Countdown pill [Designed here]
- Pill radius 99, height 28, padding `0 12`, `accSoft` fill, `accText`, mono 500 12 with tabular figures: `mm:ss` under one hour, `h:mm:ss` over. Under 5 minutes: fill `danger` at .14, text `danger`. Ticks every 1 s locally from the server's `pay_seconds_left`/`confirm_seconds_left` (do not trust the device clock; re-sync on every fetch). At 0 show "Time's up" and trigger a refetch.

### 9.23 Timeline stepper (order detail) [Mockup]
- Five nodes `placed → accepted → packed → shipped → delivered`: node 28 px circle (done: `accent` fill + `onAccent` ✓; current: `accent` ring 2px + `accSoft` fill; future: 1px `line2`), connectors 2 px (`accent` when passed, `line2` otherwise), labels Archivo 600 10 under nodes. For `pending_payment` show an extra first node "Pay" **[Designed here]**. For cancelled/rejected show the *ended card* instead of the timeline.

### 9.24 Chat bubbles [Designed here]
- Container padding 16; bubble max-width 78%, padding `10 12`, Archivo 400 14/1.4, radius 18 with the tail-side corner 6.
- **Own message** (viewer): right-aligned, fill `accent`, text `onAccent`. **Counter-party** (buyer↔seller): left-aligned, `card` fill, 1px `line`, `ink`. **Admin:** left-aligned, `accSoft` fill, 1px `accent` at .4, with a "CYD ADMIN" mono 9 tag above. **System** (e.g. "Payment confirmed"): centred, no bubble, mono 10 `faint`, hairline either side.
- Sender label (mono 9 UPPERCASE `faint`) above the first bubble of a run; timestamp (mono 9 `faint`) under the last bubble of a run, `h:mm a` or "12 Oct".
- Composer: sticky, height 50 field radius 14 + 50×50 accent send button; disabled with note "This chat is read-only" when `read_only`/`chat_read_only`.

### 9.25 Evidence thumbnail [Designed here]
- 96×96 radius 14, 1px `line`, `cover` fit; uploader label mono 9 beneath ("BUYER · 12 OCT 18:04"); tap opens a full-screen viewer (`InteractiveViewer`, pinch zoom, dark scrim, close ×). Add tile: dashed 96×96 with camera icon. Images load from signed URLs that expire in 10 minutes → on 403/expired, refetch the list and retry once.

### 9.26 QR card [Designed here]
- `card` fill, 1px `line`, radius 20, padding 16, centred QR **180×180** on a **white** rounded (12) 12-px-padded plate (QR must stay dark-on-light in both themes). Caption Archivo 400 12 `mute`: "Scan with any UPI app. If the app refuses, copy the UPI ID above instead." Package: `qr_flutter`. Data = `payee.upi_link`.

### 9.27 App bars
- **Tab root bar:** none; the title is page content (Anton 40/.95) with an optional right-side action (44 circle).
- **Sub-screen bar:** 40 back button left, title Anton 26 below or inline (screen-dependent; checkout/addresses use inline row: back + title + spacer). Height ≈ 56 incl. top inset handling in §8.2. No border; the content scrolls beneath without a bar background until scroll offset > 8, then a 1px `line` bottom divider fades in (**[Designed here]**).

### 9.28 Avatar
- Circle, initials Anton (size/2.4) in `markFg`, tinted by hue. Sizes: 42 (home), 56 (account), 52 (my shop), 84 (storefront logo with 4px `bg` ring), 96 (seller-state glyph), 104 (confirmation tick, accent fill). Photo avatars (`cached_network_image`) crop to circle with tint fallback.

### 9.29 Section label
- DM Mono 500 9 +.16em UPPERCASE `faint`, margin-bottom 10, optional right-aligned count/action in the same style (`accText` for action).

### 9.30 Key/value rows
- Row: label Archivo 400 12 `mute` (left), value Archivo 600 13 `ink` (right, right-aligned, wraps), padding `10 0`, hairline `line` between rows. Totals row: label Archivo 700 14, value Anton 22.

### 9.31 Selectable address / method cards
- Card with 20 px radio on the left (§9.9); selected: border 1.5 `accent`, fill `accSoft`; unselected: 1px `line`, `card`. Content: name · phone (Archivo 600 13), address lines (Archivo 400 12 `mute`).

---

## 10. Extending the language to non-shop screens [Designed here]

The mockup does not cover ID-card features. Use the same tokens and components with these concrete measurements.

### 10.1 Member rows / ID-card thumbnails (Profiles list)
- Card: `card`, 1px `line`, radius 20, padding 14, height ≥ 84.
- Left: **photo thumb 56×70 (4:5)**, radius 12, 1px `line`; no photo → tinted tile with initials (hue from `hash(name)%360`), Anton 20.
- Middle: name Archivo 700 15 (1 line), line 2 `{designation} · {level}` Archivo 400 12 `mute` (1 line), line 3 `{deanery} · {parish}` mono 10 `faint` (1 line).
- Right: validity chip (24 high) top-right; below it a 32×32 chevron. Long-press → action sheet (Preview card · Edit · Share · Delete).
- Skeleton: photo block + three lines at 70%/50%/40%.

### 10.2 Tables → cards
Wherever the web uses a table (profiles, users, shops, orders), render **one card per row** in a vertical list; show at most three data lines + one chip; move secondary columns into the detail screen. No horizontal scrolling tables on mobile. Sorting/filtering via the filter sheet (§10.3).

### 10.3 Filter sheet
- Same sheet as Search (§9.16). Sections as section label + chip groups (wrap, gap 8) or radio rows; sticky CTA "Show {n}"; secondary "Reset" text button top-right. Applied filters show as removable chips (§9.6) in a horizontally scrolling row under the search field.

### 10.4 Form sections
- Section label (§9.29) + a `card` group, or plain fields with 16 gap. Fields stack single column; related pairs (city + pincode, price + MRP) use two columns with 12 gap. Read-only values (computed validity, serial) use a disabled field.
- Dropdowns (deanery → parish, level, designation) open a **searchable bottom sheet** (list rows height 52, current value with ✓) rather than a Material dropdown. Dependent fields (parish) are disabled with helper "Choose a deanery first".
- Photo field: 96×120 (4:5) tile; actions "Take photo" / "Choose from gallery"; crop UI per ID spec (doc 05); size/format hints in helper text.
- Save bar sticky: primary CTA; leaving with unsaved changes → dialog "Discard changes?" (left "Keep editing", right danger "Discard").

### 10.5 Stats tiles
- Three tiles in a row (gap 8): `card`, 1px `line`, radius 16, padding 14; number Anton 28, label mono 9 `faint`. Used on My shop (Products / To confirm / To ship — doc 11 DB-13) and admin dashboards.

### 10.6 Destructive confirmations
- Dialog (§9.17), danger right button, specific verb ("Delete profile", "Suspend shop"), consequence sentence, never "Are you sure?". Where a reason is mandatory (suspend, reject, resolve dispute) use a bottom sheet with a textarea and a danger-filled confirm disabled until ≥ 5 characters (the mockup's review-sheet behaviour).

### 10.7 ID-card preview
- Full-screen, `stageBg`-style dark backdrop regardless of theme; card image fit-width with 20 px margin and radius 12; actions row at bottom: **Share**, **Save PDF**, **Print** (secondary buttons, height 50). Printed card typography uses Gafata (`assets/fonts`) — keep it out of the UI themes.

### 10.8 Auth
- Login: Anton 40 "SIGN IN", username + password inputs (§9.8), primary 56 CTA, `login-overlay.jpg` as a darkened hero (opacity .35) behind the title area. Error text under the form (not a toast).

---

## 11. Accessibility rules

1. **Contrast:** body text `ink`/`mute` on `bg`/`card` ≥ 4.5:1 in both themes; **never** use raw `#FFA51F` for text on `card`/`bg` in light theme (it is ~1.9:1) — use `accText`. `faint` is for non-essential labels only (≥ 9 px mono + uppercase tracking compensates; if the user increases text scale, they still pass because they are decorative duplicates of better-labelled controls). Status chip fg/bg pairs were chosen for ≥ 4.5:1 against their 14/20 % tint.
2. **Tap targets ≥ 44×44:** icon buttons use `SizedBox(44,44)` hit area even when drawn 40; steppers' 32×32 buttons get `InkResponse` hit slop to 44; chips (height 36) expand vertically with `MaterialTapTargetSize.padded` or extra `Padding`.
3. **Semantics:** every icon-only button has a `Semantics(label:)`/`tooltip`; product card reads "{title}, {shop}, {price}, {stock state}, wishlist {on/off}"; status chips read their label (not the glyph — wrap the glyph in `ExcludeSemantics`); tab items read "{label}, tab {i} of {n}" and "{n} items" for badges; countdown announces `liveRegion` at 5 min, 1 min, 0; toasts `liveRegion: true`; QR has `Semantics(label: 'UPI payment QR code')`; copy-row announces "Copied".
4. **Text scale:** support 1.0–1.3 (clamp via `MediaQuery.withClampedTextScaling(minScaleFactor: 1, maxScaleFactor: 1.3)` at the root). Layouts must not clip: allow wrapping in chips ≥ 1.15 by letting height grow (`constraints: minHeight` not `height`); Anton titles use `FittedBox`/`maxLines` with ellipsis; the tab bar labels stay 9 px × scale but the pill grows (tab marks do not scale beyond 1.15).
5. **Colour independence:** statuses always combine colour + glyph + label. Errors show text, not only a red border.
6. **Focus & order:** logical tab order for external keyboards; dialogs trap focus; sheets restore focus to the trigger on close.
7. **Motion:** honour `disableAnimations`; no auto-playing carousels (the promo carousel does not auto-advance).
8. **Touch feedback:** all tappables give pressed feedback; destructive actions require a confirm step; do not rely on long-press alone for any action.
9. **Language:** `en-IN`; currency announced as "rupees"; UTR digits are read digit-by-digit (`Semantics(label: digits.split('').join(' '))`).
10. **Time-limited actions** (30-min pay window) must not auto-submit; show the countdown in text, not only colour.

---

## 12. Theming rules

- The mockup's default is **dark**, with a single Dark/Light toggle row in Account.
- **Recommended behaviour [Designed here]:** *Follow system* by default, with Account → Appearance offering **System / Dark / Light** (three radio rows in a bottom sheet). Persist in `shared_preferences` (`theme_mode`). First launch on a system without a preference → dark (matches the mockup).
- Switching animates tokens with a 300 ms cross-fade (`AnimatedTheme`), not a rebuild flash.
- Both themes must be tested for every screen; the golden tests in doc 11 cover dark + light for each shared component.
- `ThemeData` is a thin Material 3 shell (`useMaterial3: true`, `colorScheme` seeded from tokens, `splashFactory: NoSplash.splashFactory` + custom pressed colours) — real styling comes from `CydTokens` (below) and the component widgets; avoid default Material widget looks (no `ElevatedButton` default shapes).

### 12.1 `ThemeExtension<CydTokens>` shape [Illustrative — uncompiled]

```dart
@immutable
class CydTokens extends ThemeExtension<CydTokens> {
  const CydTokens({
    required this.bg, required this.card, required this.raised, required this.sunk,
    required this.ink, required this.mute, required this.faint,
    required this.line, required this.line2,
    required this.accent, required this.onAccent, required this.accSoft, required this.accText,
    required this.danger, required this.ok, required this.tabBg, required this.skel,
    required this.isDark,
  });

  final Color bg, card, raised, sunk, ink, mute, faint, line, line2;
  final Color accent, onAccent, accSoft, accText, danger, ok, tabBg, skel;
  final bool isDark;

  static const dark = CydTokens(
    bg: Color(0xFF0A0A0B), card: Color(0xFF141417), raised: Color(0xFF1E1E22), sunk: Color(0xFF101012),
    ink: Color(0xFFF5F5F0), mute: Color(0x94FFFFFF), faint: Color(0x66FFFFFF),
    line: Color(0x14FFFFFF), line2: Color(0x24FFFFFF),
    accent: Color(0xFFFFA51F), onAccent: Color(0xFF0A0A0B),
    accSoft: Color(0x24FFA51F), accText: Color(0xFFFFB547),
    danger: Color(0xFFFF6A55), ok: Color(0xFF3DD68C),
    tabBg: Color(0xE01E1E22), skel: Color(0x12FFFFFF), isDark: true,
  );
  // light: bg F2F0EA, card/raised FFFFFF, sunk E9E6DD, ink 0A0A0B, mute .6, faint .45, line .09, line2 .15,
  //        accSoft .2, accText 9A5200, danger C8321F, ok 1B7A3A, tabBg .9 white, skel .07

  @override CydTokens copyWith(/* … */) => this;
  @override CydTokens lerp(ThemeExtension<CydTokens>? other, double t) => /* Color.lerp each */ this;
}
extension CydX on BuildContext { CydTokens get cyd => Theme.of(this).extension<CydTokens>()!; }
```
(Alpha bytes: `.58→0x94`, `.4→0x66`, `.08→0x14`, `.14→0x24`/`0x24`, `.88→0xE0`, `.07→0x12`.) Generate values from `design/tokens.json` rather than retyping; a unit test must assert that `CydTokens.dark/light` equal the JSON.

---

## 13. Responsive and platform notes

- **Android first:** edge-to-edge (`SystemChrome.setEnabledSystemUIMode(edgeToEdge)`), predictive back supported (`PopScope`); back on a tab root goes to the first tab, then exits.
- **iOS:** `CupertinoPageTransitionsBuilder` swipe-back on pushed routes; same visuals otherwise.
- Pull-to-refresh on lists (Orders, Shop, Profiles) with an accent `RefreshIndicator`.
- Image sizes requested from the API: product tile 400 px wide, gallery 1080, avatar 160 (use `?w=` if the server supports resizing, else downscale client-side with `cacheWidth`).
- Haptics: light on add-to-cart, copy, tab change; medium on confirming destructive actions.

---

## 14. Component-to-screen quick reference

| Component | First used on |
|---|---|
| Product card, filter chips, skeleton | Shop home, Search, Storefront |
| Stepper (product) + sticky bar | Product |
| Cart stepper + summary bar | Cart |
| Selectable address card, checkout stepper | Checkout |
| Copy-row, QR card, UTR input, countdown pill | Pay the seller |
| Status chips (order + payment), timeline, chat, evidence | Order detail |
| Review bottom sheet, filter pills | Admin shops / disputes |
| Member row, validity chip, form sections | Profiles, profile form |

---

## 15. Do / Don't

- **Do** read colours from `context.cyd`, spacing from constants, fonts from the text-style helpers.
- **Do** keep one accent CTA per screen; secondary actions use outline.
- **Do** show skeletons with the real layout, errors in the dashed card with retry.
- **Don't** use Material elevation, default `Card`, `ListTile` dividers or default `Chip`.
- **Don't** introduce new colours/gradients; **don't** use shadows other than the three listed.
- **Don't** use Anton for body or for numbers inside dense tables.
- **Don't** hard-code copy that the server dictates (error messages come from the API `message`, doc 03 §Errors).

---

## 16. Token export checklist

1. `design/tokens.json` is canonical; the Flutter `tokens.dart` is generated or hand-synced with a test.
2. Add every status key in §3.1 to `StatusChips.map`; unknown keys fall back neutral.
3. UI fonts come from `google_fonts` (nothing to register); the ID-card fonts (Gafata, Vidaloka, Roboto) are bundled and registered in `pubspec.yaml` (Gafata at M0, the rest at M4).
4. Provide `CydTokens.dark/light`, `AppTheme.dark/light`, `ThemeMode` provider persisted in `shared_preferences`.
5. Build the component widgets of §9 in `lib/core/widgets/` before any feature screen; every feature screen composes them.
