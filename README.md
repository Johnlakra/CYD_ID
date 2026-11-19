# CYD App Kit

Everything needed to have **Claude Code** build the **CYD mobile app** (Flutter, Android first then iOS):
a complete specification, an 11-agent team, milestone prompts, card backgrounds, master data and a seed
script for the real backend. Scope: **ID cards + Shop** (peer-to-peer UPI marketplace).

> **Honest limits.** This kit was written without a Flutter toolchain. **No Dart in it has been compiled** — the first
> compile happens in milestone M0. Screens that are not in the Claude Design mockup (all ID-card screens and the
> peer-to-peer pay/chat/dispute screens) were designed in the same visual language and need the owner's visual
> sign-off. `design/CYD Shop Mobile.dc.html` is reference data and may need the original artifact link to render.
> Package versions are not pinned: Claude resolves them at M0 with `flutter pub add`.

## What you need on your computer
- Flutter SDK (stable) with Android Studio / an emulator or a phone. Check with `flutter doctor`.
- [Claude Code](https://claude.com/claude-code) installed and logged in.
- Node 18+ and MariaDB/MySQL **only** if you want to run the backend locally (see `tools/LOCAL-BACKEND.md`).
- Git.

## Use it in 4 steps

1. **Unzip** this kit somewhere (it creates a folder `cyd-app-kit/`).
2. **Create the Flutter project first, then lay the kit over it** (so the kit's files win). Run this in the folder that *contains* `cyd-app-kit/` (macOS/Linux/Git Bash; on Windows PowerShell use `Copy-Item -Recurse -Force cyd-app-kit\* cyd_app\` and also copy the hidden `cyd-app-kit\.claude` folder):
   ```bash
   flutter create --org com.yourorg --project-name cyd_app --platforms android,ios cyd_app
   cp -R cyd-app-kit/. cyd_app/
   cd cyd_app
   git init && git add -A && git commit -m "Start from CYD app kit"
   ```
   Replace `com.yourorg` with your organisation's reverse domain. It becomes the permanent Android/iOS
   app id — see `docs/13-RELEASE.md`. The kit's `README.md` replaces the generated one, which is fine.
3. **Start a local backend with test data** (recommended; otherwise point to the production URL): follow
   `tools/LOCAL-BACKEND.md` (it needs Node and MariaDB/MySQL installed by you — Claude Code cannot install a database for you), then `node tools/seed-dev-data.js` from `cyd_app/`. If you cannot run a backend, use a **staging** copy, never production: the seed script creates accounts. This creates one login per role
   (`admin/admin123`; every other account uses `Passw0rd1`; the holder logs in with the phone number as password — the script prints them).
4. **Start Claude Code in `cyd_app/` (run `claude`) and paste the part of `prompts/00-MASTER-BUILD-PROMPT.md` below its `---` line.** Claude will ask permission before running commands (`flutter`, `git`, `curl`…); the kit ships `.claude/settings.json` with a conservative allow-list so routine ones do not prompt.
   The main Claude Code session acts as orchestrator and works milestone by milestone (M0 → M10),
   calling the specialist agents in `.claude/agents/`. `/status` shows progress; `/milestone <n>` runs a milestone.

You can also paste `docs/CYD-APP-SPEC-FULL.md` (all docs in one file) into a normal chat to ask questions about the app.

## What is in the kit

| Path | What |
|---|---|
| `CLAUDE.md` | Project memory Claude Code loads automatically: rules, conventions, doc map |
| `docs/00-OVERVIEW.md` … `13-RELEASE.md` | The specification (read `00` first; the doc map is in §5) |
| `docs/CYD-APP-SPEC-FULL.md` | All docs concatenated |
| `.claude/agents/` | 11 specialist agents (architect, design system, auth/network, ID card, shop customer, seller/admin, contract verifier, UI reviewer, code reviewer, tester, release) |
| `.claude/commands/` | `/milestone`, `/verify-contract`, `/review-ui`, `/status`, `/ship-check` |
| `prompts/` | Master prompt + one kickoff prompt per milestone (M00–M10) |
| `design/` | Reference mockup (HTML), `tokens.json` (dark/light), `SCREEN-MAP.md` (mockup screen → spec → route) |
| `assets/idcard/` | Card backgrounds for Parish, Deanery, Dexco (full resolution) and the login overlay |
| `assets/fonts/` | `Gafata-Regular.ttf` (other fonts come from `google_fonts`) |
| `assets/data/` | `deaneries.json` (16 deaneries, 154 parishes), `levels.json`, `designations.json` |
| `tools/` | `LOCAL-BACKEND.md` and `seed-dev-data.js` |

## The backend this app talks to
The mobile app uses the **existing** Node/Express backend (`Johnlakra/cyd_Id_BE`), on the branch that has the shop
and peer-to-peer payments (`claude/happy-bell-oy6or2` at the time of writing; use `main` once it is merged — if the
shop endpoints answer 404, you are on the wrong branch). Production URL used by the web app:
`https://cyd-id-be.onrender.com` (free tier: the first request after idle can take 30–60 s).

## Things only you can decide (the agents will stop and ask)
App identifiers and publisher accounts, a standalone logo/icon, support contact, privacy-policy URL and data
retention, what may be sold in the shop, and visual approval of screens the mockup did not cover. See `docs/13-RELEASE.md`.

## If something goes wrong
- Claude Code stalls or loses context: run `/status`, then `/milestone <n>` again — progress lives in `docs/09-IMPLEMENTATION-PLAN.md` (tracker) and git history, not in the chat.
- A doc and the backend disagree: the **backend code wins**; fix the doc and note it in `docs/11-DESIGN-VS-BACKEND.md`.
- The seed script says "429": the backend rate-limits logins; wait 15 minutes or restart the local backend.
