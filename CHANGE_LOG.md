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

- P2: added the opt-in same-origin assistant service in `server/assistant.py`, retrieval over the available expansion registry and notes, local OpenCode provider calls, citations, request size caps, and tests. The static Pages build remains disabled; the local service injects `/api/assistant`.

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
- Constrained the app agent to read-only workspace access. The `irss-guide`
  agent can read every cloned repo and run read-only search commands, but cannot
  edit files, run destructive shell commands, use Code Mode, use the web, or
  launch subagents. Removed `--auto` from the provider invocation.
- Indexed the sibling `irss-expansion` registry and notes, demo notes, docs, and
  lane/lab evidence; replaced the length-normalized overlap score with BM25 and
  added a relevance floor. Citation docs now resolve to the local `/docs/`
  build instead of a stale public deployment.
- Corrected the disturbance horizon, operations evidence state, climate metric
  label, DHI instance context, and evidence-lab source links. Added a
  “direction, not delivered state” qualifier to the before/after table.
- Dashboard result on the depth-pass head commit: **GREEN**. Lint, format,
  `mypy --strict`, tests with coverage, workflow validator, and Sphinx with
  warnings as errors all passed.

## 2026-11-04

- Assistant context pass: the `irss-guide` agent now has read access to every
  cloned repository and a read-only shell search allowlist (`rg`, `git` reads,
  `ls`, `find` without mutation flags). Edit, destructive shell, Code Mode, web,
  and subagent actions are denied. The provider invocation no longer uses
  `--auto`.
- Assistant evidence pass: index the sibling `irss-expansion` registry and notes,
  index nested demo notes and lane/lab evidence, replace the length-normalized
  overlap score with BM25, and serve the current Sphinx build at `/docs/` for
  citation links.
- Accuracy pass: corrected the 5-/10-year disturbance metric, operations status
  and evidence state, climate consumer label, North Island DHI context, and
  evidence-lab source links; qualified the before/after table as programme
  direction rather than delivered state.
- Documentation pass: corrected the P2 roadmap, README, assistant contract, and
  file maps so they do not claim rate limiting or a review path that is not
  implemented.
- Dashboard result on the accuracy-pass head commit: **GREEN**. Lint, format,
  `mypy --strict`, 164 tests, workflow validator, and Sphinx with warnings as
  errors all passed.
- Added a visitor-facing assistant contract at `web/assistant/AGENTS.md`, loaded
  into every assistant prompt. It sets the tone, answer shape, evidence rules,
  navigation cues, and a direct collaboration invitation.
- Added a `#collaborate` section to the demo with Greg's FRESH Lab, UBC faculty
  page, GitHub, email, phone, and office details, plus a strong invitation to
  bring IRSS/Silva21 methods and datasets into FRESH decision tools.
- Added a feature-request flow to the visitor contract. If a topic is absent from the
  registry, the guide offers to draft and submit an `irss-expansion` issue, asks for an
  optional requester name, follows the `ubc-fresh-dev-workflow` issue standard, validates
  the body, and tags the issue `demo-app-agent`.
- The feature-request flow also searches open `irss-expansion` issues. A clear
  duplicate gets a context comment; related but distinct requests get a new
  issue with `Related:` links. The assistant reports the outcome without making
  the visitor manage the duplicate-check housekeeping.
- The feature-request response now surfaces related issues as human connections:
  it can name a requester when that name was voluntarily included and invite the
  visitor to reach out, turning the issue search into a collaboration starting
  point rather than a ticket lookup.
- Added the Basecamp handoff to the feature-request flow. The guide offers an
  invitation to the gep.agent project, asks for the email the visitor wants used,
  adds the person to project 49482084, and posts a short message linking the
  issue and inviting the conversation. The issue remains valid if Basecamp
  fails; the handoff is reported separately.
- Added an opening-move hint to the drawer and the visitor contract: at the start
  of a conversation the guide makes the issue/Basecamp capability visible in one
  short line, without turning the first answer into process instructions.
- Added an animated hourglass and “Thinking through the evidence…” status to the
  assistant drawer while a request is in flight. The indicator is hidden by
  default, announced as a status, and respects reduced-motion preferences.
- Fixed the header at 1024–1200 px widths so the added Collaborate link no
  longer pushes the Ask control outside the viewport.
- Dashboard result on the collaboration-pass head commit: **GREEN** on all six
  gates; 27 site/assistant tests pass.

## 2026-11-04

- Added conversation history to the assistant request. The client sends the recent
  user/assistant turns and the server includes them in the prompt, so a visitor can
  volunteer a name or email in one turn and use it in the next.
- Raised the `irss-guide` step budget to 30 and added a finish-in-the-same-turn rule
  for the issue-plus-Basecamp flow, so the agent reports the issue URL and invite
  status instead of stopping after an intermediate “I’ll check” line.
- End-to-end test through the app agent created issue #40 in `irss-expansion`, added
  the test requester to Basecamp project 49482084, and posted message 10474349728.
  These are test artifacts and should be cleaned up after review.
