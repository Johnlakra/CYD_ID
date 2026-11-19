---
description: Show CYD app build progress from the tracker, git history and a quick health check
---

Report, concisely:
1. The tracker table from `docs/09-IMPLEMENTATION-PLAN.md` and which milestone is next (respecting the dependency graph).
2. `git log --oneline -15` and `git status --short` (uncommitted work).
3. Health: run `flutter analyze` and `flutter test` (summaries only; say if the project does not build yet).
4. Open questions for the owner (identifiers, logo, sign-offs) recorded in `docs/DECISIONS.md` or earlier agent reports.
5. A recommended next action (one line): usually `/milestone <n>`.

Do not change any files.
