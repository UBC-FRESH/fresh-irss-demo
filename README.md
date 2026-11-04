# FRESH × IRSS + Silva21 — public integration demo

[![CI](https://github.com/UBC-FRESH/fresh-irss-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/UBC-FRESH/fresh-irss-demo/actions/workflows/ci.yml)
[![Docs](https://github.com/UBC-FRESH/fresh-irss-demo/actions/workflows/docs.yml/badge.svg)](https://github.com/UBC-FRESH/fresh-irss-demo/actions/workflows/docs.yml)

A public, static demonstration of how the IRSS and Silva21 environmental
intelligence record maps into the FRESH forest decision stack. It is a
communication artifact: eight integration lanes, a small public case-study
fixture, an explicit provenance panel, and an assistant drawer shell that is
disabled by default.

**Live demo:** <https://ubc-fresh.github.io/fresh-irss-demo/>

## What this shows

FRESH has strong decision engines and a thin environmental state layer. IRSS and
Silva21 have spent roughly two decades building the missing layer: LiDAR and
enhanced forest inventory, climate, disturbance and recovery, habitat, carbon,
and resilience. The integration task is not to port 493 papers. It is to publish
small contracts and adapters, attach their provenance, and let the existing
engines consume them.

The demo presents eight lanes, each with a status, a boundary, and evidence links:

| Lane | Representative candidates | Status |
| --- | --- | --- |
| Inventory & LiDAR | `INV-01`, `DEC-04`, `INV-06` | Complete (pilot boundary) |
| Climate | `GRO-01` | Complete |
| Disturbance | `DIS-01`, `DIS-04` | Complete |
| Habitat | `BIO-01`, `BIO-02` | Complete |
| Carbon | `CARB-01` | Adopted |
| Operations | `CARB-03`, `OPS-01` | Adopted + shortlisted |
| Provenance | `DEC-03`, `DEC-04`, `DEC-02` | Complete |
| Storyboards | `PLAN-07`, `PLAN-03` | Complete |

The registry is the source of truth:
<https://github.com/UBC-FRESH/irss-expansion/blob/main/registry/candidates.yaml>.

## Public data boundary

The case-study map uses the FHOPS TFL 6 LidarBC public fixture: seven clipped VRI
polygons, one road job, and one landing in a ~100 ha pilot AOI. Only the
LiDAR-derived values and clipped VRI geometry are source data. Machine rates,
work volumes, productivity, landing capacity, and the road job are synthetic
smoke-test values. The fixture is OGL-BC and retains its provenance record:

- <https://github.com/UBC-FRESH/fhops/tree/main/examples/lidar_tfl6>
- <https://github.com/UBC-FRESH/fhops/blob/main/examples/lidar_tfl6/provenance.json>

The climate table on the page is four rows from the public `femic.climate.v1`
contract fixture. It is labelled synthetic and is not an observed climate value.

No raw inventory, private path, credential, source raster, or unpublished
document is shipped.

## Assistant drawer

The drawer follows the HectaresBC pattern (a same-page panel with a short prompt
box and status line). The public static site leaves `assistantEndpoint: null`;
the optional same-origin service injects `/api/assistant` and works locally:

```bash
python server/assistant.py --port 8765
# open http://127.0.0.1:8765/
```

The service uses the local `opencode` CLI and retrieval over `registry/` and
`notes/`; it never puts a provider key in the browser. The static GitHub Pages
deployment stays disabled because it has no backend. See
[`docs/assistant.rst`](docs/assistant.rst).

## Run locally

The site is dependency-free static HTML, CSS, and JavaScript. Serve `web/` with
any static server:

```bash
python -m http.server 8099 --directory web
# open http://127.0.0.1:8099/
```

The Python checks are for the planning surfaces and the site contract:

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m pytest
python scripts/check_workflow.py
sphinx-build -b html docs _build/html -W
python scripts/dashboard.py
```

The browser smoke check is not part of CI. Locally, the page has been exercised
with Chromium at 1440, 768, 375, and 320 px widths, including the map selection,
the disabled drawer, keyboard focus, and reduced-motion mode.

## Repository map

| Path | Purpose |
| --- | --- |
| `web/` | Static demo: landing page, eight cards, map, climate table, assistant shell |
| `web/data/` | Small public JSON/GeoJSON fixtures; no raw data |
| `docs/` | Sphinx documentation and the assistant contract |
| `notes/` | ADRs, reference notes, and phase close-out reports |
| `tests/` | Site contract tests and the workflow self-check |
| `scripts/` | Workflow validator and green dashboard |
| `ROADMAP.md` | P0/P1 public slice and the remaining live work |
| `CHANGE_LOG.md` | Dated narrative, newest last |

## Status

P0 (public demo slice) and P1 (verification and publication) are complete. P2
(live assistant backend), P3 (interactive map and layer service), and P4
(registry-driven build and review) are planned. See [`ROADMAP.md`](ROADMAP.md)
and the GitHub issues.

## Boundaries

- Not an operational tool. No harvest, salvage, or thinning recommendation.
- Not a validation report. Merged contracts are not validated models.
- No live data feed, no near-real-time alert, no species-specific habitat model.
- No claim that the static overlays are current forest condition.
- The assistant is a shell, not a live LLM integration.

## License and attribution

Code is MIT-licensed. The TFL 6 fixture retains OGL-BC attribution and the FHOPS
provenance record. Reuse the fixture only with that attribution and its stated
boundaries. See [`LICENSE`](LICENSE) and [`CITATION.cff`](CITATION.cff).
