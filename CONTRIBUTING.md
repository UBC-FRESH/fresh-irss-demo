# Contributing

This repository is a public communication artifact. Keep changes small, evidence-linked, and
inside the public boundary.

## Before you change anything

1. Read `AGENTS.md`, `ROADMAP.md`, and the latest `CHANGE_LOG.md` entry.
2. Read the registry note or target-repository record behind any claim you touch.
3. Run `python scripts/dashboard.py` before you report the change as done.

## Public boundary

- Do not add private data, credentials, raw inventory records, or machine-specific paths.
- Do not add a live model endpoint or a client-side API key. The assistant stays disabled unless a
  same-origin, opt-in backend is configured.
- Do not turn a static overlay into an operational alert or a harvest recommendation.
- Keep fixture attribution, licence, and boundary notes with the fixture.

## Evidence rule

Every integration card names a public source note and at least one target-repository record.
If you cannot link the evidence, do not make the claim.

## Checks

```bash
python -m ruff check .
python -m ruff format --check .
python -m mypy
python -m pytest
python scripts/check_workflow.py
sphinx-build -b html docs _build/html -W
python scripts/dashboard.py
```
