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
WORKSPACE = ROOT.parent.parent
EXPANSION_ROOT = Path(os.environ.get("FRESH_ASSISTANT_EXPANSION", WORKSPACE / "irss-expansion"))
REGISTRY = Path(
    os.environ.get("FRESH_ASSISTANT_REGISTRY", EXPANSION_ROOT / "registry" / "candidates.yaml")
)
MAX_MESSAGE = 4000
MAX_CONTEXT = 6000
MODEL = os.environ.get("FRESH_ASSISTANT_MODEL", "opencode-go/deepseek-v4.1-flash")
OPENCODE = os.environ.get("FRESH_ASSISTANT_OPENCODE", "opencode")
MODEL_TIMEOUT = float(os.environ.get("FRESH_ASSISTANT_TIMEOUT", "90"))
DOCS_WEB = ROOT / "_build" / "html"
PERSONA_FILE = ROOT / "web" / "assistant" / "AGENTS.md"
DEMO_REPO = "https://github.com/UBC-FRESH/fresh-irss-demo/blob/main"
REGISTRY_REPO = "https://github.com/UBC-FRESH/irss-expansion/blob/main"


STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "what",
    "which",
    "are",
    "was",
    "were",
    "has",
    "have",
    "how",
    "does",
    "not",
    "but",
    "you",
    "your",
    "can",
    "all",
    "any",
    "may",
    "its",
    "into",
    "about",
    "their",
    "they",
    "will",
    "more",
    "than",
    "then",
    "when",
    "where",
    "who",
    "why",
    "use",
    "using",
    "our",
    "out",
    "per",
    "also",
}


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", text.lower())
    tokens = {word for word in words if len(word) > 2 and word not in STOPWORDS}
    tokens.update(word.replace("-", "") for word in list(tokens) if "-" in word)
    return tokens


class EvidenceIndex:
    """A small keyword index over the demo docs and the expansion evidence."""

    def __init__(
        self,
        root: Path = ROOT,
        expansion_root: Path = EXPANSION_ROOT,
        registry: Path = REGISTRY,
    ) -> None:
        self.root = root
        self.expansion_root = expansion_root
        self.registry = registry
        self.documents: list[tuple[str, str, str, str]] = []
        self._load()

    def _load(self) -> None:
        self._add_tree(self.root / "notes", "*.md", "demo", "notes")
        self._add_tree(self.root / "docs", "*.rst", "demo", "docs")
        self._add_tree(self.expansion_root / "notes", "*.md", "expansion", "notes")
        for rel in ("web/lanes.js", "web/lab.js"):
            path = self.root / rel
            if path.is_file():
                self._add_text(
                    rel, path.stem.replace("_", " "), path.read_text(encoding="utf-8"), "demo"
                )
        if self.registry.is_file():
            self._add_text(
                "registry/candidates.yaml",
                "candidate registry queue",
                self.registry.read_text(encoding="utf-8"),
                "expansion",
            )

    def _add_tree(self, root: Path, pattern: str, origin: str, prefix: str) -> None:
        if not root.is_dir():
            return
        for path in sorted(root.rglob(pattern)):
            if path.is_file():
                rel = prefix + "/" + path.relative_to(root).as_posix()
                self._add_text(
                    rel,
                    path.stem.replace("_", " "),
                    path.read_text(encoding="utf-8"),
                    origin,
                )

    def _add_text(self, rel: str, title: str, text: str, origin: str) -> None:
        self.documents.append((rel, title, text, origin))

    @staticmethod
    def _public_url(rel: str, origin: str = "demo") -> str:
        """Map a local evidence path to its maintained public location."""
        safe_rel = quote(rel, safe="/")
        if rel.startswith("docs/"):
            doc_rel = rel.removeprefix("docs/").removesuffix(".rst")
            return "/docs/" + quote(doc_rel, safe="/") + ".html"
        if rel.startswith("registry/") or origin == "expansion":
            return REGISTRY_REPO + "/" + safe_rel
        return DEMO_REPO + "/" + safe_rel

    def search(self, query: str, limit: int = 4) -> list[dict[str, str]]:
        """Return the best BM25-matching evidence documents with public URLs."""
        wanted = _tokens(query)
        if not wanted:
            return []
        tokenized = [(_tokens(text), title.lower()) for _, title, text, _ in self.documents]
        average_length = sum(len(words) for words, _ in tokenized) / max(1, len(tokenized))
        document_frequency = {
            token: sum(1 for words, _ in tokenized if token in words) for token in wanted
        }
        document_count = len(tokenized)
        scored: list[tuple[float, str, str, str, str]] = []
        for (rel, title, text, origin), (words, lower_title) in zip(
            self.documents, tokenized, strict=True
        ):
            if not wanted & words:
                continue
            score = 0.0
            for token in wanted:
                frequency = text.lower().count(token)
                if not frequency:
                    continue
                idf = math.log(
                    1.0
                    + (document_count - document_frequency[token] + 0.5)
                    / (document_frequency[token] + 0.5)
                )
                length_norm = 1.2 * (0.25 + 0.75 * len(words) / max(1.0, average_length))
                score += idf * frequency * 2.2 / (frequency + length_norm)
                if token in lower_title or token in rel.lower():
                    score += idf * 2.0
            if score > 0:
                scored.append((score, rel, title, text[:2600], origin))
        scored.sort(reverse=True)
        result = []
        for _, rel, title, snippet, origin in scored[:limit]:
            result.append(
                {
                    "label": title,
                    "url": self._public_url(rel, origin),
                    "snippet": snippet,
                }
            )
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
    context_payload = dict(context or {})
    raw_history = context_payload.pop("history", [])
    history_lines = []
    if isinstance(raw_history, list):
        for item in raw_history[-8:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            text = item.get("text")
            if role in ("user", "assistant") and isinstance(text, str):
                history_lines.append(f"{role.title()}: {text.strip()[:1200]}")
    history = "\n".join(history_lines)
    sources = INDEX.search(cleaned)
    evidence = "\n\n".join(
        f"[{item['label']}]({item['url']})\n{item['snippet']}" for item in sources
    )
    persona = (
        PERSONA_FILE.read_text(encoding="utf-8").strip()
        if PERSONA_FILE.is_file()
        else "You are the FRESH x IRSS demo guide. Answer clearly from the evidence."
    )
    history_block = f"Conversation so far:\n{history}\n\n" if history else ""
    prompt = (
        f"{persona}\n\n"
        "Follow the visitor contract above. You also have read-only access to every "
        "repository in this workspace. Use the provided excerpts first; read a local "
        "file only when a needed fact is absent. Do not invent RMSE, coverage, model "
        "capability, status, or dataset IDs. Answer directly from the excerpts below; "
        "do not enumerate directories or duplicate checkouts. Keep the reply under "
        "200 words and cite the source labels or repository paths used.\n\n"
        + history_block
        + f"UI context: {json.dumps(context_payload, ensure_ascii=False)[:MAX_CONTEXT]}\n\n"
        f"Evidence:\n{evidence}\n\nUser: {cleaned}"
    )
    command = [
        OPENCODE,
        "run",
        "--standalone",
        "--agent",
        "irss-guide",
        "--model",
        MODEL,
        "--format",
        "json",
        prompt,
    ]
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

    def _send_file(self, target: Path) -> None:
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        self._send(HTTPStatus.OK, target.read_bytes(), ctype)

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
        if path == "/docs" or path.startswith("/docs/"):
            docs_rel = path.removeprefix("/docs/") or "index.html"
            target = DOCS_WEB / docs_rel
            if target.is_file() and DOCS_WEB in target.resolve().parents:
                self._send_file(target)
                return
        target = WEB / ("index.html" if path in ("", "/") else path.lstrip("/"))
        if target.is_file() and WEB in target.resolve().parents:
            self._send_file(target)
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
