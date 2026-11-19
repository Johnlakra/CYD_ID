# 07 · ID card rendering — exact layout, fonts, scaling and export

> **Audience:** the engineer (or agent) who builds the `CydIdCard` widget and the export/share/print
> pipeline. **Source of truth:** the web component `src/components/IDCard.jsx` in `Johnlakra/CYD_ID`
> (read in full while writing this document), plus the three background images in
> `assets/idcard/`. Every number below is copied from that file unless it is marked
> **Derived** (computed from a source number) or **Mobile decision** (the web app does not define it).
>
> **Status of code in this document:** every Dart snippet is *illustrative and has never been
> compiled* (the kit was written without a Flutter toolchain, see `00-OVERVIEW.md` D10). The geometry
> tables are the contract; the snippets only show one way to express them.

---

## 0. What you are building, in one paragraph

A **fixed-size, print-style ID card**, 146.3 mm × 221.8 mm (portrait). It is a full-bleed background
picture (one of three, chosen by the member's *level*) with **only the variable data drawn on top**:
a photo, the name, the designation, six value lines, a postal address and a footer line with the
issue date. All *labels* ("Deanery", "Parish", …), the diocese header, the two signatures and the
coloured bands are **part of the background picture**, not text. The card is shown on screen (preview),
exported as a PNG, shared, saved and printed. There is **no QR code, barcode, back side, or PDF** in
the web app; the mobile app adds PDF/print (improvement I2 in `00-OVERVIEW.md`).

---

## 1. Facts, assumptions and unknowns

| # | Statement | Status |
|---|---|---|
| 1.1 | Card box is `146.3mm × 221.8mm`, `position: relative`, `overflow: hidden`, background `cover` | **Source** (`IDCard.jsx` lines 52–64) |
| 1.2 | The three backgrounds are JPEG, **2744 × 4160 px**, identical aspect ratio to the card (`4160/2744 = 1.5161`, `221.8/146.3 = 1.5161`) | **Verified** on the files in `assets/idcard/` |
| 1.3 | The JPEG header says "288 dpi". That number is **metadata only**; printed at 146.3 mm wide the image is `2744 / (146.3/25.4) ≈ 476 dpi` | **Derived** (note: an earlier draft of this kit said "@288dpi" — that was wrong) |
| 1.4 | CSS font sizes on the card are in **CSS px (1 px = 1/96 in = 0.2646 mm)**, positions are in **mm**. The two are mixed. The card is `146.3 mm = 552.9 CSS px` wide | **Derived** |
| 1.5 | Fonts: **Vidaloka** (name), **Roboto** (designation, footer), **Gafata** (value lines, address). Loaded from Google Fonts by `src/index.css` | **Source** |
| 1.6 | Static labels are baked into the backgrounds (seven of them, §2.3) | **Verified** by viewing the three images |
| 1.7 | The web export `toPng(node, { cacheBust: true, scale: 3 })` — **`scale` is not an option of `html-to-image`** (its option is `pixelRatio`; `scale` does not appear in the installed package's `types.d.ts`). The web PNG is therefore rendered at the browser's device-pixel-ratio (≈553 × 838 px on a 1× screen) | **Verified** against `node_modules/html-to-image/lib/types.d.ts` |
| 1.8 | Web download file name is `${name}-${parish}-${phone}` **with no extension**; some browsers save it extension-less | **Source** |
| 1.9 | Server time zone for DATE columns is **not defined anywhere in the repos** (`mysql2` pool has no `dateStrings`/`timezone`), so API dates arrive as ISO instants such as `1999-05-12T00:00:00.000Z` or `…T18:30:00.000Z` | **Undetermined** — see §7.4 for the defensive rule and test 7.4 |
| 1.10 | Exact glyph baseline positions inside each text box depend on the font's ascent/descent. The web uses CSS `line-height: normal` (except the address, `96.5%`). Flutter's default (`height: null`) uses the font metrics too, but the two engines may differ by a fraction of a millimetre | **Undetermined** — calibrate with the overlay test in §11.3 |
| 1.11 | CSS `box-sizing` of the photo (`border: 1px`) depends on whether the web app applies MUI `CssBaseline` (border-box). The difference is 0.27 mm | **Undetermined**, ignore (use border-box) |

---

## 2. Anatomy of the card

### 2.1 Physical size and coordinate system

* Width `W = 146.3 mm`, height `H = 221.8 mm`. Origin **top-left**, `x` to the right, `y` downward.
* Horizontal centre `Cx = W / 2 = 73.15 mm`.
* All positions below are **distances from the card's top-left corner in millimetres** (`top` /
  `left`) except where it says *centred*.

### 2.2 Layers, bottom to top

1. **Background** (JPEG) — header with logos, "CATHOLIC YUVA DHARA / DIOCESE OF JALANDHAR", Bishop's
   House address and phone, the wave artwork, seven static labels with hairlines, two signature blocks
   ("Fr. Jibin, Director" and "Bp. Jose Sebastian, Bishop, Diocese of Jalandhar"), and the coloured
   footer band.
2. **Photo** — rounded rectangle, centred horizontally.
3. **Name**, then **designation** — centred, red.
4. **Six value lines** (deanery, parish, baptism date, birth date, phone, father's name) — black.
5. **Postal address** (a colon, then the wrapped address) — black.
6. **Footer** — "Issued: DD-MM-YYYY" left, "|" centre, "Valid for two years" right, all white, on the
   footer band.

### 2.3 What is baked into the background (do **not** draw it)

| Baked item | Approx. vertical position (mm from top) | Note |
|---|---|---|
| Logos, "CATHOLIC YUVA DHARA", "DIOCESE OF JALANDHAR", red hairline | 5 – 28 | header, over the coloured header band |
| "Bishop's House, Civil Lines, Jalandhar City - 144001 / Ph : +91-7888838246" | 29 – 37 | the phone number is **fixed text in the image**; it is not data |
| Wave artwork | 55 – 105 | the photo is drawn **over** the waves |
| Label **Deanery** | ≈ 131.8 (text centre) | hairline under it at ≈ 135.85 |
| Label **Parish** | ≈ 140.0 | hairline ≈ 144.0 |
| Label **Date of Baptism** | ≈ 148.2 | hairline ≈ 152.2 |
| Label **Date of Birth** | ≈ 156.4 | hairline ≈ 160.3 |
| Label **Phone no.** | ≈ 164.6 | hairline ≈ 168.4 |
| Label **Father's Name** | ≈ 172.8 | hairline ≈ 176.4 |
| Label **Postal Address** | ≈ 181.2 | no hairline |
| Signatures, "Fr. Jibin / Director", "Bp. Jose Sebastian / Bishop, Diocese of Jalandhar" | ≈ 193 – 210 | **limits the address to two lines**, see §8 |
| Coloured footer band | ≈ 213.2 – 221.8 | the footer text is drawn on it |

The six hairlines run from **x ≈ 9.2 mm to x ≈ 137.1 mm** (measured from the pixels; identical on all
three backgrounds). That gives the **usable width of a value line: from `left = 54 mm` to `137.1 mm`
= 83.1 mm**. The labels occupy the left 9–50 mm.

*Mother's name, qualification, involvement, designation labels and the issue date do **not** have a
label on the card; mother's name, qualification and involvement never appear on it.*

### 2.4 Background by level

| `level` value | File | Dominant colour (measured) | Header / footer colour |
|---|---|---|---|
| `parish` | `Parish.jpg` | turquoise | header `rgb(0,183,215)`, footer `rgb(0,189,221)` |
| `deanery` | `Deanery.jpg` | yellow/gold | header `rgb(255,184,14)`, footer `rgb(255,211,0)` |
| `dexco` | `Dexco.jpg` | green | header `rgb(64,141,1)`, footer `rgb(79,149,0)` |
| anything else (null, `""`, `"Parish"` capitalised, typos) | `Parish.jpg` | — | the web `switch` has a `default:` that uses Parish |

**Matching is exact and case-sensitive** (`switch (data.level)` with `case "parish"`). The backend
stores whatever string it was sent; the forms only ever send the three lowercase values
(`assets/data/levels.json`). Do not lower-case on the way in: reproduce the exact behaviour (an
unexpected value silently gets the Parish design). *Mobile addition:* log (debug only) when the
fallback is used.

> **Known legibility defect in the existing design (do not "fix" silently):** the footer text is
> **white**. On the **Deanery** card the footer band is yellow (`rgb(255,211,0)`), so white text has a
> contrast ratio of roughly 1.4 : 1. This is how the printed/web card looks today. Reproduce it
> faithfully, and raise it with the CYD office as a design question (it is in `11-DESIGN-VS-BACKEND.md`
> territory, not a rendering bug). If the owner agrees to change it, the only change is the footer
> text colour for `level == deanery`.

### 2.5 Diagram (not to scale; mm from top at the left)

```
  0 ┌──────────────────────────────────────────────┐ ← 146.3 mm wide
    │ ◖logo◗   CATHOLIC YUVA DHARA        ◖logo◗   │  baked
 28 │      DIOCESE OF JALANDHAR  ─────────────     │  baked
 37 │  Bishop's House … Ph : +91-7888838246        │  baked
    │                                              │
 42.5 ┌──────────┐  ← photo top
    │  │  58 × 67 │      centred, radius 3.7 mm    │
    │  │   mm     │      1px grey #8D8D8D border   │
109.5 └──────────┘
111.2   Name (Vidaloka, red, centred)
121     Designation (Roboto, red, centred)
128     Deanery           : <deanery>      ← label baked at left, value at x=54
136.1   Parish            : <parish>
144.12  Date of Baptism   : DD-MM-YYYY
152.4   Date of Birth     : DD-MM-YYYY
160.68  Phone no.         : <phone>
168.96  Father's Name     : <father>
177.24  Postal Address    : <address line 1 …
                            … address line 2>   (x = 56.9, width 82)
 ~193   Fr. Jibin signature        Bp. Jose Sebastian signature   (baked)
213   ┌ Issued: DD-MM-YYYY   │   Valid for two years ┐  white, on the footer band
221.8 └──────────────────────────────────────────────┘
```

---

## 3. Data the card needs

### 3.1 The card's input model (the **only** thing the widget receives)

The web component takes a loose `data` object whose keys differ by call site (the form uses
`father_name/date_of_birth`, the API returns `father/dob`, the web sometimes passes `photo`, sometimes
`photo_url`). **Do not copy that looseness.** The Flutter widget takes one strict value object:

| Field | Type | Web source key(s) | Required | Notes |
|---|---|---|---|---|
| `name` | `String` | `name` | yes | stored normalised lower-case by the backend; displayed through `capitalizeName` (§7.1) |
| `designation` | `String?` | `designation` | no | printed as-is (no capitalisation) |
| `level` | `String?` | `level` | no | selects the background, §2.4 |
| `deanery` | `String?` | `deanery` | no | |
| `parish` | `String?` | `parish` | no | |
| `dateOfBaptism` | `DateTime?` (date only) | `date_of_baptism` | no | printed `DD-MM-YYYY` |
| `dateOfBirth` | `DateTime?` (date only) | `date_of_birth` (form) / `dob` (API) | no | printed `DD-MM-YYYY` |
| `phone` | `String?` | `phone` | no | printed as stored (the form enforces 10 digits) |
| `fatherName` | `String?` | `father_name` (form) / `father` (API) | no | printed as stored (not capitalised) |
| `postalAddress` | `String?` | `postal_address` | no | may contain newlines (`white-space: pre-wrap`) |
| `issueDate` | `DateTime?` (date only) | `issue_date` | no (but see 7.3) | footer + validity |
| `photo` | `ImageProvider` | `photo` (form: base64 data-URL) / `photo_url` (API: https URL) | yes in the form, nullable from the API | §9 |

The mapping `ProfileModel → CardData` lives in **one** function (`CardData.fromProfile(Profile p)`),
next to `docs/08-DATA-MODELS.md`'s `Profile`. It is the Dart equivalent of the three ad-hoc object
spreads in the web app (`ManageProfiles.jsx` L700–709, `ProfileHolderDashboard.jsx` L251–257,
`FormDetails.jsx` L985).

### 3.2 Fields that exist on a profile but are never on the card

`mother`, `qualification`, `involvement`, `id`, `profile_user_id`, `created_by`, `status`, timestamps.

### 3.3 Where the card is shown (so you know who calls it)

| Caller | Screen (see `04-SCREENS-IDCARD.md`) | Data origin |
|---|---|---|
| Create flow, after a successful create | *Profile created* → "Preview ID card" | the form values just submitted + response `profile` |
| Profiles list → row action "ID card" | *ID card preview* | list row |
| Profile detail → "ID card" | *ID card preview* | `GET /profiles/:id` |
| **My ID** tab (profile holder) | *My ID* | `GET /profiles` (first item) or `GET /profile-holder/my-profile` |

---

## 4. Units, scale and the two conversion rules

Pick **one internal unit: millimetres** and multiply once at the end.

```
s      = renderedCardWidthInLogicalPixels / 146.3        // logical px per mm
mm(v)  = v * s                                           // every position / size in mm
fontPx(cssPx) = cssPx * 25.4 / 96 * s                    // a web CSS-px font size → logical px
```

`25.4 / 96 = 0.264583…` mm per CSS pixel. Pre-computed font sizes (use these constants):

| Web `fontSize` | In mm (**Derived**) | Used by |
|---|---|---|
| `31.5px` | **8.334 mm** | name |
| `24.2px` | **6.403 mm** | six value lines, colon, address |
| `19px` | **5.027 mm** | footer (three strings) |
| `16px` | **4.233 mm** | designation |
| `14px` (photo `borderRadius`) | **3.704 mm** | photo corner radius |
| `1px` (photo border) | **0.265 mm** | photo border width |

*Why this matters:* a naive port that treats `31.5px` as 31.5 *logical pixels* of a phone screen
produces text that is about **1.5×** too large relative to a 360 dp-wide card (a 360 dp card has
`s = 2.46`, so `8.334 mm → 20.5 dp`, not 31.5 dp). Always scale from mm.

### 4.1 Worked examples

| Where | Rendered card width | `s` (px/mm) | Name font | Value font | Photo box (w × h) | Photo top |
|---|---|---|---|---|---|---|
| Preview, phone 360 dp wide, 16 dp gutters (card 328 dp) | 328 dp | 2.2420 | 18.69 dp | 14.36 dp | 130.0 × 150.2 dp | 95.3 dp |
| Preview, tablet card at 480 dp | 480 dp | 3.2810 | 27.34 dp | 21.01 dp | 190.3 × 219.8 dp | 139.4 dp |
| PNG export, 300 dpi | 1728 px | 11.8113 | 98.4 px | 75.6 px | 685.0 × 791.4 px | 502.0 px |
| PNG export, "original" (background native) | 2744 px | 18.7559 | 156.3 px | 120.1 px | 1087.8 × 1256.7 px | 797.1 px |
| PDF page | 146.3 mm | (use mm directly via `PdfPageFormat.mm`) | 8.334 mm | 6.403 mm | 58 × 67 mm | 42.5 mm |

(Check: `2744 / 146.3 = 18.7559`; `328 / 146.3 = 2.2420`; photo height `67 × 2.2420 = 150.2`.)

### 4.2 Aspect ratio lock

The card is always rendered with `AspectRatio(aspectRatio: 146.3 / 221.8)` (≈ 0.6596). Never stretch;
never use a different ratio to "fit" a screen — scale the whole card down (`FittedBox`) instead.

---

## 5. Element specification (the contract)

Legend: `top`/`left` in mm from the card's top-left. "centred" means horizontally centred on
`Cx = 73.15 mm` (the web uses `left: 50%` + `translateX(-50%)`).

| # | Element | Content | Position | Box | Font | Colour | Align | Source lines |
|---|---|---|---|---|---|---|---|---|
| E0 | Background | image by level (§2.4) | `0,0` | full card, `cover` | — | — | — | 59–62 |
| E1 | Photo | `photo` | `top 42.5`, centred (left = 44.15) | `58 × 67 mm`, `object-fit: cover`, border `0.265 mm solid #8D8D8D`, radius `3.704 mm` | — | — | — | 65–79 |
| E2 | Name | `capitalizeName(name)` | `top 111.2`, centred | one line, no wrap on web (box 2190 px wide) | Vidaloka 8.334 mm | `#C01E2C` | centre | 95–109 |
| E3 | Designation | `designation` (raw) | `top 121`, centred | one line | Roboto 4.233 mm | `#C01E2C` | centre | 80–94 |
| E4 | Deanery | `": " + deanery` | `top 128`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 110–121 |
| E5 | Parish | `": " + parish` | `top 136.1`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 122–133 |
| E6 | Baptism | `": " + DD-MM-YYYY(dateOfBaptism)` | `top 144.12`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 134–145 |
| E7 | Birth | `": " + DD-MM-YYYY(dateOfBirth)` | `top 152.4`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 146–157 |
| E8 | Phone | `": " + phone` | `top 160.68`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 158–169 |
| E9 | Father | `": " + fatherName` | `top 168.96`, `left 54` | auto width | Gafata 6.403 mm | `#000000` | left | 170–181 |
| E10 | Address colon | `":"` | `top 177.24`, `left 54` | `width 35 mm`, `pre-wrap` | Gafata 6.403 mm | `#000000` | left | 182–195 |
| E11 | Address | `postalAddress` | `top 177.5`, `left 56.9` | `width 82 mm`, `white-space: pre-wrap`, `line-height 96.5 %` | Gafata 6.403 mm | `#000000` | left | 196–210 |
| E12 | Footer centre | `"\|"` | `top 213`, centred | `width 100 mm` | Roboto 5.027 mm | `#FFFFFF` | centre | 211–226 |
| E13 | Footer left | `"Issued: " + DD-MM-YYYY(issueDate)` | `top 213`, centred box (left = 23.15) | `width 100 mm` | Roboto 5.027 mm | `#FFFFFF` | **left** | 227–242 |
| E14 | Footer right | `"Valid for two years"` | `top 213`, centred box | `width 100 mm` | Roboto 5.027 mm | `#FFFFFF` | **right** | 243–258 |

Notes that are easy to get wrong:

* **E2/E3 order:** the name is `top 111.2`, the designation `top 121`. In the web source the
  designation `<div>` is written *before* the name `<div>`; the order in the code does not matter
  because they do not overlap. The visual order is name above designation.
* **E4–E9 prefix:** the leading `": "` (colon + space) is part of the text. The label itself is in the
  background; the colon in the *value* text visually completes "Deanery :".
* **E10 + E11:** the address block is *two* elements: a lone `:` at `177.24 mm / 54 mm`, and the
  address text starting at `x = 56.9 mm` (slightly right of the colon). `E10`'s `width: 35 mm` and
  `pre-wrap` are irrelevant for a single character; do not replicate the width.
* **E12–E14:** the three footer strings are **three overlapping 100 mm-wide boxes** (left, centre,
  right aligned) all at `top 213 mm`, centred on the card. Net effect: "Issued: …" starts at
  `x = 23.15 mm`, "Valid for two years" ends at `x = 123.15 mm`, and a "|" sits at the centre.
  Implement as one `Row`/`Stack` inside a 100 mm-wide box, not three raw copies.
* **The footer text is `font-weight` default (400).** A commented-out `fontWeight: 'bold'` exists in
  the source; ignore it.
* **No "Valid until" date is printed** — only the fixed phrase "Valid for two years".
* **The footer font-family is written `"roboto"` (lower-case)**; CSS font names are case-insensitive,
  so it is the same Roboto as `"Roboto"` in E3.
* **Phone is printed raw**, e.g. `: 9876543210` — no `+91`, no spacing.
* **Dates use `DD-MM-YYYY` with hyphens** on the card (the app screens use `DD/MM/YYYY` with
  slashes — see `04-SCREENS-IDCARD.md`). Do not unify them.

### 5.1 Y-axis summary (for quick sanity checks)

```
42.5  ─ photo top           109.5 ─ photo bottom (42.5 + 67)
111.2 ─ name                121   ─ designation
128   ─ deanery             136.1 ─ parish          (Δ 8.1)
144.12─ baptism  (Δ 8.02)   152.4 ─ birth           (Δ 8.28)
160.68─ phone    (Δ 8.28)   168.96─ father          (Δ 8.28)
177.24─ colon / 177.5 address                        (Δ 8.28 / 8.54)
213   ─ footer
```

The row pitch is **8.28 mm** for the last four steps, but the first two steps are **8.10 mm** and
**8.02 mm**; the web values are not perfectly even. Reproduce them as given — the baked hairlines are
spaced ≈ 8.1–8.2 mm apart, so the text sits within each row either way.

---

## 6. Text rules

### 6.1 `capitalizeName` (used for the name on the card, and for list/detail headings)

Web source (`src/utils/text-format.jsx`):

```
capitalizeName(name):
  if name is null/empty → return ''
  lowercase the whole string
  split on single space ' '
  for each word: uppercase its first character, keep the rest
  join with ' '
```

Consequences you must reproduce (the backend stores names lower-case and whitespace-collapsed by
`normalizeName` — `trim().replace(/\s+/g,' ').toLowerCase()` — so these are the normal case):

| Stored | Card shows | Why it looks odd |
|---|---|---|
| `john paul singh` | `John Paul Singh` | normal |
| `mary-anne d'souza` | `Mary-anne D'souza` | only the first letter after a **space** is upper-cased |
| `st. thomas` | `St. Thomas` | fine |
| `(blank)` | *(nothing)* | |
| `JOHN` (never stored) | `John` | whole string is lower-cased first |

*Mobile decision:* keep this behaviour exactly (it is what members see today). Do **not** replace it
with `toBeginningOfSentenceCase` or a title-case package, which would differ for hyphenated names.

```dart
// Illustrative, uncompiled.
String capitalizeName(String? name) {
  if (name == null || name.isEmpty) return '';
  return name
      .toLowerCase()
      .split(' ')
      .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
      .join(' ');
}
```

Not capitalised on the card: `designation`, `deanery`, `parish`, `fatherName`, `postalAddress` (printed
exactly as stored).

### 6.2 Dates on the card

* Format `DD-MM-YYYY`, zero-padded, hyphen separated, **Gregorian, no localisation** (`dayjs().format`).
  Do not use `DateFormat.yMd(locale)`; use an explicit pattern `dd-MM-yyyy`.
* Applies to: baptism (E6), birth (E7), issue (E13).
* **Missing / invalid date.** On the web `dayjs(null)` and `dayjs('garbage')` are *Invalid Date* and
  render the literal text **`Invalid Date`**; `dayjs(undefined)` is **today** (a silent wrong date).
  The web form makes all three dates mandatory, so this only occurs for legacy rows. *Mobile
  decision:* render an **em dash `—`** for a missing/invalid date (never "Invalid Date", never today),
  and never throw. Test fixture F5 (§14.3) covers it.

### 6.3 Strings and characters

* No trimming, no case change and no truncation on the web (except the name capitalisation). Whitespace
  inside values is preserved by the browser's normal collapsing rules; **only the address** uses
  `pre-wrap`, so embedded newlines in the address are real line breaks and runs of spaces are kept.
* Right-to-left or Gurmukhi/Devanagari text is not handled specially. Vidaloka/Roboto/Gafata have no
  Gurmukhi glyphs; a name in Punjabi script would render with the platform fallback font. The forms do
  not prevent it. **Undetermined / out of scope**; flag to the owner if real data contains it.
* Emoji or unusual symbols are not filtered. Do not add filters.

---

## 7. Validity (shown near the card, not on it)

The card prints only "Valid for two years". The *screens* around it show a computed status. Use the
same rule everywhere (My ID, ID-card preview, Profiles detail):

```
issue   = issue_date (date only)
expiry  = issue + 2 calendar years        (dayjs .add(2,'years'))
now     = current instant
isValid = now.isBefore(expiry)            (expiry = 00:00 local of the expiry date)
days    = max(0, trunc((expiry − now) / 24h))     // dayjs diff(…,'days') truncates toward zero
status  = !isValid           → "Expired"                       (red)
          days > 60          → "Valid"                         (green)
          else               → "Expires in {days} days"        (amber)
no issue_date → no validity block at all (web returns null)
```

### 7.1 Exact web behaviours

* **The card is already expired on the expiry date itself** (`expiry` is midnight at the *start* of that
  day, `now` is later in the same day). Example: issued 2024-03-10 → expiry 2026-03-10; at 10:00 on
  2026-03-10 the web shows *Expired*.
* `days` is **truncated**, so `59.5` days shows "Expires in 59 days"; and exactly 60.0 days shows
  "Expires in 60 days" (`> 60` is false).
* Feb 29: `dayjs('2024-02-29').add(2,'years')` → **2026-02-28** (clamped). Dart's `DateTime(2026, 2, 29)`
  silently rolls to **2026-03-01** — **do not** use `DateTime(y + 2, m, d)` directly; clamp the day to
  the last day of the target month.
* Display formats for the validity block are `DD/MM/YYYY` (slashes) — different from the card's
  hyphens (§5).
* Copy used on the web (quote exactly):
  * Chip: `Valid` · `Expires in {n} days` · `Expired`
  * Panel title `Status`; alerts: *"Your ID card is valid and in good standing."* ·
    *"Your ID card will expire in {n} days. Please contact CYD Office for renewal."* ·
    *"Your ID card has expired. Please contact CYD Office for renewal."*
  * (preview dialog, unused today) *"This ID card has expired on {date}"*,
    *"This ID card will expire in {n} days"*.

### 7.2 The backend computes it differently (contradiction — pick the web rule)

`GET /profile-holder/my-id-card` returns `validity { issued, expires, isValid, daysUntilExpiry }` using
`isValid = now <= expiry` and `daysUntilExpiry = ceil(…)` (and `setFullYear(+2)`, which for Feb 29 rolls
to **Mar 1**). So on the expiry day the backend says *valid* and the web says *Expired*, and for
fractional days the two round in opposite directions. **Decision:** compute locally with the web rule
above (the app also needs it offline and for the Profiles list). Do not call `my-id-card` just for
validity. Logged in `11-DESIGN-VS-BACKEND.md`.

### 7.3 Missing `issue_date`

The backend's `getMyIdCard` does `new Date(profile.issue_date)`; with `null` that is **1970-01-01**, so it
reports *expired* with a huge negative `daysUntilExpiry`. The web computes `null` → shows **no** validity
block. Follow the web. (Create requires `issue_date`, defaulting to *today*; null only occurs on legacy
rows.)

### 7.4 Date parsing from the API (defensive, **Undetermined** server TZ)

Because the server time zone is unknown (§1.9), parse API date strings with this rule and unit-test it:

```
parseApiDate(String? s):
  if s null/empty → null
  if s matches ^\d{4}-\d{2}-\d{2}$ → that calendar date (no time zone maths)
  else (ISO instant, e.g. 1999-05-11T18:30:00.000Z) → DateTime.parse(s).toLocal(), keep y/m/d
```

This reproduces the web (`dayjs(iso)` also converts to the *browser's* local zone) for devices in the
same zone as the server (IST) and is the closest faithful behaviour elsewhere. **Verification test
(first thing to do against a real backend):** create a profile with DOB `2000-01-01`, fetch it, and
check the raw JSON. If it comes back as `1999-12-31T18:30:00.000Z`, the server runs in IST and the rule
above is right for IST phones; if it comes back `2000-01-01T00:00:00.000Z`, the server is UTC and the
rule is right for any phone east of UTC (it would show the previous day for phones west of UTC — then
ask for the backend fix `dateStrings: ['DATE']` listed in `12-BACKEND-ASKS.md`).

---

## 8. Long-value policy (**Mobile decision** — the web has none)

### 8.1 What the web does today

* Name / designation: boxes 2190 px wide, centred, no wrap → a long name **overflows past the card on
  both sides and is clipped** by `overflow: hidden` (letters cut off at the card edge).
* Value lines (E4–E9): `position: absolute; left: 54mm` with no width → the browser wraps the text at
  the card's right edge (shrink-to-fit up to 92.3 mm) and **the second line overlaps the next row**
  and the hairline under it.
* Address: width 82 mm, wraps downward, `line-height 96.5 %`; from about the **third line** (≈ 192 mm) the
  text runs into the signature artwork and, at five lines, into the footer band.

### 8.2 What the mobile card does

The goal is *the same card for normal data* and *a readable card for abnormal data*. All limits are in
mm so they scale with the card.

| Element | Max width | Strategy | Min scale | If still too long |
|---|---|---|---|---|
| E2 Name | **134 mm** (card width − 2 × 6.15) | shrink font uniformly | 70 % (5.83 mm) | ellipsis `…` |
| E3 Designation | 134 mm | shrink | 75 % | ellipsis |
| E4–E9 value (incl. the `": "`) | **83 mm** (54 → 137.1, the hairline end) | shrink | 75 % (4.80 mm) | ellipsis |
| E11 Address | width 82 mm | wrap, **max 2 lines** (a third line would run into the baked signatures at ≈ 193 mm); if it needs more than 2 lines, shrink to 80 % and re-wrap | 80 % | `…` at the end of line 2 |
| Footer | fixed text, never long | none | — | — |

* Shrinking = `FittedBox(fit: BoxFit.scaleDown)` per element, **anchored left** for values and **centred**
  for name/designation. It must **never shrink *below* the minimum scale**: past that, use
  `TextOverflow.ellipsis` in a width-constrained box.
* The **full untruncated values are always visible on the detail screen**; the card is a picture. The
  PDF/PNG export uses the same shrink rules (the export is the same widget).
* Show a small non-printing hint in the on-screen preview *only*: when any element was shrunk by more
  than the minimum or ellipsised, show an info chip under the card ("Some text is long and has been
  shortened on the card"). It is **not** part of the exported image (it lives outside the
  `RepaintBoundary`, §11).
* Do **not** change the stored data to make it fit.

Representative long values from the real data set (`assets/data/deaneries.json`):
`Lohgarh-Sur Singh Wala (Station)` (32 chars, parish), `Khanpur-Jassar-Sangowal-Rania` (28),
`Nihal Singh Wala, Moga (Station)` (32), `Fatehgarh Churian` (17, deanery). Measure them at 6.403 mm
Gafata in the golden fixture F2 (§14.3) to set the final minimum scales; if they all fit at 100 % the
policy is only for typed free text (name, father, address).

---

## 9. Fonts

| Font | Weight/style | Used for | In kit |
|---|---|---|---|
| **Vidaloka** | Regular | name (E2) | **not bundled** (see below) |
| **Roboto** | Regular (400) | designation (E3), footer (E12–E14) | **not bundled** |
| **Gafata** | Regular | values + address (E4–E11) | `assets/fonts/Gafata-Regular.ttf` |

* All three are Google Fonts under the **SIL Open Font License**: redistribution inside an app is allowed.
  The web app loads them from Google Fonts at runtime (`src/index.css` lines 1–3) and its global
  `font-family` stack is `'Gafata', …, 'Vidaloka', …, 'Roboto', …`.
* **The card must never fall back to a system font**, in preview or in an export. A missing font changes
  glyph widths and the whole layout. Therefore:
  1. Bundle all three as app assets (`pubspec.yaml` → `flutter: fonts:`), under the family names
     `Vidaloka`, `Roboto`, `Gafata`. **Action for the build agent (M4):** download `Vidaloka-Regular.ttf`
     and `Roboto-Regular.ttf` from Google Fonts and add them next to `Gafata-Regular.ttf`; the kit only
     ships Gafata because the other two were not fetched while writing it.
  2. Do **not** use the `google_fonts` runtime download for the card (it needs network on first use and
     can be absent offline). `google_fonts` stays fine for the *UI* fonts (Anton / Archivo / DM Mono,
     `02-DESIGN-SYSTEM.md`) — and even those may be bundled.
  3. Before any export, `await` font readiness (bundled fonts are ready at start; if you ever switch
     to runtime loading, `await GoogleFonts.pendingFonts([...])` before `toImage`).
* Do not apply `fontWeight` to the card text; the web uses the default weight (400).
* Letter spacing: none (CSS default). Flutter default is also 0 — leave `letterSpacing` unset.

### 9.1 Line height

The web uses `line-height: normal` for every element except the address (`96.5 %`). In Flutter, leave
`TextStyle.height` **null** for E2–E10 and E12–E14 (the font's own ascent+descent), and set
`height: 0.965` for the address with
`leadingDistribution: TextLeadingDistribution.even`. CSS "96.5 %" means `0.965 × font-size`
(**not** `0.965 × normal`); so the address line-height is `0.965 × 6.403 mm = 6.179 mm`, *tighter* than
the normal line height (assumed ≈ 1.2 × the font size ≈ 7.7 mm for Gafata at this size — measure it in the overlay test). In Flutter `height` is a multiple of the font
size, so `0.965` is correct. **Calibrate** with the overlay test (§11.3).

---

## 10. Photo

### 10.1 Sources

| Where the card is shown | Photo value | Flutter provider |
|---|---|---|
| After a form submit (create/edit) | the **local file the user just picked/cropped** | `FileImage` / `MemoryImage` |
| From the API (`photo_url`) | an `https` **Cloudinary** URL | `CachedNetworkImageProvider` |
| API row with no photo (`photo_url` null) | — | placeholder (§10.3) |

### 10.2 Fit

`object-fit: cover` into the `58 × 67 mm` box = centre-crop to the aspect `58 : 67 = 0.8657`
(`BoxFit.cover`, `Alignment.center`), then clip to the rounded rectangle (radius 3.704 mm) and draw the
`#8D8D8D` 0.265 mm border **on top** of the clipped image (inside the radius). A portrait-ish photo
(4:5 = 0.8) loses a little top/bottom; a landscape photo loses a lot of the sides. Therefore the
**photo-picking screen should offer a crop to exactly 58 : 67** (see `04-SCREENS-IDCARD.md`, photo
step) so the member sees what the card will show. The web has no crop.

### 10.3 No photo / broken photo

The web renders `<img src={undefined}>` (a broken-image icon, or nothing). *Mobile decision:* draw the
bordered rectangle with a neutral person silhouette (`#E6E6E6` fill, `#B5B5B5` glyph) — **in the
preview only; in an export, refuse** ("Add a photo first") because a card without a photo is not
issuable. The create form already makes a photo mandatory (`'Please upload a photo'`).

### 10.4 Cloudinary URL tricks (optional, recommended)

Photos are served from Cloudinary (`saveBase64Image` → `secure_url`, folder `test_photos`). For the
export you need the **full-resolution** image; for list thumbnails you may insert a transformation
segment after `/upload/` (e.g. `/upload/w_200,h_200,c_fill,f_auto,q_auto/`). If the URL does not contain
`/upload/` leave it untouched. Never change `secure_url` for the card itself.

### 10.5 EXIF orientation

Phone photos carry an EXIF orientation flag. The web's `<img>` honours it. In Flutter, `Image.file` /
`MemoryImage` decode honours EXIF on Android and iOS through the engine, but the **resize step before
upload** (`04-SCREENS-IDCARD.md` §photo) must produce an **upright** image with the rotation baked in.
`image_picker` with `maxWidth/maxHeight` re-encodes on the platform side, but whether it bakes the EXIF
rotation on both Android and iOS is **Undetermined** — verify on devices; if it does not, decode with
the `image` package and call `bakeOrientation` before encoding. Test with a portrait photo shot in
landscape orientation (golden fixture F6).

### 10.6 Waiting for images before capture

An export taken before the network image has decoded produces a card with an empty photo. The export
function must `await precacheImage(provider, context)` (and the three backgrounds) and then wait one
frame before `toImage`.

---

## 11. Implementation blueprint

> Illustrative and **uncompiled** Dart. Package layout follows `01-ARCHITECTURE.md`
> (`lib/features/idcard/…`). Names are suggestions; the geometry is the contract.

### 11.1 Files

```
lib/features/idcard/
  domain/card_data.dart            // CardData value object + CardData.fromProfile
  domain/validity.dart             // CardValidity.compute(issue, now)  (§7)
  domain/card_format.dart          // capitalizeName, formatCardDate, parseApiDate, safeFileName
  presentation/card_spec.dart      // the mm constants of §5 as one const table
  presentation/cyd_id_card.dart    // the widget (preview AND export render the same widget)
  presentation/id_card_screen.dart // preview screen (04-SCREENS-IDCARD.md)
  application/card_exporter.dart   // PNG / PDF / share / print
test/idcard/
  card_format_test.dart  validity_test.dart  card_golden_test.dart  card_spec_test.dart
```

### 11.2 The geometry table as code (one place, no magic numbers elsewhere)

```dart
// Illustrative, uncompiled. All values from §5 (mm).
class CardSpec {
  static const double w = 146.3, h = 221.8, cx = w / 2;           // 73.15
  static const double photoTop = 42.5, photoW = 58, photoH = 67;
  static const double photoRadius = 3.704, photoBorder = 0.265;    // 14px, 1px
  static const double nameTop = 111.2, designationTop = 121;
  static const double valueLeft = 54;
  static const List<double> valueTops = [128, 136.1, 144.12, 152.4, 160.68, 168.96];
  static const double colonTop = 177.24, addressTop = 177.5, addressLeft = 56.9, addressW = 82;
  static const double footerTop = 213, footerW = 100;
  // font sizes (mm) — CSS px × 25.4/96
  static const double nameFont = 8.334, designationFont = 4.233, valueFont = 6.403, footerFont = 5.027;
  // mobile-decision limits (§8)
  static const double nameMaxW = 134, valueMaxW = 83.1 /* 54 → 137.1 */, addressMaxLines = 2;
}
```

A **unit test** (`card_spec_test.dart`) must assert these constants equal the numbers in this document
(and, optionally, parse them from `IDCard.jsx` if the repo is available) so a later edit cannot drift
silently.

### 11.3 The widget

```dart
// Illustrative, uncompiled.
class CydIdCard extends StatelessWidget {
  const CydIdCard({super.key, required this.data, this.cacheWidth});
  final CardData data;
  final int? cacheWidth;               // decode width hint (preview: ceil(px); export: 1728)

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: CardSpec.w / CardSpec.h,
      child: LayoutBuilder(builder: (context, c) {
        final s = c.maxWidth / CardSpec.w;            // logical px per mm
        double mm(double v) => v * s;
        TextStyle ts(String fam, double sizeMm, Color col, {double? height}) => TextStyle(
              fontFamily: fam, fontSize: mm(sizeMm), color: col, height: height,
              fontWeight: FontWeight.w400, letterSpacing: 0, decoration: TextDecoration.none);

        return ClipRect(                                   // overflow: hidden
          child: Stack(children: [
            Positioned.fill(child: Image.asset(data.backgroundAsset, fit: BoxFit.cover,
                cacheWidth: cacheWidth)),
            Positioned(                                    // E1 photo
              top: mm(CardSpec.photoTop), left: mm((CardSpec.w - CardSpec.photoW) / 2),
              width: mm(CardSpec.photoW), height: mm(CardSpec.photoH),
              child: _Photo(provider: data.photo, radius: mm(CardSpec.photoRadius),
                  border: mm(CardSpec.photoBorder)),
            ),
            _centered(top: mm(CardSpec.nameTop), width: mm(CardSpec.nameMaxW), s: s,
                child: _Fit(Text(capitalizeName(data.name), maxLines: 1, softWrap: false,
                    textAlign: TextAlign.center,
                    style: ts('Vidaloka', CardSpec.nameFont, const Color(0xFFC01E2C))))),
            // E3 designation, E4–E9 values (": " + text, left 54 mm, FittedBox left-aligned),
            // E10 colon, E11 address (maxLines 2, width 82 mm, height 0.965), E12–E14 footer
            // are built the same way from CardSpec. See the table in §5 — one Positioned each.
          ]),
        );
      }),
    );
  }
}
```

Rules for the real implementation:

1. **One widget renders preview, PDF source and PNG.** Never build a second "export version".
2. Every `Positioned` gets `top`/`left`/`width` from `CardSpec × s`. No hard-coded dp anywhere.
3. Text widgets use `maxLines`, `softWrap: false` (except the address) and `TextOverflow.ellipsis`
   inside the §8 width limits. Use `StrutStyle(forceStrutHeight: false)` only if the overlay test shows
   an offset (see below).
4. `Semantics` (§13) wraps the whole card; the individual text widgets are excluded from semantics.
5. The card ignores the app theme, text scale factor and dark mode: wrap it in
   `MediaQuery(data: mq.copyWith(textScaler: TextScaler.noScaling), child: …)` — **system font scaling
   must not change the printed card** — and give every `Text` an explicit colour (never inherit).
6. Mirror the web's null handling: `Text(': ${v ?? ''}')` (the web prints a bare `: ` for a null value;
   keep the colon).

### 11.3.1 Calibration against the web (do this once, in M4)

Because baseline placement may differ by a fraction of a millimetre (§1.10):

1. Run the web app, open a profile's ID-card preview with fixture F1 (§14.3) and take a screenshot of
   `.card-container` at **device scale factor 3** with Playwright (card box = 553 × 838 CSS px → 1659 ×
   2514 px). Save as `reference/F1_web.png`.
2. Render the Flutter card with the same data at a logical width of **553 dp × pixelRatio 3** (a golden
   test) → `F1_flutter.png`.
3. Overlay at 50 % opacity (or compute a per-element diff). **Acceptance:** every text box's top edge
   and left edge are within **0.5 mm (≈ 5.7 px at this size)**, and the photo box edges within 1 px.
4. If text is systematically too high/low, adjust with `StrutStyle`/`TextHeightBehavior`
   (`applyHeightToFirstAscent`) **per font** (not per element) and record the offsets in `CardSpec`
   with a comment. Do not tune individual rows by eye.

*This kit contains no reference render because producing one requires the web app with Google Fonts
(network). It is the first task of the card engineer.*

### 11.4 Preview behaviour (screen-level; see `04-SCREENS-IDCARD.md` for chrome)

* The card is centred, width = `min(screenWidth − 32, 480)`, **never** scrolled horizontally.
* **Pinch-to-zoom** (`InteractiveViewer`, 1×–4×, double-tap toggles 1×/2.5×) is a mobile decision: at
  328 dp the 6.4 mm values are ≈ 14 dp tall — readable, but the signatures and small print are not.
* **Card is always light**, regardless of theme (it is a printed object). Surround it with the themed
  surface; draw a 1 px `line2` border *outside* the capture boundary so the white areas stay visible on
  light backgrounds.
* The footer/status chips ("Valid", "Expires in n days", "Expired") live **outside** the
  `RepaintBoundary`.

---

## 12. Export pipeline

### 12.1 Outputs

| Output | Size | Notes |
|---|---|---|
| **PNG (default)** | **1728 × 2620 px** (`146.3 mm × 221.8 mm` at 300 dpi; `146.3/25.4 × 300 = 1727.9`, `221.8/25.4 × 300 = 2619.7`) | parity with web, ~10× the pixels of the web PNG (§1.7) |
| PNG "original" (optional, in "More") | 2744 × 4160 px | the background's native resolution; big file (several MB) |
| **PDF** | one page, **146.3 × 221.8 mm**, zero margins, the PNG filling the page | for print shops |
| **Print** | PDF sent to the OS print dialog (`printing`) | tell the user to choose *Actual size / 100 %*; margins imposed by the printer may clip the 0–5 mm of the header band — offer "A4, card centred" as a second layout |
| *(optional)* JPG | same pixels, quality 92 | smaller to send on WhatsApp — mobile decision, not in the web app |

The file name is built from the **name, parish and phone** like the web, but sanitised and with an
extension (the web omits it):

```
safeFileName(name, parish, phone):
  base = "{name}-{parish}-{phone}"                    // raw values as the web does
  base = base.replaceAll(RegExp(r'[\\/:*?"<>|,()\s]+'), '_')   // parish names contain commas/parentheses
  collapse repeated '_' ; trim '_' ; max 80 chars
  fall back to "cyd-id-card" if empty
  + ".png" | ".pdf"
```
e.g. `John Paul Singh` / `Lohgarh-Sur Singh Wala (Station)` / `9876543210` →
`John_Paul_Singh-Lohgarh-Sur_Singh_Wala_Station-9876543210.png`. (The web used the **raw stored name**,
i.e. lower-case, not the capitalised one — use the **capitalised** one on mobile: *mobile decision*,
nobody depends on the old file name.)

### 12.2 Capture steps (PNG)

```dart
// Illustrative, uncompiled.
Future<Uint8List> capturePng(GlobalKey boundaryKey, {double targetWidthPx = 1728}) async {
  final boundary = boundaryKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
  final ratio = targetWidthPx / boundary.size.width;           // fractional ratios are fine
  final image = await boundary.toImage(pixelRatio: ratio);      // vector text is re-rasterised, crisp
  final data = await image.toByteData(format: ui.ImageByteFormat.png);
  return data!.buffer.asUint8List();
}
```

Preconditions the exporter enforces (and shows an error toast if it cannot):

1. The three required assets and the photo are **decoded**: `await precacheImage(...)` for the level's
   background and the photo provider, then `await WidgetsBinding.instance.endOfFrame`.
2. The card is **on screen and painted** (a `RepaintBoundary` that is off-screen or in an `Offstage`
   subtree cannot be captured). Therefore export **starts from the preview screen**; the Profiles-list
   "share" action opens the preview first. (The `screenshot` package's `captureFromWidget` is an
   alternative if a headless capture is later needed; it is not in the approved dependency list.)
3. The card has a **photo** (§10.3) and a **non-empty name**; otherwise show "Add a photo first".
4. Memory: set `cacheWidth` of the background to `1728` for the export render (the full 2744 × 4160 JPEG
   decodes to ≈ 45 MB; 1728 wide ≈ 18 MB). If capture throws an out-of-memory error, retry once at
   `targetWidthPx = 1200` and tell the user the export is "standard quality".
5. Capture takes ~0.3–1.5 s on a mid-range phone: disable the buttons and show the progress state.

### 12.3 Share

* `share_plus`: write the bytes to `getTemporaryDirectory()/<safeFileName>.png`, share an `XFile` with
  `mimeType: 'image/png'`. The exact call differs between `share_plus` major versions
  (`Share.shareXFiles` vs `SharePlus.instance.share(ShareParams(...))`) — use the one for the pinned
  version, and verify on a device.
* Delete the temp file after sharing completes (or on next app start).
* Message text: none (the card says everything). No tracking/analytics.

### 12.4 Save to device

The approved dependency list has **no gallery-saving plugin**. Options (decide in M4, **Undetermined**):
(a) rely on the share sheet's "Save to device/Files"; (b) add `gal` (MediaStore/Photos, needs
`WRITE_EXTERNAL_STORAGE` only on Android ≤ 9, and `NSPhotoLibraryAddUsageDescription` on iOS). Prefer
(a) for v1 — fewer permissions — and record the decision in `13-RELEASE.md`'s permission table.

### 12.5 PDF and print

```dart
// Illustrative, uncompiled. package:pdf + package:printing
final doc = pw.Document();
final fmt = PdfPageFormat(146.3 * PdfPageFormat.mm, 221.8 * PdfPageFormat.mm, marginAll: 0);
doc.addPage(pw.Page(pageFormat: fmt, build: (_) =>
    pw.Image(pw.MemoryImage(png), fit: pw.BoxFit.fill)));        // png from capturePng()
final bytes = await doc.save();
await Printing.layoutPdf(onLayout: (_) async => bytes, name: safeFileName(...));
```

* The page is exactly the card, so a print shop gets the right size. For an A4 sheet, build a second
  `PdfPageFormat.a4` page and place the image centred with `pw.Center(child: pw.SizedBox(width:
  146.3 * PdfPageFormat.mm, height: 221.8 * PdfPageFormat.mm, child: pw.Image(...)))` — **do not
  scale to fit**; scaling changes the physical card size.
* PDF file size ≈ the PNG size (a few MB). If that is too large for sharing, embed a JPG (q 92).
* `Printing.sharePdf` can share the PDF through the system sheet.

---

## 13. Accessibility

* The card is one `Semantics` node (`container: true`, `image: true`) with the label:
  `ID card of {Name}, {designation}, {parish} in {deanery}. Issued {DD-MM-YYYY}. Valid for two years.`
  (omit absent parts; use the capitalised name). The inner `Text`/`Image` are `ExcludeSemantics`.
* The photo has **no** separate alt text (the web's `alt="User Pic"` is decorative).
* The preview screen's buttons (Share, Save, PDF, Print) are normal labelled buttons with ≥ 48 × 48 dp
  targets (`02-DESIGN-SYSTEM.md`).
* The yellow Deanery footer contrast (§2.4) is an existing design limitation; the *status chips next to
  the card* carry the real validity information in an accessible colour + text.
* Text scale: the card ignores it (§11.3 rule 5); the screen's own text honours it.

---

## 14. Tests

### 14.1 Unit tests (pure Dart)

| Test | Input → expected |
|---|---|
| `capitalizeName` | `john paul singh`→`John Paul Singh`; `MARY-ANNE d'souza`→`Mary-anne D'souza`; `''`/`null`→`''`; double space `a  b` →`A  B` (empty word kept) |
| `formatCardDate` | `2000-01-05`→`05-01-2000`; `null`→`—`; `'garbage'`→`—`; never throws |
| `parseApiDate` | `2000-01-05`→ Jan 5; `1999-12-31T18:30:00.000Z` → per §7.4 (run with TZ=Asia/Kolkata → 2000-01-01; TZ=UTC → 1999-12-31) |
| level → asset | `parish`→Parish, `deanery`→Deanery, `dexco`→Dexco, `Parish`/`''`/`null`/`x`→Parish |
| `safeFileName` | the example in §12.1; empty parts; 200-char input is cut to 80 |
| `CardSpec` | constants equal the §5 numbers |

### 14.2 Validity tests (inject a clock; local time)

| issue | now | expected |
|---|---|---|
| 2024-03-10 | 2025-11-20 00:00 | Valid (110 days) |
| 2024-03-10 | 2026-01-08 00:00 | Valid (61 days) |
| 2024-03-10 | 2026-01-08 12:00 | Expires in 60 days (60.5 → 60) |
| 2024-03-10 | 2026-01-09 00:00 | Expires in 60 days (60.0) |
| 2024-03-10 | 2026-01-09 12:00 | Expires in 59 days (59.5 → 59) |
| 2024-03-10 | 2026-03-09 23:00 | Expires in 0 days (still before expiry) |
| 2024-03-10 | 2026-03-10 10:00 | **Expired** (the card expires at the start of the expiry date) |
| 2024-02-29 | any | expiry 2026-02-28 (clamped), not 2026-03-01 |
| null | any | no validity block |

### 14.3 Golden tests (`matchesGoldenFile`, fonts loaded from the bundled TTFs)

Load fonts in `flutter_test_config.dart` (`FontLoader`) so goldens do not use the default Ahem font.
Render at a fixed logical width of 553 dp × pixelRatio 2 on every golden. Fixtures:

| ID | Purpose | Data |
|---|---|---|
| **F1** | typical Parish card | name `john paul singh`, designation `Secretary`, level `parish`, deanery `Jalandhar City`, parish `Maqsudan`, baptism `2001-04-15`, birth `2000-01-05`, phone `9876543210`, father `Joseph Singh`, address `House 12, Church Road, Maqsudan, Jalandhar - 144008`, issue `2025-06-01` |
| **F2** | long parish/deanery on the **Deanery** card | level `deanery`, deanery `Fatehgarh Churian`, parish `Lohgarh-Sur Singh Wala (Station)`, designation `Joint Media Secretary`, rest as F1 |
| **F3** | **Dexco**, long father + 2-line address | level `dexco`, father `Bartholomew Fernandes-D'Souza`, address with `\n`: `Flat 4B, St. Mary's Apartments\nCivil Lines, Jalandhar City - 144001` |
| **F4** | long name | name `maria magdalene josephine fernandes-d'souza of kapurthala` (checks the 70 % shrink and the ellipsis) |
| **F5** | edge data | level `xyz` (→ Parish), `issueDate` null (→ `—`), baptism invalid, phone empty (prints `: `), no designation |
| **F6** | photo orientation/crop | landscape-shot portrait photo (EXIF 6) and a very wide landscape photo; shows the 58 : 67 centre crop |

Use a **bundled test photo** (a neutral grey portrait fixture committed under `test/fixtures/`), never
a real member's picture.

### 14.4 Acceptance checklist (card engineer)

- [ ] `CardSpec` constants match §5 and the unit test passes.
- [ ] Three backgrounds selected correctly; unknown level → Parish (F5).
- [ ] All seven baked labels line up with the value rows (visual check at 328 dp and 480 dp).
- [ ] Overlay against the web render (§11.3.1) within 0.5 mm for F1.
- [ ] Long values (F2–F4) never overlap other rows, the signatures, or leave the card.
- [ ] System font scale 2.0 does not change the card.
- [ ] Airplane mode: preview works for a previously opened profile (photo cached), export works.
- [ ] PNG is 1728 × 2620 and opens in the gallery; PDF page is 146.3 × 221.8 mm (check in a PDF viewer).
- [ ] File names are sanitised and carry an extension.
- [ ] Dark mode: card unchanged; surround themed.
- [ ] TalkBack/VoiceOver reads the §13 label once.

---

## 15. Things that are **not** on the card (do not add)

No QR code, barcode, NFC, hologram, serial/ID number, membership number, expiry date, mother's name,
qualification, involvement-since, level text, email, or back side. The web card has none; the
`GET /profile-holder/my-id-card` endpoint returns validity but nothing that is drawn. Adding
verification (QR code to a public verify page) is a sensible future feature and would need a backend
endpoint; see `12-BACKEND-ASKS.md`.

---

## 16. Open questions for the owner (nothing here blocks the build)

1. **Deanery footer contrast** (white on yellow) — keep, or change that footer to black? (§2.4)
2. **Server date/time zone** — confirm with a real record (§7.4).
3. **Gallery saving** — share-sheet only for v1, or add a plugin? (§12.4)
4. **Long values** — are the §8 shrink/ellipsis limits acceptable to the CYD office, or should the form
   enforce shorter limits (e.g. father ≤ 30 characters, address ≤ 90 characters)? The backend allows
   100 / 100 / (no limit on create; 500 on holder update).
5. **Vidaloka/Roboto font files** — confirm bundling them is acceptable (OFL) (§9).
6. **JPG/WebP backgrounds** — the three JPEGs are 3.1–3.9 MB each (≈ 10.8 MB of app size). Converting to
   a lossy WebP (≈ 60 % smaller) is possible but would change pixels slightly; not done by default.

---

## 17. Quick reference (print this)

```
Card         146.3 × 221.8 mm  (s = widthPx / 146.3)       centre x = 73.15
Photo        top 42.5   58 × 67   r 3.704   border 0.265 #8D8D8D   cover
Name         top 111.2  Vidaloka 8.334  #C01E2C  centred  capitalizeName
Designation  top 121    Roboto   4.233  #C01E2C  centred
Values       left 54    Gafata   6.403  #000    tops 128 · 136.1 · 144.12 · 152.4 · 160.68 · 168.96
             text = ": " + deanery | parish | baptism | birth | phone | father       max width 83.1
Address      ":" at 177.24/54 ; text 177.5 / left 56.9 / w 82 / lh .965 / max 2 lines
Footer       top 213    Roboto 5.027 #FFF  box w 100 centred: left "Issued: DD-MM-YYYY" · centre "|" · right "Valid for two years"
Backgrounds  parish→Parish.jpg  deanery→Deanery.jpg  dexco→Dexco.jpg  other→Parish.jpg   (2744 × 4160)
Dates        DD-MM-YYYY on the card · DD/MM/YYYY on screens · missing → —
Validity     expiry = issue + 2y · expired from 00:00 of the expiry date · >60 days Valid · ≤60 "Expires in n days"
Export       PNG 1728 × 2620 · PDF 146.3 × 221.8 mm · filename {Name}-{Parish}-{phone}.png sanitised
```
