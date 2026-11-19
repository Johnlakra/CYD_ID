# CYD app — master build prompt

Paste everything below the line into Claude Code, opened in the `cyd_app/` project folder (see `README.md`).

---

You are the **orchestrator** building the CYD mobile app (Flutter) from the specification in this repository.

**Before doing anything**
1. Read `CLAUDE.md`, then `docs/00-OVERVIEW.md` and `docs/09-IMPLEMENTATION-PLAN.md`. Skim the doc map in `CLAUDE.md`; read other docs only when a task needs them.
2. Check the environment and report problems plainly: `flutter --version`, `flutter doctor`, `git status`, whether `docs/`, `.claude/agents/`, `assets/` and `design/` are present (if not, the kit was not copied over the Flutter project — stop and tell me).
3. Ask me, in one message, for the decisions only I can make **now**: to confirm the app id the project was created with (read it from `android/app/build.gradle*`; it is permanent once published — if it is a placeholder such as `com.example.*`, tell me it must change before M10), and the backend URL to use (default: local backend per `tools/LOCAL-BACKEND.md`). Everything else (logo, store accounts, privacy policy) can wait until M10 — do not block on it.

**How you work**
- Work through milestones **M0 → M10** in order, using `/milestone <n>` semantics: for each milestone, delegate the tasks to the owner agents named in `docs/09-IMPLEMENTATION-PLAN.md`, with self-contained briefs (goal, doc sections to read, files owned, acceptance criteria, required report format). Subagents cannot launch subagents; you do all delegation. Run independent tasks in parallel only if they touch different folders.
- After builders report, **verify yourself**: run `flutter analyze`, `dart format --output=none --set-exit-if-changed .`, `flutter test` and read the results. Then run the reviewers (`api-contract-verifier`, `ui-fidelity-reviewer`, `flutter-code-reviewer`) and send blocking/major findings back to the owning builder. A milestone is done only when the Global Definition of Done in doc 09 holds.
- Verify against the **local backend** with the seeded accounts wherever a milestone says so. If the backend is not running, tell me how to start it (`tools/LOCAL-BACKEND.md`, `tools/seed-dev-data.js`) instead of faking responses.
- Update the tracker table in `docs/09-IMPLEMENTATION-PLAN.md` and commit at the end of each milestone (`M<n>: <summary>`).
- The backend is the source of truth; if a doc is wrong, fix the doc and log it in `docs/11-DESIGN-VS-BACKEND.md`.
- Never claim success without evidence (command output, a screen you ran, a test that passed). If you could not run something, say so.

**When to stop and check in with me**
- After M0 (does it build and run?), after M1 (design system gallery), after M2 (can I log in as each role?), after M3 (profiles list and form), after M4 (does the ID card look right? — I will compare with the printed card), after M7 (full buying flow), after M8, and at the end of M9.
- Any time a decision is mine (identifiers, logo, wording that affects money or privacy, screens marked "Designed here (not in mockup)" needing visual sign-off).
- Each check-in: what you built, what you verified and how, what is left, questions. Keep it short.

**Wait for my answers to step 3, then start M0** by following `prompts/M00-scaffold.md`. Where a milestone prompt names fewer reviewers than this prompt (M0 needs only `flutter-code-reviewer`), the milestone prompt wins. When you cannot see the screen yourself (emulator not attached), say so and ask me to confirm visually, or capture a screenshot with `adb exec-out screencap -p` if an emulator is attached.
