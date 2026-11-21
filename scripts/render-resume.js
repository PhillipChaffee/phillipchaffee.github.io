const fs = require("fs");
const path = require("path");

const resumePath = process.argv[2] || "tmp/resume/resume.json";
const themePath = process.argv[3] || "tmp/jsonresume-theme-editorial";
const outputDir = process.argv[4] || "resume";
const label = process.argv[5] || "";

const resume = JSON.parse(fs.readFileSync(resumePath, "utf-8"));
const theme = require(path.resolve(themePath));

const nav = [
  { label: "Home", href: "/" },
  { label: "Writing", href: "/writing/" },
  { label: "Projects", href: "/projects/" },
  { label: "Books", href: "/books/" },
  { label: "Resume", href: "/resume/", current: !label },
];
const pdf = label
  ? `/resume/${label}/phillip-chaffee-resume.pdf`
  : "/resume/phillip-chaffee-resume.pdf";

// Sets the theme's nav in the site header's font, size, colour and height,
// so the links look the same on the resume as on the other pages.
const head = `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inconsolata:400,700&display=swap">
<style>
  @media screen {
    :root { --site-link: #0067FB; }
    .page { padding-top: 100px; }
    .nav { font: 400 18px/1.4 Inconsolata, ui-monospace, monospace; gap: 4px 18px; margin-bottom: 72px; }
    .nav a, .nav a[aria-current], .nav .pdf { color: var(--site-link); }
    .nav .sep { color: var(--muted); }
  }
  @media screen and (prefers-color-scheme: dark) { :root { --site-link: #8AB4FF; } }
  @media screen and (max-width: 600px) { .page { padding-top: 40px; } .nav { font-size: 16px; margin-bottom: 44px; } }
</style>`;

// The navigation is hidden in print, so the PDF is printed from this same file.
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "index.html"),
  theme.render(resume, { nav, pdf, note: label, head }),
);

console.log("Resume HTML written to " + outputDir);
