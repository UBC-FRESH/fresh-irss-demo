"""Same-origin assistant service for the FRESH x IRSS demo.

The service is opt-in: it serves the static demo with an injected
``config.js`` endpoint and exposes ``/api/assistant``.  It never puts a provider
credential in the browser.  The provider is the local ``opencode`` CLI, scoped to
this repository and a retrieved evidence context.
"""

from __future__ import annotations

import argparse
import json
import math
import mimetypes
import os
import re
import subprocess
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
REGISTRY = ROOT / "registry" / "candidates.yaml"
NOTE_DIRS = (ROOT / "notes", ROOT / "docs")
MAX_MESSAGE = 4000
MAX_CONTEXT = 6000
RATE_LIMIT = 12
RATE_WINDOW = 60.0
MODEL = os.environ.get("FRESH_ASSISTANT_MODEL", "opencode-go/deepseek-v4.1-flash")
OPENCODE = os.environ.get("FRESH_ASSISTANT_OPENCODE", "opencode")
MODEL_TIMEOUT = float(os.environ.get("FRESH_ASSISTANT_TIMEOUT", "90"))
DOCS_BASE = "https://ubc-fresh.github.io/fresh-irss-demo/docs"
DEMO_REPO = "https://github.com/UBC-FRESH/fresh-irss-demo/blob/main"
REGISTRY_REPO = "https://github.com/UBC-FRESH/irss-expansion/blob/main"


def _tokens(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 2}


class EvidenceIndex:
    """A small keyword index over registry and notes."""

    def __init__(self, root: Path = ROOT) -> None:
        self.root = root
        self.documents: list[tuple[str, str, str]] = []
        self._load()

    def _load(self) -> None:
        for path in sorted(NOTE_DIRS[0].glob("*.md")):
            self._add(path)
        for path in sorted(NOTE_DIRS[1].rglob("*.rst")):
            self._add(path)
        if REGISTRY.is_file():
            self.documents.append(
                (
                    "registry/candidates.yaml",
                    "candidate registry queue",
                    REGISTRY.read_text(encoding="utf-8"),
                )
            )

    def _add(self, path: Path) -> None:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(self.root).as_posix()
        self.documents.append((rel, path.stem.replace("_", " "), text))

    @staticmethod
    def _public_url(rel: str) -> str:
        """Map a local evidence path to its maintained public location."""
        safe_rel = quote(rel, safe="/")
        if rel.startswith("docs/"):
            doc_rel = rel.removeprefix("docs/").removesuffix(".rst")
            return DOCS_BASE + "/" + quote(doc_rel, safe="/") + ".html"
        if rel.startswith("registry/"):
            return REGISTRY_REPO + "/" + safe_rel
        return DEMO_REPO + "/" + safe_rel

    def search(self, query: str, limit: int = 4) -> list[dict[str, str]]:
        """Return the highest-overlap evidence documents with public URLs."""
        wanted = _tokens(query)
        if not wanted:
            return []
        scored: list[tuple[float, str, str, str]] = []
        for rel, title, text in self.documents:
            words = _tokens(text)
            overlap = len(wanted & words)
            if overlap == 0:
                continue
            score = overlap / math.sqrt(max(1, len(words)))
            scored.append((score, rel, title, text[:2600]))
        scored.sort(reverse=True)
        result = []
        for _, rel, title, snippet in scored[:limit]:
            result.append({"label": title, "url": self._public_url(rel), "snippet": snippet})
        return result


INDEX = EvidenceIndex()


def _extract_text(value: object) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(filter(None, (_extract_text(item) for item in value)))
    if isinstance(value, dict):
        for key in ("text", "content", "message", "reply", "part"):
            if key in value:
                text = _extract_text(value[key])
                if text:
                    return text
    return ""


def ask(message: str, context: dict[str, object] | None = None) -> dict[str, object]:
    """Ask the local OpenCode provider with retrieved, citable evidence."""
    cleaned = message.strip()[:MAX_MESSAGE]
    if not cleaned:
        raise ValueError("message is required")
    sources = INDEX.search(cleaned)
    evidence = "\n\n".join(
        f"[{item['label']}]({item['url']})\n{item['snippet']}" for item in sources
    )
    prompt = (
        "You are the FRESH x IRSS + Silva21 demo assistant. Answer only from the "
        "provided public evidence. Do not invent RMSE, coverage, model capability, "
        "or dataset IDs. Explicitly say when the evidence does not support an answer. "
        "Keep the reply under 180 words and cite the source labels used.\n\n"
        f"UI context: {json.dumps(context or {}, ensure_ascii=False)[:MAX_CONTEXT]}\n\n"
        f"Evidence:\n{evidence}\n\nUser: {cleaned}"
    )
    command = [OPENCODE, "run", "--model", MODEL, "--format", "json", "--auto", prompt]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=MODEL_TIMEOUT,
        check=False,
        env={**os.environ, "OPENCODE": "1"},
    )
    raw = completed.stdout.strip()
    reply = ""
    for line in raw.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        reply = _extract_text(event).strip() or reply
    if not reply:
        detail = completed.stderr.strip() or "the assistant returned no text"
        raise RuntimeError(detail[:500])
    return {
        "reply": reply,
        "citations": [{"label": item["label"], "url": item["url"]} for item in sources],
        "model": MODEL,
    }


class AssistantHandler(BaseHTTPRequestHandler):
    """Serve the static demo plus a same-origin assistant API."""

    server_version = "FreshIrssDemo/0.1"

    def _send(self, status: HTTPStatus, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        self._send(status, json.dumps(payload).encode(), "application/json")

    def do_GET(self) -> None:
        """Serve the static demo and assistant status."""
        path = urlparse(self.path).path
        if path.rstrip("/").endswith("/api/assistant"):
            self._json(HTTPStatus.OK, {"available": True, "model": MODEL})
            return
        if path.rstrip("/").endswith("/config.js"):
            body = b'window.FRESH_IRSS_DEMO = {assistantEndpoint: "/api/assistant"};\n'
            self._send(HTTPStatus.OK, body, "text/javascript")
            return
        target = WEB / ("index.html" if path in ("", "/") else path.lstrip("/"))
        if target.is_file() and WEB in target.resolve().parents:
            ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
                ctype += "; charset=utf-8"
            self._send(HTTPStatus.OK, target.read_bytes(), ctype)
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_POST(self) -> None:
        """Answer one same-origin assistant request."""
        if not urlparse(self.path).path.rstrip("/").endswith("/api/assistant"):
            self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length > 20000:
            self._json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "request too large"})
            return
        try:
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("body must be an object")
            message = str(payload.get("message", ""))
            context = payload.get("context")
            if not isinstance(context, dict):
                context = {}
            result = ask(message, context)
        except subprocess.TimeoutExpired:
            self._json(HTTPStatus.GATEWAY_TIMEOUT, {"error": "assistant timed out"})
            return
        except (ValueError, RuntimeError, OSError) as exc:
            self._json(HTTPStatus.BAD_GATEWAY, {"error": str(exc)[:500]})
            return
        self._json(HTTPStatus.OK, result)

    def log_message(self, format: str, *args: object) -> None:
        """Keep the service log quiet except for explicit errors."""
        return


def main() -> None:
    """Run the optional assistant service."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AssistantHandler)
    print(f"FRESH x IRSS demo: http://{args.host}:{args.port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
