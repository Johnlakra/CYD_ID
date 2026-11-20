# CYD — shared design context (paste ONCE, first)

You are continuing the design of the **CYD mobile app**. The existing design file **"CYD Shop Mobile"** has 19 artboards (01–18 and 12b), each a 390×844 frame labelled like `01 Home`, `12b Address form`. **Only ADD new artboards. Never modify, re-style or delete the existing ones.** Match their frame size, label style, fonts, tokens and component look exactly. Each new screen is drawn **twice, dark and light** (two frames, labelled `<id> <title> · dark` / `· light`; the file's existing artboards switch theme with one toggle, so keep the same two token sets).

## Product (5 lines)
CYD = Catholic Yuva Dhara, Diocese of Jalandhar (India). The app has (1) **ID cards** for youth members and the staff who manage them, and (2) a **multi-vendor shop** run by parishes. Payments are **peer-to-peer UPI**: the buyer pays the *seller's own UPI ID* directly outside the app, enters the **12-digit UTR** (bank reference), and the **seller confirms** receipt; the platform never holds money. Roles: **admin**, **CYD manager**, **profile holder** (a member who views their own card), **buyer** (any user), **seller** (owns an approved shop). Money is shown as `₹1,250.00` with Indian digit grouping (₹1,25,000.00 for lakhs).

## Tokens (use exactly)
| name | dark | light |
|---|---|---|
| bg | #0A0A0B | #F2F0EA |
| card | #141417 | #FFFFFF |
| raised | #1E1E22 | #FFFFFF |
| sunk | #101012 | #E9E6DD |
| ink | #F5F5F0 | #0A0A0B |
| mute | white 58% | ink 60% |
| faint | white 40% | ink 45% |
| line (hairline) | white 8% | ink 9% |
| line2 (emphasis hairline) | white 14% | ink 15% |
| accent (both) | #FFA51F, text on accent #0A0A0B | same |
| accSoft | accent 14% | accent 20% |
| accText | #FFB547 | #9A5200 |
| danger | #FF6A55 | #C8321F |
| ok | #3DD68C | #1B7A3A |
| tab bar fill | #1E1E22 at 88% | white at 90% |
| skeleton | white 7% | ink 7% |
| toast | bg #F5F5F0 / text #0A0A0B | bg #0A0A0B / text #F2F0EA |
| scrims | sheet black 55%, dialog black 60% | same |

**Fonts.** Display **Anton** (single weight; never bold) for titles and money: 40 tab-screen titles (line-height .95), 34 status headings/prices, 26 sub-screen titles, 24 dialog titles, 22 totals, 44 big payment amount. **Archivo** (400–800) for UI: body 13/1.5 `mute`; card title 700 15; input text 500 14; button 700 14 (secondary 600 13); chip 600 12. **DM Mono** 500 for tiny tracked uppercase labels: section label 9px +0.16em `faint`; input label 9px +0.14em `faint`; meta 10px +0.08em.

**Shape and space.** Screen side padding 20; section gap 24; card padding 16; grid gaps 12/18. Radii: cards 20, tiles 18, buttons 16, inputs 14, sheet top 28, dialog 24, pills/chips 99, small buttons 14. Cards are flat: 1px `line` border, **no shadows**. The only glow is the primary CTA: `0 10px 24px -12px rgba(255,165,31,.8)`. Hairline 1px, emphasis 1.5px, dashed `1.5px dashed line2` for empty states.

**Tab bar.** Floating pill at the bottom (outer padding 10/14/18, pill padding 8, radius 22, blurred fill, 1px `line`), **5 tabs**: first tab is role-based **[My ID | Profiles]** (holders see *My ID*, admin/manager see *Profiles*), then **Shop · Cart · Orders · Account**. Each item: Anton 14 mark above Archivo 600 9 label (marks ID/P · S · ₹ · O · A). Selected = solid accent pill with dark text; unselected = transparent, `mute`. Red `danger` count badge (min 16, Archivo 700 9, white) on **Cart** (quantity) and **Shop** (items needing action). Total height 92. Sub-screens such as detail, forms, checkout and chat hide the bar and use a 40×40 back button.

## Status chips (pill, 24 high in lists, 26 on detail; Archivo 700 10; glyph + text; background = text colour at 14% dark / 20% light)
| label (glyph) | dark text | light text |
|---|---|---|
| Awaiting payment ◔ · Refund due ↺ · Expires in N days ◔ · Pending review ◔ · Only N left ! | #FFC53D | #8A5A00 |
| Paid — awaiting seller ◔ · Placed ● | #7CB2FF | #1F5FC4 |
| Payment confirmed ✓ · Delivered ✓ · Approved ✓ · Active ● · Valid ✓ · Cash collected ✓ · In stock ✓ | #3DD68C | #1B7A3A |
| In dispute ! · Rejected ! · Expired ! · Out of stock ! | #FF6A55 | #B82A18 |
| Accepted ✓ | #FFB547 | #A35400 |
| Packed ▣ · Cash on delivery ₹ | #BBA2FF | #5B3BC4 |
| Shipped → | #4FD1C5 | #0F7A70 |
| Cancelled × · Suspended ‖ · Refunded ↺ · No payment ○ · Closed by admin ▤ · Draft ○ · Archived ▤ | #A8A8B0 | #55555C |

## Components and key measurements
- **Buttons:** primary = accent fill, dark text, radius 16, height 54–56 (inline 50, compact 46), CTA glow; secondary = transparent, 1px `line2`, `ink`; destructive = `danger` text on transparent with `danger` 1px border; disabled 40% opacity. Sticky bottom action bar: padding 16, `bg` with top hairline.
- **Inputs:** height 50, radius 14, fill `card`, 1px `line` (focus: 1.5px accent), mono uppercase label above (9px), error text Archivo 500 11 `danger` below. Mark required with `*`.
- **Cards:** `card` fill, 1px `line`, radius 20, padding 16. **List row:** 56–72 high, hairline divider, trailing chevron `›` in `faint`. **Stat tile:** `card`, radius 16, padding 14, Anton 28 number over mono 9 label (three in a row, gap 8).
- **Price text:** Archivo 700 14 (Anton 34 on detail); strike-through MRP Archivo 400 11 `faint`.
- **Countdown pill:** radius 99, height 26, mono 500 11, clock glyph ◔, text `mm:ss` (or `Xh Ym` over an hour); turns `danger` under 5 minutes.
- **Copy-row:** label (mono 9) over value (Archivo 700 15, UPI IDs in DM Mono) with a trailing `Copy` text button (accText) inside a `sunk` rounded 14 field; toast `Copied` after tapping.
- **Bottom sheet:** top radius 28, grabber 40×4, `sheetScrim`, title Anton 26, content padding 20, full-width action stack. **Dialog:** radius 24, padding 24, title Anton 24, scrim 60%, two buttons.
- **Toast:** pill at the bottom (above the tab bar when it is visible), `toastBg`/`toastFg`, Archivo 600 13.
- **Skeleton:** shapes of the real content filled with the `skel` colour, line radius 6. **Empty state:** dashed card, centred 48px glyph circle, Anton 22 title, body 13 `mute`, one button. **Error card:** `card`, `danger` glyph, message, `Tap to retry` secondary button (44 high).
- **Segmented filters:** pills height 36, radius 99; selected = accent fill with dark text, others 1px `line2`; horizontally scrollable with counts in mono.
- **Avatar:** circle with Anton initials (42 / 56). Section label above groups of rows. Stepper: height 34, buttons 32×32, radius 10.

## Global rules
1. **Frames:** 390×844 only, status bar and home indicator areas respected; keep 130px bottom padding on scrolling screens that show the tab bar. Long screens may be drawn as taller frames (same width) labelled `… (scroll)`.
2. Draw **dark and light** for every screen, with identical layout.
3. **No emoji.** Use the simple glyphs in the chip table or plain line icons. Status always shown as **text + glyph**, never by colour alone.
4. Touch targets **≥ 44×44**. Contrast must pass WCAG AA in both themes.
5. **Use only the copy given in the batch prompts. Never invent business copy, numbers, rules or policies.** If something needed is missing, write `[copy needed]` in that spot and list it in your closing notes. Use realistic *fake* sample data (names like Anil Masih, parish St. Mary's, ₹ amounts) but never real personal data.
6. Keep the editorial look: big Anton titles, mono micro-labels, hairline cards, single saffron accent used for the one primary action per screen.
7. Artboard labels: `<id> <title>` using the id from the batch prompt (e.g. `E1 Pay the seller · dark`), consistent with the existing `01 Home` style.

## Output contract
For every screen: produce the artboard(s) named as above **plus any state variants the batch prompt lists** (loading skeleton, empty, error, etc.), each in dark and light. End **every** message with a short bullet list: *what was drawn* (ids and variants), *assumptions you made*, and *anything marked `[copy needed]`*. If the message is getting long, **finish the screens you have completed, stop, and say which remain** so I can ask for them next — do not rush or drop states.

**Reply "READY" and wait for the batch prompts.**
