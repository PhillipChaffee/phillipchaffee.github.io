const test = require("node:test");
const assert = require("node:assert/strict");
const { render } = require("./index.js");

const body = (resume, options) => render(resume, options).split("</head>")[1];

test("a job shows its title, employer, dates and technologies", () => {
  const html = body({
    work: [{ position: "Engineer", name: "Acme", startDate: "2025-02", tech: ["Rust", "egui"] }],
  });
  assert.match(html, /<h3>Engineer<\/h3>/);
  assert.match(html, /<b>Acme<\/b> · Feb 2025 – Present/);
  assert.match(html, /Rust · egui/);
});

test("a project that only names its start year is not marked as ongoing", () => {
  const html = body({ projects: [{ name: "n2t", startDate: "2015" }] });
  assert.match(html, /<p class="meta">2015<\/p>/);
  assert.doesNotMatch(html, /Present/);
});

test("a section with no items is left out", () => {
  const html = body({ work: [{ position: "Engineer" }], education: [], skills: [] });
  assert.match(html, /Experience/);
  assert.doesNotMatch(html, /Education|Skills/);
});

test("prose keeps links to the web and shows every other tag as text", () => {
  const html = body({
    work: [
      {
        position: "Engineer",
        highlights: [
          "Wrote an <a href='https://example.com/sdk?a=1&b=2'>SDK</a>.",
          "<script>alert(1)</script> <a href='javascript:alert(1)'>x</a>",
        ],
      },
    ],
  });
  assert.match(html, /<a href="https:\/\/example.com\/sdk\?a=1&#38;b=2">SDK<\/a>/);
  assert.doesNotMatch(html, /<script|href="javascript/);
});

test("contact links show web addresses without their scheme", () => {
  const html = body({
    basics: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      profiles: [{ network: "GitHub", url: "https://www.github.com/ada/" }],
    },
  });
  assert.match(html, /<h1>Ada Lovelace<\/h1>/);
  assert.match(html, /<a href="mailto:ada@example.com">ada@example.com<\/a>/);
  assert.match(html, /<a href="https:\/\/www.github.com\/ada\/">github.com\/ada<\/a>/);
});

test("the site navigation and PDF link appear only when asked for", () => {
  assert.doesNotMatch(body({}), /<nav/);
  const html = body({}, { nav: [{ label: "Home", href: "/" }], pdf: "/resume/r.pdf", note: "draft" });
  assert.match(html, /<a href="\/">Home<\/a>/);
  assert.match(html, /<a class="pdf" href="\/resume\/r.pdf"><span>Download <\/span>PDF<\/a>/);
  assert.match(html, /draft/);
});
