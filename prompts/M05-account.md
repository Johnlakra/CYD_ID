# M5 — Account area (owners: idcard-engineer + auth-network-engineer)

Run milestone M5 per `docs/09-IMPLEMENTATION-PLAN.md (section M5)`.

**Agents:** `auth-network-engineer` (password, create user, appearance, sign-out), `idcard-engineer` (account info for holders, role-specific rows) — they touch different files; coordinate on the Account root screen (auth-network-engineer owns it).
**Read:** `docs/04-SCREENS-IDCARD.md` (Account), `docs/05-API-CONTRACT.md` (auth profile, change-password ×2, register), `docs/06-DOMAIN-RULES.md` (password rules).
**You verify:** every role's Account screen shows only what that role may see; both change-password endpoints enforce the same strict rules in the UI; admin can create a user; theme choice persists.
**Reviewers:** all three.
