Development and verification
============================

The site is dependency-free static HTML, CSS, and JavaScript. There is no Node
build step. The Python environment exists for the workflow validator, the green
dashboard, the site contract tests, and Sphinx.

Run the site locally
--------------------

::

    python -m http.server 8099 --directory web

Open ``http://127.0.0.1:8099/``. The page needs a static server rather than a
``file://`` URL because it fetches ``data/case-study.geojson``.

Run the checks
--------------

::

    python -m venv .venv
    . .venv/bin/activate
    python -m pip install -r requirements-dev.txt
    python -m ruff check .
    python -m ruff format --check .
    python -m mypy
    python -m pytest
    python scripts/check_workflow.py
    sphinx-build -b html docs _build/html -W
    python scripts/dashboard.py

The dashboard runs the lint, format, type, test, validator, and docs gates and
exits non-zero when any is red. Every commit should leave it green.

GitHub Pages
------------

``.github/workflows/docs.yml`` builds the demo and the docs:

1. Sphinx builds ``docs/`` into ``_build/html/docs`` with warnings as errors.
2. The workflow copies ``web/`` into ``_build/html`` as the Pages root.
3. GitHub Pages serves the repository root at
   ``https://ubc-fresh.github.io/fresh-irss-demo/`` and the docs at
   ``https://ubc-fresh.github.io/fresh-irss-demo/docs/``.

The Pages source must be set to **GitHub Actions**. The workflow uses the
standard ``pages: write`` and ``id-token: write`` permissions.

File map
--------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Path
     - Purpose
   * - ``web/index.html``
     - Landing page, eight cards, map, climate table, assistant drawer
   * - ``web/styles.css``
     - Responsive accessible design; no build step
   * - ``web/app.js``
     - SVG map renderer and assistant shell
   * - ``web/config.js``
     - Assistant endpoint switch; ``null`` by default
   * - ``web/data/``
     - Small public JSON and GeoJSON fixtures
   * - ``tests/test_site.py``
     - Site contract tests
   * - ``scripts/check_workflow.py``
     - Workflow validator
   * - ``scripts/dashboard.py``
     - Green dashboard

Adding a lane
-------------

1. Add the candidate to the source registry first; do not invent a status.
2. Add a card with the status, why-it-matters, boundary, and at least two
   evidence links (a source note and a target-repository record).
3. Add a contract test if the card introduces a new fixture, status, or claim.
4. Update this docs page and ``CHANGE_LOG.md`` in the same change set.

Public safety
-------------

Do not commit private data, credentials, raw transcripts, unpublished documents,
machine-specific paths, or a source raster. Use repository-relative paths and
public fixtures. The validator scans tracked text for personal paths and
secret-shaped strings; the site tests additionally scan the web assets.
