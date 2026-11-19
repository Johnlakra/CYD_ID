# M10 — Release (owner: release-engineer)

Run milestone M10 per `docs/09-IMPLEMENTATION-PLAN.md (section M10)` and `docs/13-RELEASE.md`.

**Agent:** `release-engineer`.
First ask me for the owner decisions listed in `docs/13-RELEASE.md` §1 (app name, accounts, logo, support contact, privacy-policy URL, retention) and confirm the app id already in the project is the final one. Do not invent them.
**Brief:** flavors/config → Android permissions/manifests/signing docs → iOS configuration (state plainly if this machine cannot build iOS) → versioning → CI release workflow → build the release artifact → clean-device smoke test per role → privacy/data-safety drafts → store listing assets from seeded data → owner to-do list.
**You verify:** signed release build installs, uses the production HTTPS URL, passes the smoke checklist; run `/ship-check` and report GO / NO-GO.
