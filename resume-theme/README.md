# Resume theme

A [JSON Resume](https://jsonresume.org) theme that sets a resume the way
[MD Viewer](https://phillipchaffee.github.io/md-viewer/) sets a document: one
centered 680 px column of Source Serif 4 on the app's Sepia palette (Dusk when
the reader's system is dark), bold serif headings on the app's scale, meta
lines in the interface face, and a bar on top with the current page underlined
like the open tab.

`render(resume, options)` returns one HTML document with its styles and fonts
inside it. The same file is the web page and the source of the PDF: the print
styles in `style.css` set it in ink on white Letter paper and hide the bar.

| Option | Meaning |
| --- | --- |
| `nav` | Links shown above the sheet on screen: `[{ label, href, current }]` |
| `pdf` | Address of the PDF, for the Download PDF link |
| `note` | A short tag next to that link, such as a variant name |

Two things go beyond the JSON Resume schema. A `work` item may list its
technologies in `tech`. Prose fields may contain `<a href="https://...">`
links; any other tag is shown as text.

```bash
node --test resume-theme/test.js
node scripts/render-resume.js path/to/resume.json resume-theme out
node scripts/generate-pdf.js out/index.html out/resume.pdf
```

The serif and code fonts in `fonts/` are the builds MD Viewer's site serves.
Inter, for the bar and meta lines, is the Latin build from Fontsource. All are
under the SIL Open Font License (see the licence files beside them).
