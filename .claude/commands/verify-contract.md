---
description: Check the app's repositories and models against docs/05-API-CONTRACT.md and the running backend
argument-hint: [feature folder or "all"]
---

Launch the `api-contract-verifier` agent on scope: **$ARGUMENTS** (default: all of `lib/`).

Before launching, confirm the local backend is running (`curl -s http://127.0.0.1:3000/health` from the host; the Android emulator uses `http://10.0.2.2:3000` — use the URL in `tools/LOCAL-BACKEND.md` if the owner changed the port); if not, tell the owner how to start it (`tools/LOCAL-BACKEND.md`) and run the static part only, saying the live check was skipped.

When the agent reports: list blocking/major findings, assign each to the owning builder agent (or fix the doc if it is a *doc defect* — update `docs/05`, `docs/08` and log it in `docs/11`), and re-run until PASS.
