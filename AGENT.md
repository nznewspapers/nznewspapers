# AGENT.md: Newspapers of New Zealand

This document defines the scope, data standards, architecture, and maintenance workflows for the **Newspapers of New Zealand** repository.

---

## 1. Project Overview & Mission

**Newspapers of New Zealand** (https://www.nznewspapers.org/) is a comprehensive digital catalogue of serial newspapers published in New Zealand since the *New Zealand Gazette and Wellington Spectator* in 1839.

The project reconstructs and expands upon the original cataloguing effort, providing a searchable index by title, place, digitisation status, and historical period.

---

## 2. Inclusion & Scope Criteria

When evaluating publications for inclusion or data updates, adhere strictly to the following criteria (detailed on the [`Scope and Terminology`](file:///Users/gpaynter/Working/nznewspapers/docs/scope/index.html) page):

### In-Scope
* **Newspapers**: Serial publications published in New Zealand for a general audience, serving a recognizable community, providing current events news, printed at least fortnightly on newsprint, with a masthead and multi-column layout.
* **Editions**: Variant forms or specific regular editions of a newspaper (e.g., *Northern Advocate Weekly* as a weekend edition).
* **Masthead Variations**: Historical title changes of long-running newspapers (tracked with continuation links such as `Preceding` / `Succeeding` / `Continues` / `Continued By`).

### Out-of-Scope
* **Magazines & Journals**: Periodicals focused purely on specialized subjects, trade journals, or academic publications.
* **Non-NZ Publications**: Serials published outside New Zealand (e.g., Pacific Island papers like *Samoa Times* or British colonial papers, even if present in historical collections like Papers Past).
* **Unrelated Serials**: Newsletters, single-issue broadsides, or non-periodical pamphlets.

---

## 3. Data Sources & Maintenance Status

### Source of Truth
* Individual JSON files in `data/papers/<id>.json` are the primary database for the website.
* Field schema: `id`, `title`, `genre`, `firstYear`, `finalYear`, `firstIssueDate`, `finalIssueDate`, `placename`, `district`, `region`, `placecode`, `frequency`, `isCurrent`, `idPapersPastCode`, `urlDigitized`, `idMarcControlNumber`.

### Active Data Workflows
* **Papers Past Updates**: `nzn-paperspast-updater.js` updates existing newspaper records with digitisation URLs (`urlDigitized`) and Papers Past codes (`idPapersPastCode`) using `scripts/PapersPastNewspaperData.tsv`.

### Deprecated Workflows
* ❌ **National Bibliography MARC Updates**: `nzn-nat-bib-updater.js` and bulk MARC file imports (`PubsNZ.mrc`) are **DEPRECATED**. Do not automatically ingest raw MARC records.

---

## 4. Site Architecture & Build Process

* **Templates**: Nunjucks (`.njk`) files located in `src/` (layouts in `src/_includes/layout.njk`, styles in `src/assets/nznewspapers.css`).
* **Data Processing**: Eleventy automatically ingests `data/papers/*.json` via `src/_data/*.js` helper scripts (`papers.js`, `places.js`, `stats.js`, etc.).
* **Static Output**: Compiled static site files are generated in `docs/` and deployed directly to GitHub Pages.

---

## 5. Development & Task Execution (`justfile`)

Use the `just` command runner (or `npm run ...` equivalents) for common project tasks:

* `just dev` — Run local Eleventy development server with live reloading (`npm start`)
* `just build` — Compile static site pages into `docs/` (`npm run build`)
* `just paperspast` — Run Papers Past digitised link updater (`npm run nzn-paperspast-updater`)
* `just release` — Perform a full static site rebuild sequence (`npm run release`)
