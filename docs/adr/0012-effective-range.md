# ADR-0012: Effective range: the custom range prevails; the Builder does not persist

Status: Accepted · Date: 2026-09-26

## Context
The Explorer becomes editable (brush, Guardar, Reset). With two possible ranges per situation and stack
(the reference range from the PDF, ADR-0006, and the user's custom range), Quiz, Builder and Explorer need
a single rule to decide which one to train against. Until now the Builder also saved ranges,
so two screens were writing the same resource.

## Decision
- **Effective range = the custom range if one exists; otherwise, the PDF range.** All three tabs apply it through
  a single hook (`shared/api/queries.js#useEffectiveRange`). The UI shows when a custom range is being trained.
- **Only the Explorer writes custom ranges:** Guardar (`PUT`) and Reset (`DELETE`, back to the PDF range).
- **The Builder is an exercise:** it starts empty, is built from memory and is checked against the effective range. It does not persist.

## Consequences
If you adjust a range (for example, against a particular type of opponent), you train your own strategy; Reset restores the reference.
Statistics remain valid if you change a range, because each attempt stores the expected action
at the time of answering (ADR-0006, ADR-0007). A single write point avoids conflicts between tabs;
optimistic concurrency control (409) still covers multiple tabs or devices.
