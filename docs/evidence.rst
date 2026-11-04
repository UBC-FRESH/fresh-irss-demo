Evidence and boundaries
=======================

The demo is built from public planning records, not from a new experiment. This
page records the sources, the method, and the limits a reader should carry into
the integration cards.

Primary sources
---------------

- `IRSS × Silva21 expansion mine <https://github.com/UBC-FRESH/irss-expansion>`_:
  the registry, theme map, first-wave briefs, readiness notes, and handoffs.
- `candidates.yaml <https://github.com/UBC-FRESH/irss-expansion/blob/main/registry/candidates.yaml>`_:
  the machine-readable source of truth for candidate status and scope.
- `Executive brief <https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/09-executive-brief.md>`_:
  the finding, recommendation, cost, risks, and decision request.
- `First-wave briefs <https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/05-first-wave.md>`_:
  the contracts and quick wins behind the cards.
- `LidarBC pilot note <https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/12-lidarbc-pilot.md>`_:
  the real tile download and coverage audit.
- `DIS-03 readiness <https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/16-dis03-readiness.md>`_:
  why a static overlay is not an alert.
- `CARB-03 salvage slice <https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/19-carb03-salvage-decay.md>`_:
  what landed and what remains.

Target-repository evidence is linked from each card: FEMIC, ws4, Nemora, and
FHOPS issues and pull requests. A merge commit is evidence that code landed; it
is not evidence of field validation.

Method and its limits
---------------------

The mine reviewed public research pages, project pages, publication metadata,
and abstracts. It was not a full-text systematic review. Readiness is a
judgement about integration cost, not a claim that the underlying science is
settled. Wave assignment and dependencies override the raw screening score.

The page's counts are a 2026-11-03 snapshot: 62 candidates, 9 workstreams, 17
complete, 2 adopted, and 13 in wave 1. Read the registry for live values.

Status vocabulary
-----------------

.. list-table::
   :header-rows: 1
   :widths: 16 84

   * - Status
     - Meaning
   * - ``complete``
     - The registry records merged evidence for the candidate. Check the card's
       boundary before treating the output as validated.
   * - ``adopted``
     - Live work owns the integration; do not open a parallel issue.
   * - ``shortlisted``
     - A plausible next-wave candidate, not an approval.
   * - ``candidate``
     - Screened and queued, not scheduled.
   * - ``deferred``
     - Held with a revisit trigger; a static overlay is not an alert.
   * - ``rejected``
     - Screened out with a recorded reason.

What the page does not claim
----------------------------

- No operational harvest, salvage, or thinning recommendation.
- No field accuracy, calibrated cost, or production rate.
- No species-specific habitat model or near-real-time alert.
- No live climate projection or GCM ensemble selection.
- No claim that a merged contract is a validated model.
- No claim that the TFL 6 fixture represents the whole pilot AOI.

Accessibility and evidence of use
---------------------------------

The page uses semantic landmarks, a skip link, visible focus, keyboard-operable
map features, reduced-motion support, and responsive layouts exercised from
320 px upward. The map's block paths are focusable and respond to Enter and
Space. The assistant drawer traps focus while open and returns focus to its
trigger on close.

The site contract tests in ``tests/test_site.py`` check the heading structure,
unique IDs, local and remote links, card evidence and boundaries, fixture
geometry, table consistency, registry counts, the disabled assistant, the
absence of hardcoded credentials, and the absence of private paths.
