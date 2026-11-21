const fs = require("fs");
const path = require("path");

const resumePath = process.argv[2] || "tmp/resume/resume.json";
const themePath = process.argv[3] || "resume-theme";
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

// The navigation is hidden in print, so the PDF is printed from this same file.
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "index.html"),
  theme.render(resume, { nav, pdf, note: label }),
);

console.log("Resume HTML written to " + outputDir);
