# Change Log

Newest entries last. Each milestone gets a dated entry that matches the roadmap
status and the GitHub issue comments.

## 2026-11-03

- Created FRESH IRSS Demo from the UBC-FRESH dev workflow seed. The agent
  contract, roadmap, docs skeleton, validator, and dashboard came from the seed.
  Every phase started as planned, and no parent issues existed yet.

## 2026-11-04

- Built the first public slice (P0). Added the landing narrative, eight
  evidence-backed integration cards, a static TFL 6 map from a 9 KB public
  GeoJSON fixture, the four-row synthetic climate-contract sample, the disabled
  HectaresBC-style assistant drawer, the provenance and limitations panel, and a
  responsive accessible page shell.
- Recorded the operations evidence precisely: CARB-03 is adopted in the
  registry, but FHOPS PR #383 was still open at publication, so the card says
  "open PR" rather than implying a merged result.
- Added the public data boundary: the TFL 6 fixture retains OGL-BC attribution
  and its FHOPS provenance record; machine rates, work volumes, productivity,
  landing capacity, and the road job remain synthetic; no raw raster, private
  path, credential, or operational recommendation is shipped.
- Added site contract tests (154 total) covering heading structure, unique IDs,
  local and remote links, eight cards with evidence and boundaries, fixture
  geometry, climate-table consistency, registry counts, the disabled assistant,
  no hardcoded credentials, no private paths, and the public-boundary wording.
- Added the documentation set: demo overview, evidence and status vocabulary,
  assistant backend contract, and development/verification guide.
- Published through the existing `docs.yml` workflow: the demo is the Pages
  root and Sphinx docs are served under `/docs/`.
- Published the public repository at
  https://github.com/UBC-FRESH/fresh-irss-demo and the demo at
  https://ubc-fresh.github.io/fresh-irss-demo/.
- Dashboard result on the P1 head commit: **GREEN**. Lint, format,
  `mypy --strict`, 154 tests with 100% branch coverage of `scripts/`, workflow
  validator, and Sphinx with warnings as errors all passed.
- Opened parent issues #1 (P0), #2 (P1), #3 (P2), #4 (P3), and #5 (P4).
  P0/P1 child issues #6-#15 are closed with their evidence. The live-work
  backlog is tracked in #3-#5.

## 2026-11-04

- P2: added the opt-in same-origin assistant service in `server/assistant.py`, retrieval over the registry and notes, local OpenCode provider calls, citations, request limits, and tests. The static Pages build remains disabled; the local service injects `/api/assistant`.
