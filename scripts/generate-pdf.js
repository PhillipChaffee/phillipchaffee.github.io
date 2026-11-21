const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const htmlPath = process.argv[2] || "resume/index.html";
const outputPath = process.argv[3] || "resume/phillip-chaffee-resume.pdf";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const html = fs.readFileSync(htmlPath, "utf-8");
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("print");

  await page.pdf({
    path: outputPath,
    preferCSSPageSize: true,
    printBackground: true,
  });

  await browser.close();
  console.log("PDF written to " + outputPath);
})();
