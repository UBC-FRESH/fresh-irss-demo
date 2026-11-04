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

## 2026-11-04

- P2 public-surface depth pass: added an interactive eight-lane integration
  explorer that shows status, concrete metrics, merged evidence links, runnable
  surfaces, and boundaries.
- Added an evidence lab over recorded results: published/hybrid/refit inventory
  errors, ground-to-LiDAR lag sensitivity, salvage retention, and default-versus-
  hybrid coverage. Each view renders its values as a table and links the source
  report; the lab selects over evidence and does not run a model.
- Linked the maintained FRESH live UIs behind Cloudflare Access (WS4, FHOPS,
  FVS-BC, HectaresBC, and the Urban Forest Lab) and their public docs, plus the
  public integration register.
- Corrected the refit comparison to the in-domain BA 8.10 / volume 52.06 values
  and replaced the unsourced joint-coverage figure with the recorded BA/volume
  cell counts and 1,839 to 2,913 km² joint-area result.
- Added a per-lane input → contract → consumer flow and corrected the lane status
  badge so the operations lane shows its open-PR state instead of complete.
- Removed the duplicate register card from the FRESH demos section. The register
  is the source of truth in `candidates.yaml`, not a separate hosted demo.
- Rendered assistant replies as a safe Markdown subset in the chat drawer.
  Added the dependency-free renderer, XSS/URL-allowlist contract checks under
  Node, and chat-bubble styles for headings, lists, code, links, quotes, rules,
  and tables. Raw HTML remains escaped text.
- Fixed assistant citations. ``docs/`` sources now point at this demo's
  published Sphinx pages, notes point at the public demo repository, and registry
  paths point at ``irss-expansion``. Removed the retired ``irss-expansion``
  GitHub Pages prefix and added URL-mapping contract tests.
- Dashboard result on the depth-pass head commit: **GREEN**. Lint, format,
  `mypy --strict`, tests with coverage, workflow validator, and Sphinx with
  warnings as errors all passed.
