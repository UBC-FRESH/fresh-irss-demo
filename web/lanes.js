/* Interactive integration explorer for the FRESH x IRSS + Silva21 demo.
 * Data is a snapshot of the public registry and merged target evidence.
 * All rendering uses text nodes and explicit links; no API data is interpolated
 * into HTML.
 */
(function () {
  "use strict";

  var LANES = {
    inventory: {
      title: "LiDAR becomes inventory — with a model card",
      status: "Complete",
      what: "FEMIC applies a pinned ALS model card to a LiDAR bundle and emits an inventory.als table. The published TSA 23 pilot is basal-area-only, with per-row model identity, error, and applicability.",
      metrics: [["2,942,755", "BA rows"], ["14.9%", "TSA BA coverage"], ["8.86 m²/ha", "strict BA RMSE"], ["2.54 m", "strict height RMSE"]],
      code: "femic lidar inventory --bundle <bundle> --model-key ba --instance-root <instance> --features <ba.csv>",
      evidence: [["inventory.als contract", "https://github.com/UBC-FRESH/femic/pull/469"], ["BA-only release", "https://github.com/UBC-FRESH/femic-tsa23-instance/releases"], ["Validation report", "https://github.com/UBC-FRESH/femic/blob/main/notes/reports/inv01-tsa23-bc-validation.md"]],
      boundary: "BA pilot only. Height failed independent validation; volume is research-only. Not an operational inventory."
    },
    climate: {
      title: "A climate contract, not a climate model",
      status: "Complete",
      what: "femic.climate.v1 fixes units, scenario names, variance, and provenance so climate-sensitive methods share one input surface. It does not generate a new projection.",
      metrics: [["1", "shared contract"], ["3", "scenario lanes"], ["0", "new GCMs"]],
      code: "femic climate load --table <climate.csv>",
      evidence: [["Climate contract", "https://github.com/UBC-FRESH/femic/pull/378"], ["First-wave brief", "https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/05-first-wave.md"]],
      boundary: "A contract and adapter only. It does not claim a forecast or a validated climate response."
    },
    disturbance: {
      title: "One event record for fire, insects, drought, and harvest",
      status: "Complete",
      what: "femic.disturbance.v1 gives FEMIC, WS4, and FHOPS a shared event shape. NTEMS fire recovery is attached as a static block status; the failed NSR detector is not presented as an alert system.",
      metrics: [["1,497", "not-recovered blocks"], ["58", "slower-recovery blocks"], ["0.069%", "20-year volume effect"]],
      code: "femic disturbance summary --events <events.json>",
      evidence: [["Disturbance contract", "https://github.com/UBC-FRESH/femic/pull/379"], ["Recovery report", "https://github.com/UBC-FRESH/ws4/pull/499"]],
      boundary: "Recovery is spectral status, not survival. NSR is exploratory and failed its TSA 23 case-control test."
    },
    habitat: {
      title: "Habitat accounts from existing public layers",
      status: "Complete",
      what: "DHI is attached as a static productivity surrogate and reported over surviving blocks. The Coops structure index is implemented, but the current FEMIC bundle does not expose the exact first-return metrics.",
      metrics: [["51,289", "DHI blocks"], ["3", "DHI bands"], ["0", "species models"]],
      code: "ws4 simulate ... --dhi-values dhi_values.csv --dhi-metadata dhi_metadata.json",
      evidence: [["DHI account", "https://github.com/UBC-FRESH/ws4/pull/463"], ["Structure index", "https://github.com/UBC-FRESH/ws4/pull/471"]],
      boundary: "DHI is a coarse productivity surrogate, not species habitat. Structure habitat requires exact ALS metrics."
    },
    carbon: {
      title: "A shared carbon account, not a new carbon model",
      status: "Adopted",
      what: "The FEMIC carbon package, CBM pools, HWP lifecycle, and GCBM bridge are live work shared with WS4. The account boundary and parity are recorded rather than reimplemented here.",
      metrics: [["CBM", "pool engine"], ["HWP", "lifecycle"], ["GCBM", "bridge, not parity"]],
      code: "femic carbon ... / ws4 carbon account",
      evidence: [["FEMIC carbon domain", "https://github.com/UBC-FRESH/femic/pull/394"], ["WS4 carbon account", "https://github.com/UBC-FRESH/ws4/pull/357"]],
      boundary: "Adopted by live carbon phases; this demo does not claim a new carbon model or a common-landscape GCBM comparison."
    },
    operations: {
      title: "Salvage value decays with storage time",
      status: "Open PR",
      what: "FHOPS has a typed salvage.decay.v1 curve and a read-only shelf-life report. The first curve is a US Pacific Northwest mixed-conifer fire-killed reference, not a BC operational curve.",
      metrics: [["1.00", "year 0 retention"], ["0.58", "year 3 retention"], ["0.00", "year 5 retention"]],
      code: "fhops report salvage-shelf-life --scenario ... --storage ...",
      evidence: [["FHOPS decay PR", "https://github.com/UBC-FRESH/fhops/pull/383"], ["CARB-03 note", "https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/19-carb03-salvage-decay.md"]],
      boundary: "First slice only. Species/product curves, roadside storage, grade loss, and WS4 valuation remain open."
    },
    provenance: {
      title: "Every number carries its source",
      status: "Complete",
      what: "WS4 reports write report_provenance.json with input and output hashes, identifiers, warnings, and an explicit uncertainty status. The condition card surfaces the same provenance in the UI.",
      metrics: [["SHA-256", "per report file"], ["v1", "sidecar schema"], ["not_stated", "absent uncertainty"]],
      code: "ws4 report --run <run> --out <dir>",
      evidence: [["Report provenance", "https://github.com/UBC-FRESH/ws4/pull/741"], ["Condition-card UI", "https://github.com/UBC-FRESH/ws4/pull/669"]],
      boundary: "Absent uncertainty is not zero uncertainty. The card is report-only and advisory."
    },
    storyboard: {
      title: "A one-page scenario narrative",
      status: "Complete",
      what: "ws4 storyboard writes a Markdown narrative from an existing run, reusing the account-derived condition card instead of recomputing values.",
      metrics: [["1 page", "Markdown"], ["15", "focused tests"], ["0", "solver changes"]],
      code: "ws4 storyboard --run <run> --out storyboard.md",
      evidence: [["Storyboard PR", "https://github.com/UBC-FRESH/ws4/pull/698"], ["PLAN-07 note", "https://github.com/UBC-FRESH/irss-expansion/blob/main/notes/05-first-wave.md"]],
      boundary: "One-page Markdown only. No charts, maps, or operational plan are claimed."
    }
  };

  function renderLane(id) {
    var data = LANES[id];
    var target = document.getElementById("lane-detail");
    if (!data || !target) { return; }
    target.replaceChildren();
    var head = document.createElement("div");
    head.className = "lane-detail-head";
    var status = document.createElement("span");
    status.className = "status status-complete";
    status.textContent = data.status;
    var title = document.createElement("h3");
    title.textContent = data.title;
    head.append(status, title);
    var what = document.createElement("p");
    what.textContent = data.what;
    var metrics = document.createElement("div");
    metrics.className = "lane-metrics";
    data.metrics.forEach(function (pair) {
      var item = document.createElement("div");
      item.className = "lane-metric";
      var value = document.createElement("strong");
      value.textContent = pair[0];
      var label = document.createElement("span");
      label.textContent = pair[1];
      item.append(value, label);
      metrics.appendChild(item);
    });
    var evidenceTitle = document.createElement("h4");
    evidenceTitle.textContent = "Merged evidence";
    var list = document.createElement("ul");
    list.className = "lane-evidence";
    data.evidence.forEach(function (pair) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = pair[1];
      link.textContent = pair[0];
      link.rel = "noopener noreferrer";
      li.appendChild(link);
      list.appendChild(li);
    });
    var tryTitle = document.createElement("h4");
    tryTitle.textContent = "Try the surface";
    var code = document.createElement("pre");
    code.textContent = data.code;
    var boundary = document.createElement("p");
    boundary.className = "lane-boundary";
    boundary.textContent = "Boundary: " + data.boundary;
    target.append(head, what, metrics, evidenceTitle, list, tryTitle, code, boundary);
  }

  window.initLaneExplorer = function () {
    var buttons = document.querySelectorAll(".lane-list [data-lane]");
    if (!buttons.length) { return; }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (other) {
          other.setAttribute("aria-selected", other === button ? "true" : "false");
        });
        renderLane(button.getAttribute("data-lane"));
      });
    });
    renderLane("inventory");
  };
})();
