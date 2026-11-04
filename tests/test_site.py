"""Contract tests for the static public slice.

These tests read the shipped HTML, CSS, JavaScript, and small fixtures. They do not
start a browser: they protect the evidence links, the public-data boundary, the
assistant's disabled default, and the consistency between the page tables and the
JSON files that back them.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
INDEX = WEB / "index.html"
PRIVATE_PATH_RE = re.compile(
    r"(?:/home/(?![<${])[A-Za-z0-9._-]+/|/Users/(?![<${])[A-Za-z0-9._-]+/|[A-Za-z]:\\Users\\)"
)
REMOTE_HOSTS = {
    "github.com",
    "www2.gov.bc.ca",
    "doi.org",
    "irsslab.forestry.ubc.ca",
    "www.silva21.com",
    "research.fs.usda.gov",
    "hero.epa.gov",
    "task43.ieabioenergy.com",
    "ubc-fresh.github.io",
    "01101.dev",
    "fresh.forestry.ubc.ca",
    "forestry.ubc.ca",
}


@dataclass
class CardInfo:
    """One integration card and the facts the tests need."""

    identifier: str
    chips: int = 0
    text: list[str] = field(default_factory=list)


class _PageParser(HTMLParser):
    """Collect the structural facts the tests assert on."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.headings: list[tuple[str, str]] = []
        self.links: list[str] = []
        self.assets: list[str] = []
        self.cards: list[CardInfo] = []
        self.assistant_controls: list[tuple[str, bool]] = []
        self._open_tags: list[str] = []
        self._card_depth: int | None = None
        self._card: CardInfo | None = None
        self._assistant_depth: int | None = None
        self._heading: tuple[str, list[str]] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = (attributes.get("class") or "").split()
        identifier = attributes.get("id")
        if identifier:
            self.ids.append(identifier)
        if tag in {"h1", "h2", "h3", "h4"}:
            self._heading = (tag, [])
        href = attributes.get("href")
        if tag == "a" and href:
            self.links.append(href)
        if tag in {"link", "script"}:
            target = attributes.get("href") or attributes.get("src")
            if target:
                self.assets.append(target)
        if tag == "article" and "integration-card" in classes:
            self._card_depth = len(self._open_tags)
            self._card = CardInfo(identifier=identifier or "")
        if tag == "a" and "chip" in classes and self._card is not None:
            self._card.chips += 1
        if identifier == "assistant-panel":
            self._assistant_depth = len(self._open_tags)
        if self._assistant_depth is not None and tag in {"button", "textarea", "input"}:
            self.assistant_controls.append((tag, "disabled" in attributes))
        self._open_tags.append(tag)

    def handle_endtag(self, tag: str) -> None:
        if self._heading is not None and tag == self._heading[0]:
            self.headings.append((tag, " ".join(self._heading[1]).strip()))
            self._heading = None
        if self._card_depth is not None and len(self._open_tags) - 1 == self._card_depth:
            if self._card is not None:
                self.cards.append(self._card)
            self._card = None
            self._card_depth = None
        if self._assistant_depth is not None and len(self._open_tags) - 1 == self._assistant_depth:
            self._assistant_depth = None
        if self._open_tags:
            self._open_tags.pop()

    def handle_data(self, data: str) -> None:
        if self._heading is not None:
            self._heading[1].append(data)
        if self._card is not None:
            self._card.text.append(data)


def _parse() -> tuple[str, _PageParser]:
    text = INDEX.read_text(encoding="utf-8")
    parser = _PageParser()
    parser.feed(text)
    return text, parser


def _json(name: str) -> Any:  # JSON fixtures are dynamic; each test asserts the shape it uses.
    """Load a JSON fixture."""
    return json.loads((WEB / "data" / name).read_text(encoding="utf-8"))


def test_page_has_one_h1_and_ordered_sections() -> None:
    _, parser = _parse()
    headings = [tag for tag, _ in parser.headings]
    assert headings.count("h1") == 1
    assert headings.index("h1") == 0
    assert headings.count("h2") >= 5
    assert "h4" not in headings


def test_ids_are_unique_and_links_resolve() -> None:
    text, parser = _parse()
    assert len(parser.ids) == len(set(parser.ids))
    for fragment in re.findall(r'href="#([^"]+)"', text):
        assert fragment in parser.ids
    for link in parser.links:
        if link.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            assert not link.startswith("http://"), link
            if link.startswith("https://"):
                host = urlsplit(link).hostname or ""
                assert host in REMOTE_HOSTS or host.endswith(".01101.dev"), (
                    f"unexpected remote host: {host}"
                )
            continue
        path = urlsplit(link).path
        assert (WEB / path).exists(), f"missing local link target: {path}"


def test_assets_exist_and_are_versioned() -> None:
    _, parser = _parse()
    for asset in parser.assets:
        path = urlsplit(asset).path
        assert (WEB / path).is_file(), asset
        assert "?v=" in asset, f"asset should be cache-busted: {asset}"


def test_eight_integration_cards_have_evidence_and_boundaries() -> None:
    _, parser = _parse()
    assert len(parser.cards) == 8
    expected = {
        "card-inventory",
        "card-climate",
        "card-disturbance",
        "card-habitat",
        "card-carbon",
        "card-operations",
        "card-provenance",
        "card-storyboards",
    }
    assert {card.identifier for card in parser.cards} == expected
    for card in parser.cards:
        text = " ".join(card.text)
        assert card.chips >= 2, card.identifier
        assert "Why it matters:" in text
        assert "Boundary:" in text


def test_lane_evidence_keeps_corrected_claims() -> None:
    """Lane metrics and statuses stay tied to the recorded registry evidence."""
    text = (WEB / "lanes.js").read_text(encoding="utf-8")
    assert "0.069% / 0.093%" in text
    assert "20-year volume effect" not in text
    assert "North Island DHI blocks" in text
    assert "target consumers" in text
    assert 'status: "Adopted"' in text
    assert 'evidenceState: "Open PR · fhops#383"' in text
    assert "Salvage volume retention declines" in text


def test_evidence_lab_sources_match_the_views() -> None:
    """Each evidence-lab view links the report that contains its values."""
    text = (WEB / "lab.js").read_text(encoding="utf-8")
    assert "inv01-tsa23-time-lag.md" in text
    assert "inv01-tsa23-refit-applicability.md" in text
    assert "inv01-tsa23-hybrid-vs-current.md" in text
    assert "value decay" not in text.lower()


def test_statuses_use_the_registry_vocabulary() -> None:
    text = INDEX.read_text(encoding="utf-8")
    for status in ("Complete", "Adopted", "Shortlisted"):
        assert f'class="status status-{status.lower()}">{status}<' in text


def test_public_fixture_is_small_and_complete() -> None:
    data = _json("case-study.geojson")
    features = data["features"]
    assert isinstance(features, list)
    layers = [feature["properties"]["layer"] for feature in features]
    assert layers.count("blocks") == 7
    assert layers.count("roads") == 1
    assert layers.count("landings") == 1
    areas = [
        feature["properties"]["area_ha"]
        for feature in features
        if feature["properties"]["layer"] == "blocks"
    ]
    assert abs(sum(areas) - 100.0) < 0.1
    for feature in features:
        assert feature["geometry"]["type"] == "Polygon"
        for ring in feature["geometry"]["coordinates"]:
            for longitude, latitude in ring:
                assert -128.0 < longitude < -127.0
                assert 50.0 < latitude < 51.0


def test_fixture_metadata_states_the_boundary() -> None:
    meta = _json("case-study.meta.json")
    assert "OGL-BC" in str(meta["bundle"]["licence"])
    assert "EPSG:3005" in str(meta["bundle"]["native_crs"])
    notes = " ".join(str(note) for note in meta["not_claimed"])
    assert "field accuracy" in notes
    assert "operational harvest plan" in notes
    assert "synthetic" in str(meta["source_data"]).lower()


def test_blocks_table_matches_geojson() -> None:
    data = _json("case-study.geojson")
    html = INDEX.read_text(encoding="utf-8")
    blocks = [
        feature["properties"]
        for feature in data["features"]
        if feature["properties"]["layer"] == "blocks"
    ]
    for block in blocks:
        row = f"<tr><td>{block['block_id']}</td><td>{block['area_ha']:.2f}</td><td>Block</td></tr>"
        assert row in html, row


def test_climate_table_matches_fixture() -> None:
    data = _json("climate-sample.json")
    records = data["records"]
    assert len(records) == 4
    assert data["status"] == "Synthetic contract fixture; not observed values."
    html = INDEX.read_text(encoding="utf-8")
    for record in records:
        if record["variable"] == "ppt":
            value = f"{record['value']:,.0f}"
            variance = f"{record['variance']:,.0f}"
        else:
            value = f"{record['value']:,.1f}"
            variance = f"{record['variance']:,.2f}".rstrip("0").rstrip(".")
        unit = " °C" if record["unit"] == "degC" else " mm"
        row = (
            f"<tr><td>{record['year']}</td><td>{record['scenario']}</td>"
            f"<td>{record['variable']}</td><td>{value}{unit}</td><td>{variance}</td></tr>"
        )
        assert row in html, row
        assert "synthetic" in str(record["notes"]).lower()


def test_registry_snapshot_matches_the_registry_counts() -> None:
    snapshot = _json("registry-snapshot.json")
    assert snapshot["counts"] == {
        "candidates": 62,
        "complete": 17,
        "adopted": 2,
        "wave_1": 13,
        "workstreams": 9,
    }
    assert len(snapshot["workstreams"]) == 9


def test_assistant_is_disabled_by_default() -> None:
    text, parser = _parse()
    panel = text.split('id="assistant-panel"', 1)[1].split("</aside>", 1)[0]
    assert "hidden" in panel.split(">", 1)[0]
    assert 'aria-modal="false"' in panel
    assert "Assistant not enabled in this static demo" in panel
    assert panel.count("disabled") >= 6
    assert parser.assistant_controls, "assistant controls were not parsed"
    enabled = [tag for tag, disabled in parser.assistant_controls if not disabled]
    assert enabled == ["button"], "only the close button may stay enabled"
    config = (WEB / "config.js").read_text(encoding="utf-8")
    assert "assistantEndpoint: null" in config


def test_javascript_never_hardcodes_a_key_or_absolute_endpoint() -> None:
    script = (WEB / "app.js").read_text(encoding="utf-8")
    config = (WEB / "config.js").read_text(encoding="utf-8")
    for source in (script, config):
        assert "sk-" not in source
        assert "api_key" not in source.lower()
        assert "https://" not in source
    assert "new URL(" in script
    assert "resolved.origin === window.location.origin" in script


def test_no_private_paths_in_web_assets() -> None:
    suffixes = {".html", ".css", ".js", ".json", ".geojson", ".svg"}
    for path in WEB.rglob("*"):
        if not path.is_file() or path.suffix not in suffixes:
            continue
        text = path.read_text(encoding="utf-8")
        assert not PRIVATE_PATH_RE.search(text), path


def test_page_has_a_collaboration_contact_surface() -> None:
    """The collaboration call to action keeps the public contact details intact."""
    text = INDEX.read_text(encoding="utf-8")
    for fragment in (
        'id="collaborate"',
        "gregory.paradis@ubc.ca",
        "(604) 822-1890",
        "Office 4645",
        "https://fresh.forestry.ubc.ca/",
        "https://forestry.ubc.ca/faculty-profile/gregory-paradis",
        "https://github.com/gparadis",
    ):
        assert fragment in text


def test_page_states_the_public_boundary() -> None:
    text = " ".join(INDEX.read_text(encoding="utf-8").lower().split())
    assert "not an operational tool" in text
    assert "no live data feed" in text
    assert "no operational recommendation" in text
    assert "no field accuracy" in text
    assert "not a harvest plan" in text
    assert "mit-licensed code" in text
    assert "ogl-bc" in text


def test_skip_link_and_language_are_present() -> None:
    text = INDEX.read_text(encoding="utf-8")
    assert '<html lang="en">' in text
    assert 'class="skip-link" href="#main"' in text
    assert 'id="main"' in text
    assert 'name="viewport"' in text


def test_data_files_are_valid_json() -> None:
    for path in (WEB / "data").glob("*.json"):
        assert isinstance(json.loads(path.read_text(encoding="utf-8")), object)
    assert isinstance(
        json.loads((WEB / "data" / "case-study.geojson").read_text(encoding="utf-8")),
        object,
    )
