# M9 — Quality pass (owners: test-engineer + the three reviewers)

Run milestone M9 per `docs/09-IMPLEMENTATION-PLAN.md (section M9)`.

1. `test-engineer`: gap analysis against doc 09 acceptance criteria, add missing unit/widget/golden tests, write integration tests per role against the local backend, then walk the manual checklists in `docs/10-TESTING-QA.md` §5 and log results in `docs/reviews/QA-RUN-<date>.md`.
2. `api-contract-verifier` over all of `lib/` with live calls.
3. `ui-fidelity-reviewer` over every screen at 360/390/412 px, dark and light, text scale 1.3; accessibility.
4. `flutter-code-reviewer` over all of `lib/`; security and privacy sweep (logs, storage, cleartext, secrets).
5. Fix every blocking and major finding via the owning builder; repeat until all three pass.
**Done when:** doc 10 checklists pass, integration suite green, zero blocking/major findings. Report honestly what could not be run.
