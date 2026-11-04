# P0/P1 close-out: first public slice

Date: 2026-11-04
Parent issues: P0, P1 (see `ROADMAP.md`)
Branch: `main` (brand-new repository; no pre-existing history to protect)

## What shipped

- Landing page with the finding, the before/after table, and the public boundary.
- Eight integration cards: inventory/LiDAR, climate, disturbance, habitat, carbon,
  operations, provenance, and storyboards.
- Evidence chips on every card: a source note and at least one target-repository
  issue or pull request.
- Static TFL 6 case-study map from a 9 KB public GeoJSON fixture, with layer
  toggles, keyboard-selectable blocks, zoom, and a scale bar.
- Four-row `femic.climate.v1` contract sample, labelled synthetic.
- Disabled HectaresBC-style assistant drawer, with the safe-backend contract in
  `docs/assistant.rst`.
- Provenance and limitations panel, including the live-work roadmap.
- Site contract tests and the seeded workflow tests.
- Sphinx docs and a Pages workflow that serves the demo at the root and docs at
  `/docs/`.

## Verification

Run on 2026-11-04:

```text
GATE                STATUS   SECONDS
lint                GREEN       0.06
format              GREEN       0.07
types               GREEN       0.22
tests               GREEN       6.92
validator           GREEN       0.12
docs                GREEN       0.71

OVERALL: GREEN. Every gate passed.
```

Manual browser checks (Chromium 156):

- 1440 px and 375 px layouts have no horizontal scroll (`scrollX` stays 0).
- The map renders 7 blocks, 1 road, and 1 landing with no console errors.
- Selecting a block updates the detail panel.
- The assistant drawer opens, focuses the close button, traps Tab, closes on
  Escape, and reports the disabled state.
- Reduced-motion mode disables smooth scrolling and transitions.

## Evidence links

- Registry: https://github.com/UBC-FRESH/irss-expansion
- Executive brief: https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/09-executive-brief.md
- First-wave briefs: https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/05-first-wave.md
- TFL 6 fixture: https://github.com/UBC-FRESH/fhops/tree/main/examples/lidar_tfl6
- INV-01 pilot release: https://github.com/UBC-FRESH/femic/blob/main/notes/reports/inv01-tsa23-ba-pilot-release.md

## What is not done

- No live LLM. The drawer is disabled and `assistantEndpoint` is `null`.
- No live tile service. The map is a single public fixture.
- No generated cards from the registry; the counts and statuses are a dated
  snapshot.
- No field validation, calibrated cost, production rate, or operational plan.
- No browser smoke test in CI; the manual Chromium pass is recorded above.

## Next phases

P2 adds an opt-in same-origin assistant. P3 replaces the fixture with a
permissioned layer service. P4 generates the cards from the registry and adds a
dated evidence page per card. See `ROADMAP.md`.
