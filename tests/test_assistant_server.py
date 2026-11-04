"""Tests for the optional same-origin assistant service."""

from __future__ import annotations

import json
import subprocess
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
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


def test_public_urls_point_at_maintained_surfaces() -> None:
    """Citations resolve to this demo's docs or the canonical source repositories."""
    assert EvidenceIndex._public_url("docs/demo.rst") == "/docs/demo.html"
    assert EvidenceIndex._public_url("docs/api/dashboard.rst").startswith("/docs/api/")
    assert (
        EvidenceIndex._public_url("notes/adr/0001-static-assistant-disabled.md")
        == "https://github.com/UBC-FRESH/fresh-irss-demo/blob/main/notes/adr/0001-static-assistant-disabled.md"
    )
    assert (
        EvidenceIndex._public_url("registry/candidates.yaml")
        == "https://github.com/UBC-FRESH/irss-expansion/blob/main/registry/candidates.yaml"
    )
    assert "irss-expansion/docs" not in EvidenceIndex._public_url("docs/demo.rst")


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
    command = " ".join(seen["command"]).lower()
    assert "climate" in command
    assert "--standalone" in command
    assert "--agent irss-guide" in command
    assert "--auto" not in command
    assert "visitor-facing contract" in command
    assert "gregory.paradis@ubc.ca" in command


def test_persona_keeps_contact_and_collaboration_invite() -> None:
    """The app persona carries the public collaboration surface into every prompt."""
    persona = (Path(__file__).resolve().parents[1] / "web" / "assistant" / "AGENTS.md").read_text(
        encoding="utf-8"
    )
    for fragment in (
        "gregory.paradis@ubc.ca",
        "(604) 822-1890",
        "4645",
        "https://fresh.forestry.ubc.ca/",
        "https://forestry.ubc.ca/faculty-profile/gregory-paradis",
        "https://github.com/gparadis",
        "Invite the next conversation",
        "feature request for the",
        "gh issue create --repo UBC-FRESH/irss-expansion",
        "demo-app-agent",
        "Would you like me to include your name",
        "Search existing open issues",
        "clear duplicate",
        "Related issues: #",
    ):
        assert fragment in persona


def test_agent_config_is_read_only(tmp_path: Path) -> None:
    """The app agent can inspect the workspace but cannot modify or execute it."""
    config = json.loads((Path(__file__).resolve().parents[1] / "opencode.json").read_text())
    permissions = config["agents"]["irss-guide"]["permissions"]
    denied = {rule["action"] for rule in permissions if rule["effect"] == "deny"}
    allowed = {rule["action"] for rule in permissions if rule["effect"] == "allow"}
    assert {"edit", "subagent", "execute"} <= denied
    assert {"read", "glob", "grep", "external_directory", "shell"} <= allowed
    shell_rules = [rule for rule in permissions if rule["action"] == "shell"]
    assert any(rule["resource"] == "*" and rule["effect"] == "deny" for rule in shell_rules)
    assert any(rule["resource"] == "rg *" and rule["effect"] == "allow" for rule in shell_rules)
    assert any(
        rule["resource"] == "git status *" and rule["effect"] == "allow" for rule in shell_rules
    )
    assert config["agents"]["irss-guide"]["mode"] == "primary"


def test_evidence_search_prefers_specific_note(tmp_path: Path) -> None:
    """A specific note beats a short README for an exact registry ID."""
    demo = tmp_path / "demo"
    (demo / "notes").mkdir(parents=True)
    (demo / "notes" / "README.md").write_text("CARB-03 appears here once.\n")
    expansion = tmp_path / "irss-expansion"
    (expansion / "notes").mkdir(parents=True)
    (expansion / "notes" / "19-carb03-salvage-decay.md").write_text(
        "CARB-03 salvage decay retention curve.\n" * 4
    )
    registry = tmp_path / "candidates.yaml"
    registry.write_text("candidates: []\n")
    index = EvidenceIndex(root=demo, expansion_root=expansion, registry=registry)
    rows = index.search("CARB-03 salvage decay")
    assert rows
    assert rows[0]["url"].endswith("notes/19-carb03-salvage-decay.md")
    assert "irss-expansion/docs" not in rows[0]["url"]


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
