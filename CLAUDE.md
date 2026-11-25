# CYD app — project memory for Claude Code

You are building the **CYD mobile app** (Catholic Yuva Dhara, Diocese of Jalandhar): Flutter (Dart 3), Android first
then iOS, package `cyd_app`. It covers **ID cards** (youth member cards, profile management) and the **Shop**
(multi-vendor marketplace with peer-to-peer UPI payments). It talks to an **existing** backend; you do not change the backend.
The full specification is in `docs/`. Read `docs/00-OVERVIEW.md` first.

## Operating model
- The **main session is the orchestrator**. Subagents (`.claude/agents/`) cannot start other subagents — you delegate, they work and report.
- Work **one milestone at a time** (`docs/09-IMPLEMENTATION-PLAN.md`, M0 → M10). Update the tracker table at the bottom of that file when a milestone's acceptance criteria are met and the reviewers report no blocking findings.
- Use `/status`, `/milestone <n>`, `/verify-contract`, `/review-ui <screen>`, `/ship-check`.
- Never claim something works because it compiles. Run it: `flutter analyze`, `flutter test`, and the flow on the emulator against the **local backend** (`tools/LOCAL-BACKEND.md`, `tools/seed-dev-data.js`).
- Stop and ask the owner when a decision is theirs (identifiers, logo, policy URLs, visual sign-off of screens marked "Designed here (not in mockup)").

## Non-negotiable rules
1. **The backend is the source of truth.** If a doc and the backend disagree, trust the backend, fix the doc, log it in `docs/11-DESIGN-VS-BACKEND.md`.
2. **Money is `int` paise.** Never `double`. Show as `₹x.xx` via `core/format/money.dart`. **One exception:** product create/update request bodies carry rupees as a two-decimal *string* built from int paise (`paiseToRupeesString`, never float math); everything the API returns is `*_paise` (doc 05 §products, doc 06 §7.1).
3. **The server decides what is allowed.** Order screens show buttons only from `allowed_actions` / `dispute_reasons`. Never re-derive order/payment rules in the app.
4. **No unverified claims about payments.** The platform never holds money: buyers pay sellers directly by UPI and enter the UTR; sellers confirm.
5. **Cart is client-side** (no cart API); revalidate with `POST /shop/products/lookup`.
6. **Write names differ from read names for profiles**: send `father_name`, `mother_name`, `date_of_birth`; read `father`, `mother`, `dob`. Always go through the model's `toRequest()`/`fromJson()`.
7. **Design tokens only.** Colours/typography/spacing come from `CydTokens` (`design/tokens.json`); no hard-coded hex or font sizes in screens. Fonts (design v2, bundled): Instrument Serif (display), Manrope (UI), DM Mono (labels). Accent gold `#E8B04B` (owner-confirmed 2026-11-25). Text meets 4.5:1 contrast. Dark and light are both first-class.
8. **Four states everywhere**: loading skeleton, empty, error with retry, data. Mutations disable their button; no double-submit.
9. **Widgets never call `dio`.** Layering: presentation → application (Riverpod) → data (repositories) → network.
10. **Security/privacy**: tokens only in secure storage; never log tokens, passwords, UTRs, base64 or photos; release builds are HTTPS-only; sign-out wipes personal caches, the user's cart and wishlist.
11. **Do not invent API fields.** Every endpoint, field and error message used must appear in `docs/05-API-CONTRACT.md` (or be added there after you verify it against the running backend).
12. **Hand-written models, no code generation.** Riverpod without `riverpod_generator`.
13. **No `TODO`/placeholder code left behind** in a milestone you mark done.
14. Never commit secrets, `.env`, keystores, real user data or real photos. Test fixtures use the seeded fake data.

## Conventions
- Routes, tabs and folders exactly as in `docs/01-ARCHITECTURE.md` §2 and §6 (5 tabs: **[My ID | Profiles] · Shop · Cart · Orders · Account**; the first tab's root depends on role).
- Roles: `admin`, `user` (CYD manager), `profile_holder`, plus any logged-in user can be a buyer; a seller owns an approved shop.
- Feature folders: `auth idcard account marketplace cart addresses checkout payments orders seller owner admin` + `core`.
- Tests mirror `lib/`; goldens for the ID card and key screens (dark + light); integration tests per role in `integration_test/`.
- Commit small and often, message style `M3: profile filters sheet`. Each milestone ends with analyze + format + tests green.
- Package versions are resolved with `flutter pub add`; record non-obvious choices in `docs/DECISIONS.md` (create at M0).

## Doc map (read the one you need, not all)
| Need | Read |
|---|---|
| What/why, roles, decisions D1–D10, glossary | `docs/00-OVERVIEW.md` |
| Structure, state, networking, routing, security | `docs/01-ARCHITECTURE.md` |
| Colours, type, components, motion | `docs/02-DESIGN-SYSTEM.md`, `design/tokens.json` |
| Shop screens (mockup 01–18 + P2P screens) | `docs/03-SCREENS-SHOP.md`, `design/SCREEN-MAP.md` |
| Login, My ID, Profiles, forms, account | `docs/04-SCREENS-IDCARD.md` |
| Every endpoint, payload, error | `docs/05-API-CONTRACT.md` |
| State machine, timers, disputes, validation, formats | `docs/06-DOMAIN-RULES.md` |
| ID card geometry, fonts, export | `docs/07-ID-CARD-RENDERING.md` |
| Models and JSON mapping | `docs/08-DATA-MODELS.md` |
| Milestones, DoD, tracker | `docs/09-IMPLEMENTATION-PLAN.md` |
| Testing, role checklists, local backend | `docs/10-TESTING-QA.md`, `tools/` |
| Mockup ↔ backend conflicts | `docs/11-DESIGN-VS-BACKEND.md` |
| Optional backend improvements | `docs/12-BACKEND-ASKS.md` |
| Stores, signing, privacy | `docs/13-RELEASE.md` |

## Shared files — who edits what, and when
Most files have one owner (see each agent file). These are touched by several agents; follow this to avoid conflicts, and commit between agents.

| File / folder | Owner | Others may |
|---|---|---|
| `lib/app/router.dart` | `app-architect` creates it | each feature agent adds **only its own routes** (as listed in doc 01 §6) in its milestone, in a separate commit |
| `lib/app/shell.dart`, tab bar | `design-system-engineer` | feature agents only feed badge counts through the provider it exposes |
| `lib/core/media/*` (image resize/data URL) | `idcard-engineer` (M3) | `shop-customer-engineer` and `shop-seller-admin-engineer` **reuse** it for product/evidence/payment images — request changes via the orchestrator |
| `lib/models/paging.dart` and other shared models | `app-architect` (M0 creates `paging`, `api_exception`) | feature agents create their own models |
| `lib/features/account/*` (Account root) | `auth-network-engineer` | `idcard-engineer` adds holder/profile rows (M5); shop agents add the Sell / My shop / Admin rows in M6/M8 — each in a small separate commit |
| `lib/features/orders/presentation/order_detail*` | `shop-customer-engineer` | `shop-seller-admin-engineer` adds seller/admin sections in M8 without rewriting buyer parts |
| `lib/core/strings.dart` (shared copy) | `app-architect` | add strings next to the feature that uses them; do not duplicate copy |
| `docs/*` | the orchestrator | agents propose edits in their report; the orchestrator applies them |

## Definition of done (every task)
`flutter analyze` clean · `dart format` clean · tests for new logic · widget tests for the four states · golden tests where the spec has exact visuals · endpoints match `docs/05` · screen matches its spec · works against the local backend for each role involved · tracker/docs updated · no secrets or personal data in logs or commits. The full list is in `docs/09-IMPLEMENTATION-PLAN.md`.

## Agents (invoke by name)
`app-architect` · `design-system-engineer` · `auth-network-engineer` · `idcard-engineer` · `shop-customer-engineer` · `shop-seller-admin-engineer` (builders) · `api-contract-verifier` · `ui-fidelity-reviewer` · `flutter-code-reviewer` (reviewers, read-only on `lib/`) · `test-engineer` · `release-engineer`.
Give each agent a self-contained brief: milestone, the doc sections to read, the files it owns, the acceptance criteria. Builders must end with a report (files changed, tests run and their results, open questions). Run the three reviewers after each milestone and fix blocking findings before moving on.
