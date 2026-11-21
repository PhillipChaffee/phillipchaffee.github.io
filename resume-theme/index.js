// A JSON Resume theme in the style of MD Viewer's specimen sheet: the Paper
// palette (Dusk in a dark room), Source Serif 4, tracked mono labels and
// hairline bands. render() returns one self-contained HTML document, fonts
// included, so the same file serves the website and prints to PDF.

const fs = require("fs");
const path = require("path");

const read = (file, encoding) => fs.readFileSync(path.join(__dirname, file), encoding);

const FACES = [
  ["Source Serif 4", "normal", "SourceSerif4-Roman.woff2"],
  ["Source Serif 4", "italic", "SourceSerif4-Italic.woff2"],
  ["Source Code Pro", "normal", "SourceCodePro.woff2"],
];

const CSS =
  FACES.map(
    ([family, style, file]) =>
      `@font-face { font-family: "${family}"; font-style: ${style}; font-weight: 200 900; ` +
      `src: url(data:font/woff2;base64,${read(`fonts/${file}`, "base64")}) format("woff2"); }`,
  ).join("\n") +
  "\n" +
  read("style.css", "utf-8");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Resume prose may carry plain links to the web; every other tag is shown as text.
const LINK = /<a\s+href=(['"])(https?:\/\/[^'"<>\s]+)\1\s*>([^<]*)<\/a>/g;

function prose(value) {
  const text = String(value ?? "");
  let html = "";
  let end = 0;
  for (const match of text.matchAll(LINK)) {
    html += escape(text.slice(end, match.index));
    html += `<a href="${escape(match[2])}">${escape(match[3])}</a>`;
    end = match.index + match[0].length;
  }
  return html + escape(text.slice(end));
}

// "2025-02-14" and "2025-02" read as "Feb 2025"; a bare year stays a year.
function date(value) {
  const [, year, month] = /^(\d{4})(?:-(\d{2}))?/.exec(value ?? "") ?? [];
  if (!year) return "";
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

function span(start, end, ongoing) {
  const from = date(start);
  const to = date(end) || (ongoing && from ? "Present" : "");
  return from && to ? `${from} – ${to}` : from || to;
}

const words = (...parts) => parts.filter(Boolean).join(" ");

// Every section of the schema, in page order. A dated section turns each item
// into one entry shape; a list section turns each item into a term and its values.
const SECTIONS = [
  {
    key: "work",
    label: "Experience",
    entry: (w) => ({
      when: span(w.startDate, w.endDate, true),
      where: w.location,
      title: w.position,
      org: w.name,
      url: w.url,
      summary: w.summary,
      highlights: w.highlights,
      tags: w.tech ?? w.keywords,
    }),
  },
  {
    key: "skills",
    label: "Skills",
    term: (s) => ({ name: s.name, note: s.level, values: s.keywords }),
  },
  {
    key: "projects",
    label: "Projects",
    entry: (p) => ({
      when: span(p.startDate, p.endDate),
      title: p.name,
      org: p.entity,
      url: p.url,
      summary: p.description,
      highlights: p.highlights,
      tags: p.keywords,
    }),
  },
  {
    key: "education",
    label: "Education",
    entry: (e) => ({
      when: span(e.startDate, e.endDate),
      title: words(e.studyType, e.area) || e.institution,
      org: words(e.studyType, e.area) ? e.institution : "",
      url: e.url,
      summary: e.score ? `Score: ${e.score}` : "",
      tags: e.courses,
    }),
  },
  {
    key: "volunteer",
    label: "Volunteering",
    entry: (v) => ({
      when: span(v.startDate, v.endDate, true),
      title: v.position,
      org: v.organization,
      url: v.url,
      summary: v.summary,
      highlights: v.highlights,
    }),
  },
  {
    key: "awards",
    label: "Awards",
    entry: (a) => ({ when: date(a.date), title: a.title, org: a.awarder, summary: a.summary }),
  },
  {
    key: "certificates",
    label: "Certificates",
    entry: (c) => ({ when: date(c.date), title: c.name, org: c.issuer, url: c.url }),
  },
  {
    key: "publications",
    label: "Publications",
    entry: (p) => ({
      when: date(p.releaseDate),
      title: p.name,
      org: p.publisher,
      url: p.url,
      summary: p.summary,
    }),
  },
  {
    key: "languages",
    label: "Languages",
    term: (l) => ({ name: l.language, values: [l.fluency] }),
  },
  {
    key: "interests",
    label: "Interests",
    term: (i) => ({ name: i.name, values: i.keywords }),
  },
  {
    key: "references",
    label: "References",
    entry: (r) => ({ title: r.name, summary: r.reference }),
  },
];

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function entryHtml({ when, where, title, org, url, summary, highlights, tags }) {
  const rail = [when, where].filter(Boolean).map((line) => `<span>${escape(line)}</span>`);
  const heading = url ? `<a href="${escape(url)}">${escape(title)}</a>` : escape(title);
  const matter = [
    `<h3>${heading}${org ? `<span class="org">${escape(org)}</span>` : ""}</h3>`,
    summary ? `<p>${prose(summary)}</p>` : "",
    list(highlights).length
      ? `<ul>${list(highlights).map((h) => `<li>${prose(h)}</li>`).join("")}</ul>`
      : "",
    list(tags).length ? `<p class="tags">${list(tags).map(escape).join(" · ")}</p>` : "",
  ];
  return `<article class="entry"><p class="rail">${rail.join("")}</p><div class="matter">${matter.join("")}</div></article>`;
}

function termHtml({ name, note, values }) {
  const small = note ? `<small>${escape(note)}</small>` : "";
  return `<dt>${escape(name)}${small}</dt><dd>${list(values).map(escape).join(", ")}</dd>`;
}

function sectionHtml(resume, { key, label, entry, term }) {
  const items = list(resume[key]);
  if (!items.length) return "";
  const body = entry
    ? items.map((item) => entryHtml(entry(item))).join("")
    : `<dl class="terms">${items.map((item) => termHtml(term(item))).join("")}</dl>`;
  return `<section class="band" aria-labelledby="${key}-h"><h2 class="label" id="${key}-h">${label}</h2>${body}</section>`;
}

// A web address as a reader would type it: no scheme, no "www.", no trailing slash.
const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function contactRows(basics) {
  const { location = {} } = basics;
  const link = (href, text) => `<a href="${escape(href)}">${escape(text)}</a>`;
  return [
    ["Location", escape([location.city, location.region].filter(Boolean).join(", "))],
    ["Email", basics.email && link(`mailto:${basics.email}`, basics.email)],
    ["Phone", basics.phone && link(`tel:${basics.phone.replace(/[^\d+]/g, "")}`, basics.phone)],
    ["Website", basics.url && link(basics.url, bare(basics.url))],
    ...list(basics.profiles).map((p) => [p.network, p.url ? link(p.url, bare(p.url)) : escape(p.username)]),
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => `<dt>${escape(name)}</dt><dd>${value}</dd>`)
    .join("");
}

// The last word of the name is set upright and bold against the light italic.
function nameHtml(name) {
  const parts = String(name ?? "").trim().split(/\s+/);
  const last = parts.pop();
  return `${escape(parts.join(" "))} <em>${escape(last)}</em>`.trim();
}

// options.nav: [{ label, href, current }] shown on screen above the sheet.
// options.pdf: href of the PDF. options.note: a short tag, such as a variant name.
function render(resume, options = {}) {
  const basics = resume.basics ?? {};
  const { nav = [], pdf, note } = options;
  const strip =
    nav.length || pdf
      ? `<nav class="strip screen" aria-label="Site">${nav
          .map((n) => `<a href="${escape(n.href)}"${n.current ? ' aria-current="page"' : ""}>${escape(n.label)}</a>`)
          .join("")}<span class="sp"></span>${note ? `<span class="hide">${escape(note)}</span>` : ""}${
          pdf ? `<a class="pdf" href="${escape(pdf)}">Download PDF</a>` : ""
        }</nav>`
      : "";
  const contact = contactRows(basics);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(words(basics.name, "· Resume"))}</title>
<meta name="description" content="${escape(words(basics.name) + (basics.label ? `, ${basics.label}` : ""))}">
<meta name="theme-color" content="#FDFDFB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#2C2C2E" media="(prefers-color-scheme: dark)">
<style>
${CSS}</style>
</head>
<body>
<div class="sheet">
${strip}
<main>
<header class="hero">
<h1>${nameHtml(basics.name)}</h1>
${basics.label ? `<p class="label">${escape(basics.label)}</p>` : ""}
</header>
<div class="intro">
<p>${prose(basics.summary)}</p>
${contact ? `<dl class="specs">${contact}</dl>` : ""}
</div>
${SECTIONS.map((section) => sectionHtml(resume, section)).filter(Boolean).join("\n")}
</main>
<footer class="colophon screen">
<span>Set in Source Serif 4 and Source Code Pro</span>
<span class="sp"></span>
<span>Written as <a href="https://jsonresume.org">JSON Resume</a></span>
</footer>
</div>
</body>
</html>
`;
}

module.exports = { render };
