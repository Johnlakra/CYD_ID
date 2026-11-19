# M1 — Design system and shell (owner: design-system-engineer)

Run milestone M1 per `docs/09-IMPLEMENTATION-PLAN.md (section M1)`.

**Agent:** `design-system-engineer`.
**Read:** `docs/02-DESIGN-SYSTEM.md` (all), `design/tokens.json`, `design/SCREEN-MAP.md`, `docs/01-ARCHITECTURE.md` §6–§7, §10.
**Brief:** tokens → theme (dark/light, mode controller) → fonts → every component in the doc 02 catalogue → `ShellScaffold` with the floating pill tab bar (5 tabs, badge, role-based first tab, hide rules) → hidden Design Gallery route → golden tests (dark + light, 390 px).
**You verify:** gallery runs in both themes; goldens committed and passing; tab bar behaviour per doc 02.
**Reviewers:** `ui-fidelity-reviewer` (gallery vs mockup frames), `flutter-code-reviewer`.
**Check in** with screenshots/descriptions of the gallery in both themes for my visual approval of the system before screens are built.
