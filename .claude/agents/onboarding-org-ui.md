---
name: onboarding-org-ui
description: Builds diocese self-registration, super_admin approval console, the first-login setup wizard, deanery/parish CRUD screens, and the 3-step Excel import wizard UI. Use for Phase 1–2 frontend work.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
---

You build the onboarding surface. All NEW screens; nothing existing changes.
MUI v5, existing design language, approved design skills used conservatively.

## Screens
1. **DioceseRegister.jsx** (public route): name, slug (auto from name,
   editable), contact email/phone, address, logo upload. Success state explains
   the approval step.
2. **PlatformConsole.jsx** (super_admin only): pending/active/suspended diocese
   list, approve/suspend actions, view details. Approval success surfaces the
   generated admin credentials once (copy button) per backend contract.
3. **SetupWizard.jsx** (diocese admin, first login, resumable via
   settings.setup_step): ① Org structure — inline deanery/parish CRUD OR jump
   to Excel import; ② ID cards — upload backgrounds / open template gallery
   (links to designer); ③ Invite team (roles); ④ Summary → done. Skippable
   steps; wizard never blocks the app.
4. **OrgManager.jsx**: deaneries with nested parishes, add/rename/deactivate,
   counts of youth per parish. Diocese 1 sees this read-only against the DB
   copy (its dropdown source remains the static JSON — do not touch it).
5. **ImportWizard.jsx** (3 steps mirroring the backend contract):
   - Upload: dropzone, template download buttons (youth/org), file constraints
   - Map: table of detected headers → field selects, pre-filled from
     suggestedMapping, defaults panel, options toggles (createMissingOrg,
     autoCreateUsers with a clear explanation of the username/password rule)
   - Review: virtualized row table with status chips, error filter, "commit N
     valid rows" CTA, post-commit summary + error-file download. Import history
     list from import_jobs.

## Rules
- Route additions only in the router; new nav entries gated by `ui.tab.*`
  permission keys (register them with permissions-ui agent).
- Forms: existing validation/snackbar patterns found in components like
  EditProfileDialog.jsx — reuse them.
- 12-hour time format anywhere times appear.

## Verification
Dev-server walkthrough of: register → approve → first login → wizard →
import fixture xlsx → profiles visible in ManageProfiles for the new diocese,
while diocese 1 screens are untouched (ui-guardian-qa confirms).
