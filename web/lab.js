/* Evidence-lab selector for the demo. Numbers are recorded public results. */
(function () {
  "use strict";

  var VIEWS = {
    models: {
      title: "Model comparison",
      labels: ["Current cards", "Hybrid", "Refit"],
      series: [
        { name: "BA RMSE (m²/ha)", values: [9.89, 8.02, 8.10], color: "#276749" },
        { name: "Volume RMSE (m³/ha)", values: [74.74, 62.93, 52.06], color: "#b7791f" }
      ],
      note: "BA and volume use different scales. The hybrid/refit numbers are the independent in-domain results; the current cards have only 10 in-range plots. Lower is better.",
      sourceLabel: "TSA 23 validation report",
      source: "https://github.com/UBC-FRESH/femic/blob/main/notes/reports/inv01-tsa23-bc-validation.md"
    },
    lag: {
      title: "Volume error by ground-to-LiDAR lag",
      labels: ["0-5 y", "6-10 y", "11-20 y", "21-30 y", ">30 y"],
      series: [{ name: "Volume RMSE (m³/ha)", values: [67.02, 53.20, 71.97, 99.06, 116.44], color: "#9b2c2c" }],
      note: "The older plots do not provide a hidden validation set. Error rises sharply after 20 years; this is sensitivity evidence, not current-condition validation.",
      sourceLabel: "Time-lag validation report",
      source: "https://github.com/UBC-FRESH/femic/blob/main/notes/reports/inv01-tsa23-bc-validation.md"
    },
    salvage: {
      title: "Salvage net-volume retention",
      labels: ["0 y", "1 y", "2 y", "3 y", "4 y", "5 y"],
      series: [{ name: "Retention fraction", values: [1.0, 0.99, 0.89, 0.58, 0.22, 0.0], color: "#2c5282" }],
      note: "US Pacific Northwest mixed-conifer fire-killed reference curve. It is not a BC-specific, species-specific, or roadside-storage operational curve.",
      sourceLabel: "FHOPS salvage decay PR",
      source: "https://github.com/UBC-FRESH/fhops/pull/383"
    },
    coverage: {
      title: "Default cards versus the experimental hybrid",
      labels: ["Default cards", "Experimental hybrid"],
      series: [
        { name: "BA cells (millions)", values: [2.94, 7.48], color: "#6b46c1" },
        { name: "Volume cells (millions)", values: [2.94, 4.75], color: "#2f855a" }
      ],
      note: "Joint BA/volume coverage rises from 1,839 km² (14.9% of TSA 23) to 2,913 km² (23.6%). The hybrid is research-only; coverage is not accuracy, and the default remains the published BA-only pilot.",
      sourceLabel: "Hybrid versus current report",
      source: "https://github.com/UBC-FRESH/femic/blob/main/notes/reports/inv01-tsa23-hybrid-vs-current.md"
    }
  };

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function render(viewId) {
    var view = VIEWS[viewId];
    var target = document.getElementById("lab-chart");
    var note = document.getElementById("lab-note");
    if (!view || !target || !note) { return; }
    target.replaceChildren();
    note.textContent = view.note;
    var width = 760;
    var height = 320;
    var margin = { top: 28, right: 24, bottom: 54, left: 58 };
    var plotW = width - margin.left - margin.right;
    var plotH = height - margin.top - margin.bottom;
    var max = 0;
    view.series.forEach(function (series) {
      series.values.forEach(function (value) { max = Math.max(max, value); });
    });
    max = max <= 1 ? 1 : Math.ceil(max / 10) * 10;
    var svg = svgEl("svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": view.title });
    var axis = svgEl("line", {
      x1: margin.left, y1: margin.top + plotH, x2: width - margin.right, y2: margin.top + plotH,
      stroke: "#8a8372", "stroke-width": 1
    });
    svg.appendChild(axis);
    for (var tick = 0; tick <= 4; tick += 1) {
      var value = (max * tick) / 4;
      var y = margin.top + plotH - (value / max) * plotH;
      var line = svgEl("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#ded8c8", "stroke-width": 1 });
      var label = svgEl("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: "#5d574a" });
      label.textContent = value.toFixed(value < 10 ? 1 : 0);
      svg.appendChild(line); svg.appendChild(label);
    }
    var groupW = plotW / view.labels.length;
    var barW = Math.min(46, (groupW - 12) / Math.max(1, view.series.length));
    view.labels.forEach(function (label, index) {
      var center = margin.left + groupW * index + groupW / 2;
      var text = svgEl("text", { x: center, y: height - 22, "text-anchor": "middle", "font-size": 12, fill: "#3f3a2f" });
      text.textContent = label;
      svg.appendChild(text);
      view.series.forEach(function (series, seriesIndex) {
        var value = series.values[index];
        var barH = (value / max) * plotH;
        var x = center - (view.series.length * barW) / 2 + seriesIndex * barW;
        var y = margin.top + plotH - barH;
        var rect = svgEl("rect", { x: x, y: y, width: Math.max(2, barW - 2), height: barH, fill: series.color, rx: 3 });
        var title = svgEl("title", {});
        title.textContent = label + " · " + series.name + ": " + value;
        rect.appendChild(title);
        svg.appendChild(rect);
        var valueText = svgEl("text", { x: x + (barW - 2) / 2, y: y - 4, "text-anchor": "middle", "font-size": 10, fill: "#3f3a2f" });
        valueText.textContent = String(value);
        svg.appendChild(valueText);
      });
    });
    target.appendChild(svg);
    var legend = document.createElement("div");
    legend.className = "lab-legend";
    view.series.forEach(function (series) {
      var item = document.createElement("span");
      var swatch = document.createElement("i");
      swatch.style.background = series.color;
      item.append(swatch, document.createTextNode(series.name));
      legend.appendChild(item);
    });
    target.appendChild(legend);

    var table = document.createElement("table");
    table.className = "lab-table";
    var caption = document.createElement("caption");
    caption.textContent = view.title + " — recorded values";
    table.appendChild(caption);
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    var firstHead = document.createElement("th");
    firstHead.scope = "col";
    firstHead.textContent = "Point";
    headRow.appendChild(firstHead);
    view.series.forEach(function (series) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = series.name;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    view.labels.forEach(function (label, index) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = label;
      tr.appendChild(th);
      view.series.forEach(function (series) {
        var td = document.createElement("td");
        td.textContent = String(series.values[index]);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    target.appendChild(table);

    var source = document.createElement("p");
    source.className = "lab-source";
    source.append(document.createTextNode("Source: "));
    var link = document.createElement("a");
    link.href = view.source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = view.sourceLabel;
    source.appendChild(link);
    target.appendChild(source);
  }

  window.initEvidenceLab = function () {
    var buttons = document.querySelectorAll(".lab-tabs [data-lab]");
    if (!buttons.length) { return; }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (other) {
          other.setAttribute("aria-selected", other === button ? "true" : "false");
        });
        render(button.getAttribute("data-lab"));
      });
    });
    render("models");
  };
})();
