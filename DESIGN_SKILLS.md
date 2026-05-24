# Design skills for the Anubhav frontend

Install these in the FRONTEND repo so the anubhav-mobile-ui agent can use them.
They improve DESIGN ONLY on the new Anubhav screens. They must NOT restyle any
existing screen, theme, or font, and must NOT change behavior.

## Install (run in the frontend repo root)
```
npx skills add Leonxlnx/taste-skill        # taste: hierarchy, type, color, spacing, motion dials
npx skills add pbakaus/impeccable          # /polish pass + design vocabulary (run before shipping a screen)
npx skills add emilkowalski/skill          # real, tasteful motion / micro-interactions
```
Each adds a SKILL.md that Claude Code auto-discovers next session.

## Required dial settings (consistency with existing MUI app wins)
- design-variance: LOW  (match the existing app, don't diverge)
- motion-intensity: LOW–MEDIUM (subtle, purposeful; respect prefers-reduced-motion)
- visual-density: MEDIUM

## Hard boundary
- New Anubhav components/screens only.
- No app-wide theme/font changes; the existing default MUI look stays the base.
- Motion never blocks task completion and never reduces mobile usability/accessibility.
