# FRESH IRSS Demo Roadmap

This roadmap is the plan of record and the issue tracker map for the public
FRESH × IRSS + Silva21 demo. Keep it in step with the GitHub issues,
`CHANGE_LOG.md`, and `notes/`. `scripts/check_workflow.py` parses the phase
headers, status lines, and checkboxes below, so keep their format.

Every phase starts as `planned` with `Parent issue: TBD`. Activate a phase only
after its parent issue exists and the maintainer approves it. P0 and P1 are the
first public slice; P2-P4 are the live-work backlog.

## Issue Tracker Map

| Phase | Parent issue | Branch | Status |
| --- | --- | --- | --- |
| P0 Public demo slice | TBD | `feature/p0-public-slice` | planned |
| P1 Verification and publication | TBD | `feature/p1-verification` | planned |
| P2 Live assistant backend | TBD | `feature/p2-assistant` | planned |
| P3 Interactive map | TBD | `feature/p3-map` | planned |
| P4 Registry-driven build | TBD | `feature/p4-registry` | planned |

## Lifecycle Map

| Stage | Phases | Exit criteria |
| --- | --- | --- |
| Public slice | P0 | The landing page, eight cards, public fixture, assistant shell, and provenance panel are complete and readable without a backend |
| Verify and publish | P1 | Tests, validator, docs, and Pages are green; the issue tree records the remaining live work |
| Live assistant | P2 | An opt-in, same-origin service answers from the registry with citations; the default remains disabled |
| Interactive map | P3 | A permissioned layer service replaces the fixture; overlays keep their provenance and alert boundary |
| Sustain | P4 | Cards and counts generate from the registry; status drift is caught by a test; a named reviewer signs each release |

## Conventions

- A phase is `P<n>`. A task is `P<n>.<m>`. A subtask is a checklist item inside the task's issue body. Three levels at most.
- Status values are `planned`, `active`, `pr-open`, `complete`, and `deferred`.
- A phase becomes `complete` only after its pull request merges to `main` and its parent issue closes.

## Phase 0: Public demo slice

Parent issue: TBD
Branch: `feature/p0-public-slice`
Status: planned

Goal: publish a polished, static, evidence-backed explanation of eight IRSS/Silva21 integration lanes, with a small public case study and an explicit boundary.

- [x] P0.1 Write the landing narrative and the evidence model
- [x] P0.2 Build eight integration cards with status, why-it-matters, and boundary text
- [x] P0.3 Add the static TFL 6 map, fixture table, and synthetic climate sample
- [x] P0.4 Build the disabled assistant drawer shell
- [x] P0.5 Add the provenance and limitations panel
- [x] P0.6 Make the page responsive and accessible

Acceptance criteria:

- The page states what was integrated, why it matters, and what is not claimed.
- Every card links to a public note and at least one target-repository record.
- No raw data, private path, credential, operational claim, or live endpoint is shipped.
- The page is usable from 320 px upward, with keyboard focus and reduced-motion support.

## Phase 1: Verification and publication

Parent issue: TBD
Branch: `feature/p1-verification`
Status: planned

Goal: make the public slice reproducible, documented, and live on GitHub Pages.

- [x] P1.1 Add site contract tests for structure, evidence links, fixtures, and the disabled assistant
- [x] P1.2 Write the documentation set and the assistant backend contract
- [x] P1.3 Publish the static site and docs to GitHub Pages
- [x] P1.4 Record the P0/P1 roadmap and the live-work issue tree

Acceptance criteria:

- `python scripts/dashboard.py` is green on the published commit.
- The Pages workflow publishes the demo at the repository root and Sphinx docs under `/docs/`.
- A clean clone can run the checks without private data or credentials.
- The remaining live assistant, map, and registry work is tracked as issues.

## Phase 2: Live assistant backend

Parent issue: TBD
Branch: `feature/p2-assistant`
Status: planned

Goal: add an opt-in, same-origin assistant that answers from the public registry and evidence notes, while keeping the static default disabled.

- [ ] P2.1 Define the assistant request, response, and citation contract
- [ ] P2.2 Add a same-origin service with server-side credentials and an allowlist
- [ ] P2.3 Add retrieval over the registry and evidence notes
- [ ] P2.4 Add rate limits, a review path, and a disabled-by-default test

Acceptance criteria:

- The client never holds a provider key or calls an absolute endpoint.
- Every answer cites a registry note, merged change, or public fixture.
- The feature is off unless the operator explicitly enables it.
- A failed or unavailable backend returns a clear disabled/error state, not a silent fallback.

## Phase 3: Interactive map

Parent issue: TBD
Branch: `feature/p3-map`
Status: planned

Goal: replace the single public fixture with a permissioned layer service and real public overlays, without turning a static overlay into an alert.

- [ ] P3.1 Replace the fixture with a permissioned layer service
- [ ] P3.2 Add DHI, recovery, and inventory layers with per-layer provenance
- [ ] P3.3 Add an explicit "static overlay is not an alert" state
- [ ] P3.4 Add a browser smoke test at desktop, tablet, and mobile widths

Acceptance criteria:

- Every layer names its source, version, licence, and date.
- The map distinguishes current condition from a static overlay.
- Missing layers fail visibly and do not imply full coverage.
- The map remains usable with a keyboard and without animation.

## Phase 4: Registry-driven build

Parent issue: TBD
Branch: `feature/p4-registry`
Status: planned

Goal: generate the integration cards and counts from the registry so status and evidence cannot drift.

- [ ] P4.1 Generate cards and counts from `candidates.yaml`
- [ ] P4.2 Add a dated evidence page per card
- [ ] P4.3 Add link checking and a status-drift test
- [ ] P4.4 Add a named reviewer and a release checklist

Acceptance criteria:

- The page cannot claim a status the registry does not record.
- Every card links to an acceptance test, not only a merge commit.
- A broken evidence link fails CI.
- A named reviewer signs the published snapshot.

## Detailed Next Steps Notes

1. Create the P0 and P1 parent issues from `.github/ISSUE_TEMPLATE/phase.md`, then set their numbers here and in the tracker map.
2. Create the P2-P4 parent issues and record the live-work backlog.
3. Enable GitHub Pages with the GitHub Actions source.
4. Verify the published URL and record the dashboard result in `CHANGE_LOG.md`.
