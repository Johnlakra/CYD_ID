---
description: Run one milestone (M0–M10) of the CYD app plan with the right agents and reviewers
argument-hint: <milestone number 0-10>
---

Run **milestone M$ARGUMENTS** from `docs/09-IMPLEMENTATION-PLAN.md`.

1. Read the milestone section, the Global Definition of Done and the tracker. If a dependency milestone is not marked done, stop and say so.
2. Zero-pad the milestone number to two digits and read the kickoff prompt whose name starts with `M<nn>` in `prompts/` (e.g. `prompts/M03-profiles.md` for milestone 3); follow it.
3. Delegate tasks to the owner agent(s) named in the milestone. Give each a self-contained brief: goal, the exact doc sections to read, files owned, acceptance criteria, and the instruction to finish with the report format in its agent file. Independent tasks (different feature folders) may run in parallel; tasks touching the same files must not.
4. When the builders report, run `flutter analyze`, `dart format --output=none --set-exit-if-changed .` and `flutter test` yourself and read the output — do not rely on the agents' claims.
5. Run the reviewers: `api-contract-verifier` (if the network layer or models changed), `ui-fidelity-reviewer` (if screens changed), `flutter-code-reviewer` (always). Send blocking/major findings back to the owning builder; repeat until the reviewers pass.
6. Verify the milestone's acceptance criteria against the **local backend** with the seeded accounts where the milestone says so (`tools/LOCAL-BACKEND.md`).
7. Only then update the tracker row (status, date, notes), commit with `M<n>: <summary>`, and report to the owner: what was built, what was verified and how, open questions, items needing their visual sign-off. If anything could not be run, say so plainly.
