---
description: Review one screen (or all screens of a feature) against the spec, tokens and mockup
argument-hint: <screen name, route, or feature folder>
---

Launch the `ui-fidelity-reviewer` agent for: **$ARGUMENTS**.

Give it the spec section to compare with (use `design/SCREEN-MAP.md` to find the mockup frame, the doc section and the route). Ask for dark and light, 360/390/412 px and text scale 1.3. Collect its findings, send blocking/major ones to the owning builder (see `CLAUDE.md` agents list), and re-run. List the "needs owner sign-off" screens at the end for the human.
