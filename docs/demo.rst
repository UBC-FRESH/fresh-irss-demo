The public demo
===============

The landing page is organized around a single finding: FRESH has strong decision
engines and a thin environmental state layer. IRSS and Silva21 supply the
missing layer, but the integration task is to publish small contracts and
adapters, attach provenance, and let the existing engines consume them. It is
not a race to port papers.

The eight lanes
---------------

.. list-table::
   :header-rows: 1
   :widths: 18 18 12 52

   * - Lane
     - Representative candidates
     - Status
     - What the demo shows
   * - Inventory & LiDAR
     - ``INV-01``, ``DEC-04``, ``INV-06``
     - Complete
     - A basal-area-only ALS pilot with model identity and error; EFI model cards;
       structurally guided sampling. Height failed validation and volume remains
       research-only.
   * - Climate
     - ``GRO-01``
     - Complete
     - ``femic.climate.v1`` fixes units, scenarios, variance, and provenance.
       It is a contract, not a climate model.
   * - Disturbance
     - ``DIS-01``, ``DIS-04``
     - Complete
     - One event record for fire, insect, drought, wind, partial mortality, and
       harvest; a post-fire recovery layer. Not a near-real-time alert.
   * - Habitat
     - ``BIO-01``, ``BIO-02``
     - Complete
     - Dynamic Habitat Indices as a static productivity surrogate, plus the exact
       Coops et al. (2016) structure index with coverage diagnostics and a DHI
       comparison.
   * - Carbon
     - ``CARB-01``
     - Adopted
     - A shared carbon account across ws3, ws4, and FEMIC, with declared
       conversion factors and boundary choices.
   * - Operations
     - ``CARB-03``, ``OPS-01``
     - Adopted + shortlisted
     - An open FHOPS pull request adds a bounded ``salvage.decay.v1`` slice and
       shelf-life report; commercial thinning prioritisation is shortlisted.
   * - Provenance
     - ``DEC-03``, ``DEC-04``, ``DEC-02``
     - Complete
     - A report sidecar with hashes, source metadata, run identity, and an explicit
       ``not_stated`` uncertainty status; EFI model cards; advisory condition cards.
   * - Storyboards
     - ``PLAN-07``, ``PLAN-03``
     - Complete
     - A one-page Markdown storyboard plus connectivity, age-class diversity, and
       fragmentation accounts.

Status vocabulary
-----------------

``complete`` means the registry records merged evidence for the candidate.
``adopted`` means live work already owns the integration and a parallel issue
should not be opened. ``shortlisted`` and ``candidate`` are queue states, not
approvals. ``deferred`` and ``rejected`` are recorded decisions with revisit or
stop conditions.

The page shows only the lanes that have enough public evidence to explain. The
registry remains the source of truth for all 62 candidates.

The case-study map
------------------

The map uses the FHOPS TFL 6 LidarBC public fixture. It is a 9 KB GeoJSON copy
in ``web/data/case-study.geojson``, reprojected from EPSG:3005 to EPSG:4326 for
browser display and rounded to six decimal places. It is not simplified.

- Only the LiDAR-derived values and clipped VRI geometry are source data.
- Machine rates, work volume (20 m³/ha), productivity (500 m³/day), landing
  capacity, and the road job are synthetic smoke-test values.
- The fixture is licensed OGL-BC and retains the FHOPS provenance record.
- No source raster, raw inventory record, private path, or credential is shipped.

The page deliberately does not claim field accuracy, a calibrated cost, a
production rate, or an operational harvest plan.

The climate sample
------------------

The four rows on the page come from
``femic/tests/fixtures/contracts/climate_v1_sample.csv``. Every row carries the
``synthetic-ensemble`` label and a note that it is not an observed value. The
table is a contract illustration, not a climate projection.

What is not on the page
-----------------------

- A live LLM or a live model endpoint.
- A live tile service or a current-condition layer.
- A species-specific habitat model or a near-real-time alert.
- A harvest, salvage, or thinning recommendation.
- A validation report for a merged contract.
