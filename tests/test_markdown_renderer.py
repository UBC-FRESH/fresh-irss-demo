"""Contract test for the browser Markdown renderer.

The renderer lives in JavaScript because it runs in the assistant drawer. This
test executes the same Node harness used during development so the Python
quality gate cannot drift away from the browser implementation.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def test_assistant_markdown_renderer_contract() -> None:
    """Run the renderer assertions against the shipped JavaScript."""
    node = shutil.which("node")
    assert node is not None, "Node.js is required to test the browser Markdown renderer"

    root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [node, str(root / "tests" / "markdown_check.js")],
        cwd=root,
        capture_output=True,
        check=False,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "markdown renderer contract: ok" in result.stdout
