---
description: Pre-release gate — run every check and list what blocks a release
---

Act as release gatekeeper. Do not fix anything in this command; report.

1. Tracker: M0–M9 all done? If not, list the gaps.
2. Run `flutter analyze`, `dart format --output=none --set-exit-if-changed .`, `flutter test`; run the integration suite if the local backend is up.
3. Launch `api-contract-verifier`, `ui-fidelity-reviewer`, `flutter-code-reviewer` over the whole app; collect verdicts.
4. Launch `release-engineer` to walk the `docs/13-RELEASE.md` checklist and the `docs/10-TESTING-QA.md` §8 sign-off list.
5. Scan for secrets and personal data: `git grep -nEI "(BEGIN (RSA |EC )?PRIVATE KEY|AKIA[0-9A-Z]{16}|sk_live_|api[_-]?key *[:=] *['\"][A-Za-z0-9]{16,})" -- . ':!docs' ':!tools'` and look for keystores/`key.properties`/`.env` in `git ls-files`.
6. Output a table: **Blocker / Owner decision needed / OK** per area, with the evidence (command + result). End with GO / NO-GO and the shortest path to GO.
