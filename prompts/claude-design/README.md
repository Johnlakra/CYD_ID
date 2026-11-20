# Claude Design prompts — the 29 screens the mockup does not have

The existing design file ("CYD Shop Mobile") has 19 shop screens. These prompts make Claude Design draw the rest in the same style:
15 shop screens (pay the seller, order detail, chat, disputes, seller/admin states…) and 18 ID-card/account screens.
They are **self-contained** (Claude Design cannot read GitHub or your files), so paste the text itself.

## Order
1. Open the **same design project/file** that contains "CYD Shop Mobile" (so the new artboards are added next to the old ones).
2. Paste `00-CONTEXT.md` **once**. Wait for it to answer "READY".
3. Paste the batches one at a time, waiting for each to finish:
   `A-pay-and-orders.md` (E1–E4) → `B-order-detail-chat-sheets.md` (E5–E10) → `C-seller-admin.md` (F1–F5) → `D-idcard-and-account.md` (ID-01…ID-18).
4. Batch D is the largest: it is split into D1–D4 inside the file. If the tool stalls or truncates, paste D1, D2, D3, D4 separately. The same trick works for any batch (paste half the screens per message).
5. Before batch D, **upload the three ID-card backgrounds** (`assets/idcard/Parish.jpg`, `Deanery.jpg`, `Dexco.jpg`) into the chat so the card is drawn on the real artwork.
6. `CLAUDE-DESIGN-ALL-IN-ONE.md` is 00 + A–D in one file for tools that accept a very long paste; one-batch-at-a-time usually gives better results.

## After generating
- Review every new artboard (dark and light). Anything wrong: tell Claude Design which artboard and what to change.
- Where the tool wrote `[copy needed]`, supply the wording (these are the strings the specs leave to the owner).
- Share the final design link; then update `design/SCREEN-MAP.md` and mark each "Designed here (not in mockup)" screen as approved. The Flutter build prompts (`prompts/M*.md`) ask for your visual sign-off on exactly these screens.
- The specs remain the source of truth for behaviour (`docs/03-SCREENS-SHOP.md`, `docs/04-SCREENS-IDCARD.md`); the design only fixes how they look.
