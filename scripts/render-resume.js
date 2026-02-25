const fs = require("fs");
const path = require("path");

const resumePath = process.argv[2] || "tmp/resume/resume.json";
const themePath = process.argv[3] || "tmp/jsonresume-theme-one";
const outputDir = process.argv[4] || "resume";
const label = process.argv[5] || "";

const resume = JSON.parse(fs.readFileSync(resumePath, "utf-8"));
const theme = require(path.resolve(themePath));

const html = theme.render(resume);

fs.mkdirSync(outputDir, { recursive: true });

// Raw HTML for PDF (no nav bar)
fs.writeFileSync(path.join(outputDir, "resume-raw.html"), html);

// Inject nav bar for web version
const resumeLabel = label ? `Resume (${label})` : "Resume";
const pdfHref = label
  ? `/resume/${label}/phillip-chaffee-resume.pdf`
  : "/resume/phillip-chaffee-resume.pdf";

const navBar = `
<div style="background:#0D2B35;padding:10px 20px;font-family:Helvetica,sans-serif;font-size:14px;display:flex;align-items:center;gap:15px;">
  <a href="/" style="color:#fff;text-decoration:none;">Home</a>
  <span style="color:#5C6E74;">/</span>
  <a href="/writing/" style="color:#fff;text-decoration:none;">Writing</a>
  <span style="color:#5C6E74;">/</span>
  <a href="/books/" style="color:#fff;text-decoration:none;">Books</a>
  <span style="color:#5C6E74;">/</span>
  <a href="/resume/" style="color:#fff;text-decoration:none;">Resume</a>${label ? `
  <span style="color:#5C6E74;">/</span>
  <span style="color:#96A0A0;">${label}</span>` : ""}
  <a href="${pdfHref}" style="color:#8BE367;text-decoration:none;margin-left:auto;">Download PDF</a>
</div>`;

const webHtml = html.replace("<body>", "<body>" + navBar);
fs.writeFileSync(path.join(outputDir, "index.html"), webHtml);

console.log("Resume HTML written to " + outputDir);
