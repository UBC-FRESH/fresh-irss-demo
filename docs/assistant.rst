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
the top evidence notes from `registry/candidates.yaml` and `notes/`, invokes the
local `opencode` CLI server-side, and returns `reply` plus `citations`. Set
`FRESH_ASSISTANT_MODEL` to choose the provider model and
`FRESH_ASSISTANT_TIMEOUT` to cap a turn. The service is rate-limited per client
and rejects oversized requests. The public GitHub Pages site remains disabled
because it has no server-side runtime.

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

The current client renders ``reply`` (or ``message`` as a fallback). A production
backend should return ``citations`` and the UI should render them; that is P2
work.

Safety requirements for a live backend
--------------------------------------

1. Opt-in: the feature is off unless the operator enables it.
2. Same-origin: no absolute endpoint, no third-party origin from the client.
3. Server-side credentials: no key in HTML, JavaScript, or ``config.js``.
4. Allowlist: the service accepts only the demo's own routes and methods.
5. Rate limits and request size caps.
6. Retrieval over the registry and evidence notes, with a citation on every
   answer.
7. A review path for wrong or unsupported answers.
8. A clear disabled/error state when the backend is unavailable; no silent
   fallback to another provider.

Verification
------------

``tests/test_site.py`` asserts that the drawer starts hidden, the close button is
the only enabled control, the disabled note is present, ``assistantEndpoint`` is
``null``, and neither ``web/app.js`` nor ``web/config.js`` contains a key or an
absolute URL.
