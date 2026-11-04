# ADR 0001: Keep the assistant disabled in the static demo

Date: 2026-11-04
Status: accepted

## Context

The HectaresBC browser app has an optional assistant panel enabled by a local
FastAPI service. The public IRSS demo is a static GitHub Pages site. It has no
server, no secret store, and no request review path.

## Decision

Ship the assistant as a visible shell and keep it disabled. `web/config.js`
sets `assistantEndpoint: null`. The client accepts only a root-relative,
same-origin endpoint if an operator supplies one.

## Consequences

- The demo shows where a live assistant would sit without creating an
  unaudited model or data flow.
- A live assistant is tracked as P2 and needs a backend, retrieval over the
  registry, citations, rate limits, and a review path.
- The site contract tests enforce the disabled default and reject hardcoded keys
  or absolute endpoints.
