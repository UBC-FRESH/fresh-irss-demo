"use strict";

const assert = require("assert");

global.window = globalThis;
require("../web/markdown.js");

const render = globalThis.renderAssistantMarkdown;

function check(condition, message) {
  assert.ok(condition, message);
}

let html = render("**bold** and *italic* and `code`");
check(html.includes("<strong>bold</strong>"), "bold");
check(html.includes("<em>italic</em>"), "italic");
check(html.includes("<code>code</code>"), "inline code");

html = render("- one\n- two\n\n1. first\n2. second");
check(html.includes("<ul><li>one</li><li>two</li></ul>"), "unordered list");
check(html.includes("<ol><li>first</li><li>second</li></ol>"), "ordered list");

html = render("### Evidence\n\n> quoted **claim**\n\n---");
check(html.includes("<h5>Evidence</h5>"), "heading");
check(html.includes("<blockquote><p>quoted <strong>claim</strong></p></blockquote>"), "blockquote");
check(html.includes("<hr>"), "rule");

html = render("| Lane | Status |\n| --- | --- |\n| Inventory | Complete |");
check(html.includes('<div class="assistant-table-wrap"><table>'), "table wrapper");
check(html.includes("<th scope=\"col\">Lane</th>"), "table header");
check(html.includes("<td>Complete</td>"), "table cell");

html = render("See [the note](https://example.com/report) and https://example.com/a.");
check(html.includes('<a href="https://example.com/report" target="_blank" rel="noopener noreferrer">the note</a>'), "markdown link");
check(html.includes('<a href="https://example.com/a" target="_blank" rel="noopener noreferrer">https://example.com/a</a>.'), "bare link trailing punctuation");

html = render("```\n<script>alert(1)</script>\n```");
check(html.includes("<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>"), "fenced code is escaped");

html = render("<img src=x onerror=alert(1)>");
check(!html.includes("<img"), "raw HTML is not preserved");
check(html.includes("&lt;img src=x onerror=alert(1)&gt;"), "raw HTML is escaped");

html = render("[click](javascript:alert(1))");
check(!html.includes("javascript:"), "javascript URL is rejected");
check(!html.includes("<a "), "unsafe link does not render an anchor");

html = render("[query](https://example.com/?a=1&b=2)");
check(html.includes('href="https://example.com/?a=1&amp;b=2"'), "link attribute is escaped");

html = render("line one\nline two");
check(html.includes("line one<br>line two"), "soft line break");

process.stdout.write("markdown renderer contract: ok\n");
