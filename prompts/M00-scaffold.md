# M0 — Scaffold and foundations (owner: app-architect)

Run milestone M0 per `docs/09-IMPLEMENTATION-PLAN.md` (section "M0 — Scaffold and foundations"). The project already exists (README step 2): only delete the generated `test/widget_test.dart`, do not re-run `flutter create`.

**Agent:** `app-architect`.
**Read:** `docs/01-ARCHITECTURE.md` (all), `docs/06-DOMAIN-RULES.md` §Formats, `tools/LOCAL-BACKEND.md`.
**Brief to give the agent:** create the foundation exactly as doc 01 §2 prescribes — packages via `flutter pub add`, folder layout, `analysis_options.yaml`, asset registration (card images, Gafata font, JSON data), `core/config/env.dart` (`API_BASE_URL`, `FLAVOR`), `core/network` skeleton with tests, `core/storage`, `core/format` with unit tests, `main.dart` + router with `/splash` and `/login` placeholders, CI workflow, `docs/DECISIONS.md`. Prove connectivity with `GET /health` against the local backend.
**Brief additions:** the exact package list, pubspec asset/font registration, debug-only cleartext setup, `.gitignore` additions and the `/debug/health` route are spelled out in `docs/09-IMPLEMENTATION-PLAN.md` M0 tasks 2, 4, 9, 10 — hand them to the agent verbatim.
**You verify:** `flutter analyze`, format check, `flutter test` all green; app launches on an emulator/device; the three card backgrounds render; `git ls-files` contains no secrets.
**Reviewers:** `flutter-code-reviewer` only.
**Check in with me** when done: what runs, which package versions were chosen, anything in the docs that was wrong.
