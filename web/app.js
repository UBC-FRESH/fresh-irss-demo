/* FRESH × IRSS + Silva21 — static demo interactions.
 *
 * Two independent surfaces:
 *   1. A dependency-free SVG renderer for the small public TFL 6 GeoJSON fixture.
 *   2. The HectaresBC-style assistant drawer shell. It stays disabled unless a
 *      same-origin assistant endpoint is explicitly configured in config.js.
 */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MAP_WIDTH = 1000;
  var MAP_HEIGHT = 680;
  var MAP_PADDING = 46;
  var BASE_VIEWBOX = [0, 0, MAP_WIDTH, MAP_HEIGHT];

  function svgEl(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function formatNumber(value, digits) {
    return Number(value).toLocaleString("en-CA", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  /* --------------------------------------------------------------- map ---- */

  function initMap() {
    var svg = document.getElementById("map");
    if (!svg) {
      return;
    }
    var status = document.getElementById("map-status");
    var detail = document.getElementById("map-detail");
    var layers = {
      blocks: document.getElementById("map-layer-blocks"),
      roads: document.getElementById("map-layer-roads"),
      landings: document.getElementById("map-layer-landings"),
    };
    var labels = document.getElementById("map-labels");
    var scaleGroup = document.getElementById("map-scale");
    var viewBox = BASE_VIEWBOX.slice();
    var projection = null;
    var selected = null;

    function setStatus(text, isError) {
      if (!status) {
        return;
      }
      status.textContent = text;
      status.classList.toggle("is-error", Boolean(isError));
    }

    function setDetail(kicker, title, body) {
      if (!detail) {
        return;
      }
      detail.innerHTML = "";
      var k = document.createElement("span");
      k.className = "map-detail-kicker";
      k.textContent = kicker;
      var t = document.createElement("strong");
      t.textContent = title;
      var b = document.createElement("span");
      b.textContent = body;
      detail.appendChild(k);
      detail.appendChild(t);
      detail.appendChild(b);
    }

    function project(coordinates) {
      return projection(coordinates);
    }

    function ringPath(ring, close) {
      var path = ring
        .map(function (point, index) {
          var xy = project(point);
          return (index === 0 ? "M" : "L") + xy[0].toFixed(2) + " " + xy[1].toFixed(2);
        })
        .join(" ");
      return close ? path + " Z" : path;
    }

    function geometryPath(geometry) {
      if (geometry.type === "Polygon") {
        return geometry.coordinates.map(function (ring) {
          return ringPath(ring, true);
        }).join(" ");
      }
      return "";
    }

    function centroid(ring) {
      var x = 0;
      var y = 0;
      ring.forEach(function (point) {
        var xy = project(point);
        x += xy[0];
        y += xy[1];
      });
      return [x / ring.length, y / ring.length];
    }

    function selectBlock(node, feature) {
      if (selected) {
        selected.classList.remove("is-active");
      }
      selected = node;
      node.classList.add("is-active");
      var props = feature.properties;
      setDetail(
        "VRI block",
        props.block_id,
        formatNumber(props.area_ha, 2) +
          " ha · public clipped VRI geometry. Operational values are synthetic."
      );
    }

    function drawScale() {
      if (!scaleGroup || !projection) {
        return;
      }
      scaleGroup.innerHTML = "";
      var metresPerDegree = 111132;
      var pixelsPerMetre = projection.scale / metresPerDegree;
      var barMetres = 250;
      var barLength = barMetres * pixelsPerMetre;
      var x = viewBox[0] + 22;
      var y = viewBox[1] + viewBox[3] - 26;
      var line = svgEl("line", { x1: x, y1: y, x2: x + barLength, y2: y });
      var tickA = svgEl("line", { x1: x, y1: y - 5, x2: x, y2: y + 5 });
      var tickB = svgEl("line", { x1: x + barLength, y1: y - 5, x2: x + barLength, y2: y + 5 });
      var text = svgEl("text", { x: x, y: y - 10 });
      text.textContent = barMetres + " m";
      scaleGroup.appendChild(line);
      scaleGroup.appendChild(tickA);
      scaleGroup.appendChild(tickB);
      scaleGroup.appendChild(text);
    }

    function applyViewBox() {
      svg.setAttribute("viewBox", viewBox.join(" "));
      drawScale();
    }

    function zoom(factor) {
      var centreX = viewBox[0] + viewBox[2] / 2;
      var centreY = viewBox[1] + viewBox[3] / 2;
      var nextWidth = Math.max(MAP_WIDTH * 0.28, Math.min(MAP_WIDTH * 1.25, viewBox[2] * factor));
      var nextHeight = nextWidth * (MAP_HEIGHT / MAP_WIDTH);
      viewBox = [
        centreX - nextWidth / 2,
        centreY - nextHeight / 2,
        nextWidth,
        nextHeight,
      ];
      applyViewBox();
    }

    function render(data) {
      if (labels) {
        labels.innerHTML = "";
      }
      Object.keys(layers).forEach(function (key) {
        if (layers[key]) {
          layers[key].innerHTML = "";
        }
      });

      var points = [];
      data.features.forEach(function (feature) {
        if (feature.geometry.type !== "Polygon") {
          return;
        }
        feature.geometry.coordinates.forEach(function (ring) {
          ring.forEach(function (point) {
            points.push(point);
          });
        });
      });
      if (!points.length) {
        setStatus("The fixture has no polygon geometry.", true);
        return;
      }

      var lons = points.map(function (point) {
        return point[0];
      });
      var lats = points.map(function (point) {
        return point[1];
      });
      var minLon = Math.min.apply(null, lons);
      var maxLon = Math.max.apply(null, lons);
      var minLat = Math.min.apply(null, lats);
      var maxLat = Math.max.apply(null, lats);
      var midLat = (minLat + maxLat) / 2;
      var lonFactor = Math.cos((midLat * Math.PI) / 180);
      var spanX = Math.max((maxLon - minLon) * lonFactor, 1e-9);
      var spanY = Math.max(maxLat - minLat, 1e-9);
      var fit = Math.min(
        (MAP_WIDTH - MAP_PADDING * 2) / spanX,
        (MAP_HEIGHT - MAP_PADDING * 2) / spanY
      );
      var offsetX = (MAP_WIDTH - spanX * fit) / 2;
      var offsetY = (MAP_HEIGHT - spanY * fit) / 2;

      projection = function (point) {
        return [
          offsetX + (point[0] - minLon) * lonFactor * fit,
          offsetY + (maxLat - point[1]) * fit,
        ];
      };
      projection.scale = fit;

      var featureCount = 0;
      var blockIndex = 0;
      var blockTones = ["#4f8f6a", "#5f9d78", "#3f7f5c", "#6aa585", "#467f63", "#7aae90", "#57916f"];
      data.features.forEach(function (feature) {
        var layerName = feature.properties.layer;
        var target = layers[layerName];
        if (!target) {
          return;
        }
        featureCount += 1;
        var tone =
          layerName === "blocks" ? blockTones[blockIndex % blockTones.length] : null;
        if (layerName === "blocks") {
          blockIndex += 1;
        }
        var node = svgEl("path", {
          d: geometryPath(feature.geometry),
          class: "feature " + layerName.slice(0, -1),
          tabindex: layerName === "blocks" ? "0" : "-1",
          role: layerName === "blocks" ? "button" : "presentation",
          "aria-label":
            layerName === "blocks"
              ? "Block " +
                feature.properties.block_id +
                ", " +
                formatNumber(feature.properties.area_ha, 2) +
                " hectares"
              : layerName.slice(0, -1),
        });
        if (tone) {
          node.style.setProperty("--block-fill", tone);
        }
        if (layerName === "blocks") {
          node.addEventListener("click", function () {
            selectBlock(node, feature);
          });
          node.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectBlock(node, feature);
            }
          });
        }
        target.appendChild(node);

        if (labels && layerName === "blocks" && feature.properties.area_ha >= 20) {
          var point = centroid(feature.geometry.coordinates[0]);
          var text = svgEl("text", {
            x: point[0],
            y: point[1],
            "text-anchor": "middle",
          });
          text.textContent = feature.properties.block_id.replace("T6_", "");
          labels.appendChild(text);
        }
      });

      applyViewBox();
      setStatus(
        "Public fixture · " +
          featureCount +
          " features · " +
          formatNumber(data.features.filter(function (f) {
            return f.properties.layer === "blocks";
          }).length, 0) +
          " blocks"
      );
    }

    function loadFixture() {
      return fetch("data/case-study.geojson", { credentials: "omit" }).then(function (response) {
        if (response.ok) {
          return response;
        }
        return fetch("/data/case-study.geojson", { credentials: "omit" }).then(function (absolute) {
          if (!absolute.ok) {
            throw new Error("HTTP " + absolute.status);
          }
          return absolute;
        });
      });
    }

    loadFixture()
      .then(function (response) {
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        if (window.FRESH_IRSS_CASE_STUDY) {
          render(window.FRESH_IRSS_CASE_STUDY);
          return;
        }
        setStatus(
          "Map fixture unavailable (" + error.message + "). The fixture table below is still valid.",
          true
        );
      });

    document.querySelectorAll("[data-layer]").forEach(function (input) {
      if (input.tagName !== "INPUT") {
        return;
      }
      input.addEventListener("change", function () {
        var group = layers[input.getAttribute("data-layer")];
        if (group) {
          group.style.display = input.checked ? "" : "none";
        }
        if (labels && input.getAttribute("data-layer") === "blocks") {
          labels.style.display = input.checked ? "" : "none";
        }
      });
    });

    var zoomIn = document.getElementById("zoom-in");
    var zoomOut = document.getElementById("zoom-out");
    var zoomReset = document.getElementById("zoom-reset");
    if (zoomIn) {
      zoomIn.addEventListener("click", function () {
        zoom(0.8);
      });
    }
    if (zoomOut) {
      zoomOut.addEventListener("click", function () {
        zoom(1.25);
      });
    }
    if (zoomReset) {
      zoomReset.addEventListener("click", function () {
        viewBox = BASE_VIEWBOX.slice();
        applyViewBox();
      });
    }
  }

  /* --------------------------------------------------------- assistant ---- */

  function initAssistant() {
    var config = window.FRESH_IRSS_DEMO || {};
    var endpoint =
      typeof config.assistantEndpoint === "string" && config.assistantEndpoint.indexOf("/") === 0
        ? config.assistantEndpoint
        : null;
    var panel = document.getElementById("assistant-panel");
    if (!panel) {
      return;
    }
    var backdrop = document.getElementById("assistant-backdrop");
    var openButton = document.getElementById("assistant-button");
    var openInline = document.getElementById("assistant-open-inline");
    var closeButton = document.getElementById("assistant-close");
    var form = document.getElementById("assistant-form");
    var input = document.getElementById("assistant-input");
    var send = document.getElementById("assistant-send");
    var log = document.getElementById("assistant-log");
    var status = document.getElementById("assistant-status");
    var model = document.getElementById("assistant-model");
    var disabledNote = document.getElementById("assistant-disabled-note");
    var clearButton = document.getElementById("assistant-clear");
    var lastTrigger = null;
    var busy = false;

    function setStatus(text, isError) {
      if (!status) {
        return;
      }
      status.textContent = text;
      status.style.color = isError ? "#8f1d1d" : "";
    }

    function appendMessage(role, text) {
      if (!log) {
        return;
      }
      var message = document.createElement(role === "agent" ? "div" : "p");
      message.className = "assistant-msg " + role;
      if (role === "agent" && typeof window.renderAssistantMarkdown === "function") {
        message.innerHTML = window.renderAssistantMarkdown(text);
      } else {
        message.textContent = text;
      }
      log.appendChild(message);
      log.scrollTop = log.scrollHeight;
    }

    function appendCitations(citations) {
      if (!log || !Array.isArray(citations) || !citations.length) {
        return;
      }
      var list = document.createElement("ul");
      list.className = "assistant-citations";
      citations.forEach(function (citation) {
        if (!citation || typeof citation.url !== "string" || !citation.url) {
          return;
        }
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.href = citation.url;
        link.textContent = typeof citation.label === "string" ? citation.label : citation.url;
        link.rel = "noopener noreferrer";
        item.appendChild(link);
        list.appendChild(item);
      });
      if (list.children.length) {
        log.appendChild(list);
        log.scrollTop = log.scrollHeight;
      }
    }

    function enable() {
      if (!endpoint) {
        return;
      }
      if (model) {
        model.textContent = "local endpoint · same origin";
      }
      if (disabledNote) {
        disabledNote.hidden = true;
      }
      if (input) {
        input.disabled = false;
        input.placeholder = "Ask about an integration or the public fixture…";
      }
      if (send) {
        send.disabled = false;
      }
      if (clearButton) {
        clearButton.disabled = false;
      }
      panel.querySelectorAll(".assistant-quick button").forEach(function (button) {
        button.disabled = false;
        button.addEventListener("click", function () {
          if (input && !busy) {
            input.value = button.textContent;
            form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
          }
        });
      });
      setStatus("Local assistant endpoint detected · requests stay on this origin");
    }

    function setOpen(isOpen, trigger) {
      if (isOpen) {
        lastTrigger = trigger || document.activeElement;
        panel.hidden = false;
        if (backdrop) {
          backdrop.hidden = false;
        }
        document.body.classList.add("assistant-open");
        panel.setAttribute("aria-modal", "true");
        if (openButton) {
          openButton.setAttribute("aria-expanded", "true");
        }
        if (closeButton) {
          closeButton.focus();
        }
      } else {
        panel.hidden = true;
        if (backdrop) {
          backdrop.hidden = true;
        }
        document.body.classList.remove("assistant-open");
        panel.setAttribute("aria-modal", "false");
        if (openButton) {
          openButton.setAttribute("aria-expanded", "false");
        }
        if (lastTrigger && typeof lastTrigger.focus === "function") {
          lastTrigger.focus();
        }
      }
    }

    if (openButton) {
      openButton.addEventListener("click", function () {
        setOpen(true, openButton);
      });
    }
    if (openInline) {
      openInline.addEventListener("click", function () {
        setOpen(true, openInline);
      });
    }
    if (closeButton) {
      closeButton.addEventListener("click", function () {
        setOpen(false);
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }
    document.addEventListener("keydown", function (event) {
      if (panel.hidden) {
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      var focusable = panel.querySelectorAll(
        'button:not([disabled]), textarea:not([disabled]), a[href], input:not([disabled])'
      );
      if (!focusable.length) {
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (clearButton) {
      clearButton.addEventListener("click", function () {
        if (!log || !endpoint) {
          return;
        }
        log.innerHTML =
          '<p class="assistant-hint">Conversation cleared. Requests stay on this origin.</p>';
      });
    }

    if (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          if (form) {
            form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
          }
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!endpoint || busy || !input) {
          return;
        }
        var message = input.value.trim();
        if (!message) {
          return;
        }
        busy = true;
        if (send) {
          send.disabled = true;
        }
        appendMessage("user", message);
        input.value = "";
        setStatus("Waiting for the local assistant…");
        fetch(endpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            context: {
              page: "fresh-irss-demo",
              section: "static-integration-demo",
            },
          }),
        })
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function (payload) {
            var reply =
              typeof payload.reply === "string"
                ? payload.reply
                : typeof payload.message === "string"
                  ? payload.message
                  : "The assistant returned no text.";
            appendMessage("agent", reply);
            appendCitations(payload.citations);
            setStatus("Answered by the local assistant · verify cited evidence before use");
          })
          .catch(function (error) {
            appendMessage(
              "error",
              "The local assistant did not answer (" + error.message + "). No fallback model is configured."
            );
            setStatus("Local assistant request failed", true);
          })
          .finally(function () {
            busy = false;
            if (send) {
              send.disabled = false;
            }
            if (input) {
              input.focus();
            }
          });
      });
    }

    if (endpoint) {
      enable();
    } else {
      panel.setAttribute("aria-modal", "false");
    }
  }

  /* ------------------------------------------------------------ nav spy --- */

  function initNavSpy() {
    if (!("IntersectionObserver" in window)) {
      return;
    }
    var links = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute("href").slice(1));
      })
      .filter(Boolean);
    if (!sections.length) {
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          links.forEach(function (link) {
            var active = link.getAttribute("href") === "#" + entry.target.id;
            if (active) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initMap();
      if (window.initLaneExplorer) { window.initLaneExplorer(); }
      if (window.initEvidenceLab) { window.initEvidenceLab(); }
      initAssistant();
      initNavSpy();
    });
  } else {
    initMap();
    if (window.initLaneExplorer) { window.initLaneExplorer(); }
    if (window.initEvidenceLab) { window.initEvidenceLab(); }
    initAssistant();
    initNavSpy();
  }
})();
