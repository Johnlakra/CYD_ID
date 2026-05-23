# Anubhav 2026 — Frontend (CYD_ID) project rules
- Read ../MASTER_PLAN.md and ../shared/API_CONTRACT.md before any task.
- Branch: feature/anubhav-2026-event-module. Never push to main/master.
- ADDITIVE ONLY: do not change existing pages, components, styles, or the default MUI theme.
- No react-router; navigation is selectedMenu state in Dashboard.jsx.
- Every CREATE page ships with its paired VIEW/MANAGE page in the same PR.
- New sidebar items show only for event_role loc|dexco; LOC sees its one place, DEXCO all three.
- PDFs are pure jsPDF, mobile-verified. Reuse apiClient, toast, dayjs.
- Run anubhav-manager first; it dispatches frontend-builder / ux-reviewer / pdf-specialist / repo-analyzer.
