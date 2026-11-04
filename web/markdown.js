/* Safe, dependency-free Markdown subset for assistant replies.
 *
 * The assistant returns Markdown, not HTML. This renderer turns a deliberately
 * small subset into escaped HTML: paragraphs, headings, emphasis, inline code,
 * links, lists, blockquotes, fenced code, rules, and simple pipe tables.
 *
 * All text is escaped before markup is added. Link targets are allowlisted to
 * http(s), mailto, same-origin paths, and fragments; unsupported targets render
 * as plain text. Raw HTML in the source is never preserved.
 */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  }

  function safeUrl(raw) {
    var url = String(raw).trim();
    if (/^(https?:\/\/|mailto:)/i.test(url)) {
      return url;
    }
    if (/^\/(?!\/)/.test(url) || /^#/.test(url)) {
      return url;
    }
    return "";
  }

  function linkHtml(label, rawUrl) {
    var url = safeUrl(rawUrl);
    if (!url) {
      return escapeHtml(label);
    }
    return (
      '<a href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(label) +
      "</a>"
    );
  }

  function inline(text) {
    var source = String(text);
    var output = "";
    var position = 0;
    var pattern =
      /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<]+)/g;
    var match;

    while ((match = pattern.exec(source)) !== null) {
      output += escapeHtml(source.slice(position, match.index)).replace(/\n/g, "<br>");

      if (match[1]) {
        output += "<code>" + escapeHtml(match[1].slice(1, -1)) + "</code>";
      } else if (match[2]) {
        output += "<strong>" + inline(match[2].slice(2, -2)) + "</strong>";
      } else if (match[3]) {
        output += "<em>" + inline(match[3].slice(1, -1)) + "</em>";
      } else if (match[4]) {
        var link = match[4];
        var split = link.indexOf("](");
        output += linkHtml(link.slice(1, split), link.slice(split + 2, -1));
      } else if (match[5]) {
        var url = match[5];
        var trailing = "";
        while (/[.,;:!?]$/.test(url)) {
          trailing = url.slice(-1) + trailing;
          url = url.slice(0, -1);
        }
        output += linkHtml(url, url) + escapeHtml(trailing);
      }

      position = pattern.lastIndex;
    }

    output += escapeHtml(source.slice(position)).replace(/\n/g, "<br>");
    return output;
  }

  function splitRow(line) {
    var row = line.trim();
    if (row.charAt(0) === "|") {
      row = row.slice(1);
    }
    if (row.charAt(row.length - 1) === "|") {
      row = row.slice(0, -1);
    }
    return row.split("|").map(function (cell) {
      return cell.trim();
    });
  }

  function isTableStart(lines, index) {
    if (index + 1 >= lines.length || lines[index].indexOf("|") === -1) {
      return false;
    }
    return (
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1]) &&
      splitRow(lines[index]).length > 1
    );
  }

  function startsBlock(line) {
    return (
      /^\s*```/.test(line) ||
      /^\s*#{1,4}\s+/.test(line) ||
      /^\s*[-*+]\s+/.test(line) ||
      /^\s*\d+[.)]\s+/.test(line) ||
      /^\s*>\s?/.test(line) ||
      /^\s*(([-*_])\s*){3,}$/.test(line)
    );
  }

  function renderList(lines, start, ordered) {
    var marker = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
    var items = [];
    var index = start;
    while (index < lines.length) {
      var match = lines[index].match(marker);
      if (match) {
        items.push(match[1]);
        index += 1;
        continue;
      }
      if (
        items.length &&
        lines[index].trim() &&
        /^\s{2,}/.test(lines[index]) &&
        !startsBlock(lines[index])
      ) {
        items[items.length - 1] += " " + lines[index].trim();
        index += 1;
        continue;
      }
      break;
    }
    var tag = ordered ? "ol" : "ul";
    return {
      html:
        "<" +
        tag +
        ">" +
        items
          .map(function (item) {
            return "<li>" + inline(item) + "</li>";
          })
          .join("") +
        "</" +
        tag +
        ">",
      next: index,
    };
  }

  function renderTable(lines, start) {
    var header = splitRow(lines[start]);
    var index = start + 2;
    var rows = [];
    while (index < lines.length && lines[index].trim() && lines[index].indexOf("|") !== -1) {
      rows.push(splitRow(lines[index]));
      index += 1;
    }
    var head =
      "<thead><tr>" +
      header
        .map(function (cell) {
          return "<th scope=\"col\">" + inline(cell) + "</th>";
        })
        .join("") +
      "</tr></thead>";
    var body = rows
      .map(function (row) {
        var cells = header.map(function (_, cellIndex) {
          return "<td>" + inline(row[cellIndex] || "") + "</td>";
        });
        return "<tr>" + cells.join("") + "</tr>";
      })
      .join("");
    return {
      html: '<div class="assistant-table-wrap"><table>' + head + "<tbody>" + body + "</tbody></table></div>",
      next: index,
    };
  }

  function renderMarkdown(markdown) {
    var lines = String(markdown == null ? "" : markdown).replace(/\r\n?/g, "\n").split("\n");
    var output = [];
    var index = 0;

    while (index < lines.length) {
      var line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      var fence = line.match(/^\s*```([\w-]*)\s*$/);
      if (fence) {
        var code = [];
        index += 1;
        while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          index += 1;
        }
        output.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        continue;
      }

      var heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
      if (heading) {
        var level = heading[1].length <= 2 ? "h4" : "h5";
        output.push("<" + level + ">" + inline(heading[2]) + "</" + level + ">");
        index += 1;
        continue;
      }

      if (/^\s*(([-*_])\s*){3,}$/.test(line)) {
        output.push("<hr>");
        index += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        var quote = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^\s*>\s?/, ""));
          index += 1;
        }
        output.push("<blockquote>" + renderMarkdown(quote.join("\n")) + "</blockquote>");
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        var unordered = renderList(lines, index, false);
        output.push(unordered.html);
        index = unordered.next;
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        var ordered = renderList(lines, index, true);
        output.push(ordered.html);
        index = ordered.next;
        continue;
      }

      if (isTableStart(lines, index)) {
        var table = renderTable(lines, index);
        output.push(table.html);
        index = table.next;
        continue;
      }

      var paragraph = [line.trim()];
      index += 1;
      while (
        index < lines.length &&
        lines[index].trim() &&
        !startsBlock(lines[index]) &&
        !isTableStart(lines, index)
      ) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      output.push("<p>" + inline(paragraph.join("\n")) + "</p>");
    }

    return output.join("");
  }

  window.renderAssistantMarkdown = renderMarkdown;
})();
