Assistant contract
==================

The demo includes the HectaresBC assistant pattern: a floating trigger, a
same-page drawer, a short prompt box, quick prompts, and a status line. In the
static demo it is **disabled**. No model endpoint is configured, so no prompt can
leave the browser.

Why the default is disabled
---------------------------

A public static site has no safe place to hold a provider key and no server-side
allowlist. Enabling a model in the browser would turn a provenance-first
communication artifact into an unaudited data flow. The drawer therefore stays a
shell until an operator supplies a same-origin backend.

Configuration
-------------

``web/config.js`` is the only switch::

    window.FRESH_IRSS_DEMO = {
      assistantEndpoint: null,
    };

To enable a live assistant, run an opt-in backend and set a root-relative path::

    window.FRESH_IRSS_DEMO = {
      assistantEndpoint: "/api/assistant",
    };

The client rejects absolute URLs. It only sends a POST to the configured
same-origin path with credentials set to ``same-origin``.

Local service
-------------

The optional service is started with::

    python server/assistant.py --port 8765

It serves the static demo and injects a same-origin `/config.js`. It retrieves
the top evidence from the sibling `irss-expansion` registry and notes when that
checkout is available, plus this demo's docs and lane data. It invokes the local
`opencode` CLI with the read-only `irss-guide` agent server-side, and returns
`reply` plus `citations`. The agent may read every cloned repository under the
workspace for context and may run read-only search commands such as ``rg``,
``git status``/``log``/``show``, ``ls``, and ``find`` without mutation flags.
Its configuration denies edit, destructive shell, Code Mode, web, and subagent
actions. Set `FRESH_ASSISTANT_MODEL` to choose the provider
model, `FRESH_ASSISTANT_TIMEOUT` to cap a turn, and
`FRESH_ASSISTANT_EXPANSION` or `FRESH_ASSISTANT_REGISTRY` if the evidence
checkout lives elsewhere. The service rejects oversized requests. The public
GitHub Pages site remains disabled because it has no server-side runtime.

Request and response
--------------------

Request body::

    {
      "message": "Which lane is complete?",
      "context": {
        "page": "fresh-irss-demo",
        "section": "static-integration-demo"
      }
    }

Response body::

    {
      "reply": "The climate contract is complete. Evidence: ...",
      "citations": [
        {
          "label": "GRO-01 first-wave brief",
          "url": "https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/05-first-wave.md"
        }
      ]
    }

The client renders ``reply`` (or ``message`` as a fallback) as a small Markdown
subset: paragraphs, headings, emphasis, inline and fenced code, links, lists,
blockquotes, rules, and simple pipe tables. Raw HTML is escaped, and link targets
are limited to http(s), mailto, same-origin paths, and fragments. Citations are
rendered as a separate list below the answer, so a citation is never mistaken
for part of the model prose.

Citation URLs are mapped to maintained sources: ``docs/`` pages are served from
the local Sphinx build at ``/docs/``, demo notes and web evidence point at this
repository, and expansion notes and registry paths point at
``irss-expansion``. The assistant does not cite the retired ``irss-expansion``
GitHub Pages site.

Safety requirements for a live backend
--------------------------------------

1. Opt-in: the feature is off unless the operator enables it.
2. Same-origin: no absolute endpoint, no third-party origin from the client.
3. Server-side credentials: no key in HTML, JavaScript, or ``config.js``.
4. Allowlist: the service accepts only the demo's own routes and methods.
5. Request size caps; per-client rate limiting is not enabled in this trusted
   deployment.
6. Retrieval over the expansion registry and evidence notes when available,
   with citations on every answer.
7. A human review path for wrong or unsupported answers remains future work.
8. A clear disabled/error state when the backend is unavailable; no silent
   fallback to another provider.

Verification
------------

``tests/test_site.py`` asserts that the drawer starts hidden, the close button is
the only enabled control, the disabled note is present, ``assistantEndpoint`` is
``null``, and neither ``web/app.js`` nor ``web/config.js`` contains a key or an
absolute URL.
