# command-surface-collapse

- **Plan**: `docs/plans/_command-surface-collapse.md` (retired)
- **ADR**: 252 (`252-close-out-plan-command-surface-collapse.md`)

## Delivered

- Replace listAreaPrompts() with one rule-area prompt (arguments area, request).
- Replace rolePrompts() with one rule-persona prompt (arguments persona, topic).
- areaBody lists every area id with its hub skill and members.
- personaBody lists every role id and performs the depth-intent decision from the request.
- Drop the hub/skill narrowing that only existed for the 11 area commands; keep family and preset names.
- commandHelp and the generated host artifacts cover the two dispatchers (16 blocks).
- Rendering, areas, personas and help-parity suites assert the collapse (no rule-area-<x> or rule-persona-<x> left).
- Regenerate the census (15/16/17/21/22) and record the decision.
- agent-commands --sync removes the 30 stale files, writes the 2, and /rule-area ui check this HTML routes.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
