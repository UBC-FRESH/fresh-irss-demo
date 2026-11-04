"""Tests for the optional same-origin assistant service."""

from __future__ import annotations

import json
import subprocess
import threading
from http.server import ThreadingHTTPServer
from typing import Any
from urllib.request import Request, urlopen

import pytest
from server.assistant import AssistantHandler, EvidenceIndex, ask


class _Completed:
    def __init__(self, stdout: str, stderr: str = "") -> None:
        self.stdout = stdout
        self.stderr = stderr
        self.returncode = 0


def test_evidence_search_returns_public_sources() -> None:
    """The retrieval index returns citation URLs for matching evidence."""
    index = EvidenceIndex()
    rows = index.search("climate contract")
    assert rows
    assert rows[0]["url"].startswith("https://")
    assert rows[0]["snippet"]


def test_ask_uses_fake_opencode(monkeypatch: pytest.MonkeyPatch) -> None:
    """The provider response is parsed without exposing the prompt to a browser key."""
    seen: dict[str, Any] = {}

    def fake_run(*args: object, **kwargs: object) -> _Completed:
        seen["command"] = args[0]
        return _Completed('{"type":"text","text":"The climate contract is complete."}\n')

    monkeypatch.setattr(subprocess, "run", fake_run)
    result = ask("Which contract is complete?", {"page": "demo"})
    assert result["reply"] == "The climate contract is complete."
    assert result["citations"]
    assert "climate" in " ".join(seen["command"]).lower()


def test_ask_rejects_empty_message() -> None:
    """An empty prompt is rejected before any provider call."""
    with pytest.raises(ValueError, match="message"):
        ask("  ")


def test_service_serves_config_and_api(monkeypatch: pytest.MonkeyPatch) -> None:
    """The service injects the endpoint and serves the static shell."""
    monkeypatch.setattr(
        "server.assistant.ask",
        lambda message, context=None: {"reply": "ok", "citations": []},
    )
    server = ThreadingHTTPServer(("127.0.0.1", 0), AssistantHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f"http://127.0.0.1:{server.server_port}"
        with urlopen(base + "/config.js") as response:
            assert b"/api/assistant" in response.read()
        with urlopen(base + "/") as response:
            assert b"FRESH" in response.read()
        request = Request(
            base + "/api/assistant",
            data=json.dumps({"message": "hello", "context": {"page": "demo"}}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request) as response:
            body = json.loads(response.read())
        assert body["reply"] == "ok"
    finally:
        server.shutdown()
        server.server_close()
