# M2 — Session, auth and network (owner: auth-network-engineer)

Run milestone M2 per `docs/09-IMPLEMENTATION-PLAN.md (section M2)`.

**Agent:** `auth-network-engineer`.
**Read:** `docs/05-API-CONTRACT.md` (auth, envelope, errors), `docs/08-DATA-MODELS.md` (User), `docs/04-SCREENS-IDCARD.md` (Login), `docs/01-ARCHITECTURE.md` §3–§5, §11.
**Brief:** secure token store → session controller → dio + interceptors + error mapper (with tests for every status) → auth repository (`POST /auth/login`, all roles) → splash + login screen → redirect guard + role-based first tab → expiry handling → sign-out wipe → cold-start and offline hints.
**You verify (local backend, seeded accounts — see `docs/10-TESTING-QA.md` §5: `admin/admin123`, `cydmanager`, `seller1`, `seller2`, `buyer1` with password `Passw0rd1`, holder `anil1304/9000000001`):** admin, manager, holder, buyer, seller each log in and land on the right first tab (holder → My ID; every other seeded account → Profiles); wrong password shows the exact server message; the rate-limit message appears after repeated failures; token deletion returns to login; sign-out leaves no personal data.
**Reviewers:** `api-contract-verifier`, `flutter-code-reviewer`, `ui-fidelity-reviewer` (login screen).
**Check in** with me: I should be able to log in as each role.
