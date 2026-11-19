# M4 — ID card rendering, export and My ID (owner: idcard-engineer)

Run milestone M4 per `docs/09-IMPLEMENTATION-PLAN.md (section M4)`.

**Agent:** `idcard-engineer`.
**Read:** `docs/07-ID-CARD-RENDERING.md` (all), `docs/04-SCREENS-IDCARD.md` (My ID, card preview), `docs/08-DATA-MODELS.md` (Profile), `assets/idcard/*`, `assets/fonts/*`.
**Brief:** card widget (3 level backgrounds, mm→px scale, fonts, long-text policy) + golden tests for the six fixtures (doc 07 §14.3) → preview with zoom → PNG/PDF/share/save/print → My ID for holders (validity chip, renewal copy, photo update, offline cache) → open any profile's card from the list.
**You verify:** export a card and compare with the web card for the same data (describe the comparison); PNG 1728×2620 by default (doc 07 §export also defines an "original quality" size); PDF page equals card size; holder sees the card offline after one online load.
**Reviewers:** `ui-fidelity-reviewer` (the card is the most visible artefact — be strict), `flutter-code-reviewer`.
**Check in** with me and ask me to compare a printed/web card to the exported one.
