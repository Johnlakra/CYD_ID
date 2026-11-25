# CYD Shop Mobile — Design Overview

Nov 25, 2026 · @john

## Overview

The CYD Shop Mobile design is one clickable prototype of the Catholic Yuva Dhara app (Diocese of Jalandhar): member profiles and ID cards, plus a multi-vendor parish shop paid by peer-to-peer UPI. The canvas holds 42 phone artboards (390 × 844) in six labelled rows, and every artboard runs the same app, opened at a different screen.

| Canvas row | Artboards | What it covers |
| --- | --- | --- |
| Full app flow · press Play | 1 | Starts at the splash, then login; the whole app is clickable from here |
| Sign in & ID cards | 7 | Splash, login, holder profile, admin profiles, profile detail, card preview, account |
| ID cards: forms & account | 12 | Update photo and crop, filters, profile form (create, errors, edit), credentials, account info, password, create user, appearance, global states |
| Shop | 7 | Home, categories, search, storefront, product, cart, checkout |
| Pay the seller & orders | 8 | Pay the seller, pay several orders, order placed, my orders, order detail, chat, addresses, address form |
| Seller & admin | 7 | Become a seller, my shop, shop order, seller confirms payment, product form, shop applications, payment disputes |

Every artboard has a Dark switch in its settings; white is the default.

## Visual system

The look is white, quiet and editorial: serif headlines, a single champagne-gold accent and neutral photo frames waiting for real pictures.

| Element | Light (default) | Dark |
| --- | --- | --- |
| Page background | #FFFFFF, faint cool tint at the top | #0C0C0E with a warm gold glow at the top |
| Cards | White, 1 px hairline, soft lifted shadow, 24 px corners | #151518, same shape |
| Text | Ink #141416; muted 60 %; faint 46 % | Ink #F4F1EA; muted 60 %; faint 42 % |
| Accent | Gold #E8B04B; accent text #7E5410 | Gold #E8B04B; accent text #F0C77A |
| Status colours | Danger #C8321F, OK #1B7A3A | Danger #FF6A55, OK #3DD68C |
| Photo placeholder | Light grey gradient, image icon, label | Charcoal gradient, image icon, label |

**Type.** Instrument Serif for titles, prices and initials, with gold italic accents on a few headlines (“Shop the *diocese.*”). Manrope for all interface text. DM Mono for small tracked labels (section names, field labels, order numbers).

**Controls.**

- Buttons are pills. The one primary action per screen is gold with a soft glow; secondary buttons are outlined; destructive ones are outlined red.
- The tab bar is a floating frosted capsule of icon-only circles. The active tab is a gold circle; red count badges sit on Cart and Shop.
- Status chips always pair a glyph with text (◔ Awaiting payment, ✓ Payment confirmed, ! In dispute), never colour alone.

**Photo placeholders.** Product cards, the product gallery (“PRODUCT PHOTOS · SWIPE”), cart and order thumbnails, category tiles, the Home banner (“BANNER PHOTO · 16:9”) and the login hero (“HERO PHOTO · CATHEDRAL OR YOUTH EVENT”) are neutral frames. Profile photos show initials until a photo is uploaded.

## Roles and navigation

The ID card is admin-only: only administrators (and CYD managers) create, preview, share and print cards; profile holders never see a card or its validity.

| Role | First tab | Sees in Account | ID card access |
| --- | --- | --- | --- |
| Profile holder | My Profile: profile card, Update photo, My details | Update photo, Change password, Appearance, addresses, Become a seller / My shop | None |
| Seller | My Profile | As holder, plus My shop | None |
| Administrator / CYD manager | Profiles: overview stats, search, filters, member list | Profile information, Change password, Create user, Appearance, Shop applications, Payment disputes | Create, edit, preview, share, print, delete |

The tab bar has five tabs for everyone: My Profile or Profiles · Shop · Cart · Orders · Account. Detail screens, forms, checkout and chat hide it and show a back button.

**Prototype logins.** The login screen has three “try an account” buttons, which are for the prototype only: anil1304 (holder), seller1 (seller) and admin. Change password accepts “demo” or 9000000001 as the current password.

## Screens

Each artboard below opens the live prototype at that screen; the role in brackets is who it is drawn for.

| Artboard | Role | What it shows |
| --- | --- | --- |
| ID-02 Splash | All | CYD wordmark with a thin gold progress line, then login |
| ID-01 Login | All | Hero photo placeholder, username and password, error banner, prototype account buttons |
| ID-03 My Profile | Holder | Profile card, Update photo, My details list — no ID card |
| ID-05 Profiles | Admin | Overview stats, search, filter sheet, member rows with level and validity chips, row actions |
| ID-06 Filter sheet | Admin | Deanery, parish (after deanery), level, designation, sort |
| ID-07 Profile detail | Admin | Photo, chips, full details, holder-login note, ID card / Edit / Delete |
| ID-08 Profile form | Admin | Create, all-errors and edit states; photo, personal, church, address and card sections |
| ID-09 Credentials | Admin | Username and password to copy; “Profile restored” variant |
| ID-10 Card preview | Admin | Card, validity, Share card, Save PDF, Print, more actions |
| ID-04 Update photo + crop | Holder | Take or choose a photo, crop to the face, discard dialog |
| ID-12 Account | All | Profile card and role-based rows, Sign out dialog |
| ID-13 / 14 / 15 / 16 | Admin / all | Account information, change password with strength meter, create user, appearance sheet |
| ID-18 Global states | All | Session expired, account inactive, offline strip, offline error, no-access toast |
| 01 Home | Buyer | “Shop the diocese.”, Advent banner, quick pills, categories, featured shops, fresh products |
| 02–07 Shop | Buyer | Categories, search, storefront, product detail, cart, checkout |
| E1 Pay the seller | Buyer | UPI ID, amount and note to copy, QR, 12-digit UTR entry, waiting / confirmed states |
| E2 / E3 | Buyer | Pay several shops separately; order-placed confirmation |
| E4 My orders | Buyer | Filters with “Needs action”, pay-now strip with countdown |
| E5 Order detail | Buyer | Payment banner, timeline, items, payment & delivery, Open chat |
| E7 Order chat | Buyer / seller / admin | Messages, admin tag, system lines, composer |
| 12 / 12b Addresses | Buyer | Saved addresses and the address form |
| 13 / 15 / 16 / 17 | Seller | Become a seller, my shop, shop order, product form |
| E9 Confirm payment | Seller | “Check your bank app” banner and the match-the-reference sheet |
| 18 Shop applications | Admin | Applications to approve or reject |
| F4 Payment disputes | Admin | Open / Resolved / All, resolve sheet with outcome and note |

## Peer-to-peer UPI payment

CYD never holds money: the buyer pays the seller’s own UPI ID outside the app, types the 12-digit UPI reference (UTR), and the order moves on only when the seller confirms the same reference from their bank.

&#91;embedded content: peer-to-peer UPI payment · order states\]

Cash-on-delivery orders skip payment and go straight to fulfilment. Several shops in one checkout become separate orders, each paid on its own timer (E2).

## Open items

Five screens from the specs are not built yet, and a few strings and assets still need the owner’s input.

**Not built yet** (their buttons show “Not in this prototype yet”):

- [ ] E6 buyer report-a-problem sheet
- [ ] E8 evidence strip, add-evidence sheet and viewer
- [ ] E10 seller fulfilment stage strips
- [ ] F1–F3 seller application states, suspended shop, password-gated UPI change
- [ ] F5 admin dispute detail screen (the resolve sheet exists in F4)

**Needs input:**

- [ ] Real photos for products, categories, the Home banner and the login hero
- [ ] Real ID card backgrounds (Parish, Deanery, Dexco) for the admin card preview
- [ ] Wording for the Create user error when the username is empty (shows `[copy needed]`)
- [ ] Confirm the gold accent instead of CYD saffron
- [ ] Confirm sellers who are not youth members should still see the My Profile tab

**Sample data in the prototype:** extra member profiles, two shops’ UPI IDs, chat messages and the admin email are invented for the demo.
