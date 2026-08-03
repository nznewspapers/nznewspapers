# AGENT.md: Newspapers of New Zealand

This document defines the scope, data standards, architecture, and maintenance workflows for the **Newspapers of New Zealand** repository.

---

## 1. Project Overview & Repository Links

- **Live Website**: https://www.nznewspapers.org/
- **GitHub Repository**: https://github.com/nznewspapers/nznewspapers
- **Pull Requests**: https://github.com/nznewspapers/nznewspapers/pulls

**Newspapers of New Zealand** is a comprehensive digital catalogue of serial newspapers published in New Zealand since the _New Zealand Gazette and Wellington Spectator_ in 1839.

The project reconstructs and expands upon the original cataloguing effort, providing a searchable index by title, place, digitisation status, and historical period.

---

## 2. Inclusion & Scope Criteria

When evaluating publications for inclusion or data updates, adhere strictly to the following criteria (detailed on the [`Scope and Terminology`](file:///Users/gpaynter/Working/nznewspapers/docs/scope/index.html) page):

### In-Scope

- **Newspapers**: Serial publications published in New Zealand for a general audience, serving a recognizable community, providing current events news, printed at least fortnightly on newsprint, with a masthead and multi-column layout.
- **Editions**: Variant forms or specific regular editions of a newspaper (e.g., _Northern Advocate Weekly_ as a weekend edition).
- **Masthead Variations**: Historical title changes of long-running newspapers (tracked with continuation links such as `Preceding` / `Succeeding` / `Continues` / `Continued By`).

### Out-of-Scope

- **Magazines & Journals**: Periodicals focused purely on specialized subjects, trade journals, or academic publications.
- **Non-NZ Publications**: Serials published outside New Zealand (e.g., Pacific Island papers like _Samoa Times_ or British colonial papers, even if present in historical collections like Papers Past).
- **Unrelated Serials**: Newsletters, single-issue broadsides, or non-periodical pamphlets.

---

## 3. Data Sources & Maintenance Status

### Source of Truth

- Individual JSON files in `data/papers/<id>.json` are the primary database for the website.
- Field schema: `id`, `title`, `genre`, `firstYear`, `finalYear`, `firstIssueDate`, `finalIssueDate`, `placename`, `district`, `region`, `placecode`, `frequency`, `isCurrent`, `idPapersPastCode`, `urlDigitized`, `idMarcControlNumber`.

### Active Data Workflows

- **Papers Past Updates**: `nzn-paperspast-updater.js` updates existing newspaper records with digitisation URLs (`urlDigitized`) and Papers Past codes (`idPapersPastCode`) using `scripts/PapersPastNewspaperData.tsv`.

### Provenance Notes for Data Changes

- **Mandatory Provenance Entry**: Whenever creating or modifying any newspaper JSON file in `data/papers/<id>.json`, you MUST add (or prepend) a timestamped entry to the `"sources"` object documenting the edit.
- **Short Description & Source**: Keep the description **concise** (1 sentence), and whenever possible, **explicitly include the source of information** (e.g. Papers Past essay, MARC record number, National Library catalogue, local newspaper notice, or issue tracker report).
- **Format**: `"ISO-8601-Timestamp": "Short description of the edit including the source of information if available."`
- **Example**:
  ```json
  "sources": {
    "2026-08-03T13:43:50.000Z": "Fixed self-referential link typo to point to record 1446 (Da ji Yuan shi bao) based on MARC 780 field."
  }
  ```

### Deprecated Workflows

- ❌ **National Bibliography MARC Updates**: `nzn-nat-bib-updater.js` and bulk MARC file imports (`PubsNZ.mrc`) are **DEPRECATED**. Do not automatically ingest raw MARC records.

---

## 4. Site Architecture & Build Process

- **Templates**: Nunjucks (`.njk`) files located in `src/` (layouts in `src/_includes/layout.njk`, styles in `src/assets/nznewspapers.css`).
- **Data Processing**: Eleventy automatically ingests `data/papers/*.json` via `src/_data/*.js` helper scripts (`papers.js`, `places.js`, `stats.js`, etc.).
- **Static Output**: Compiled static site files are generated in `docs/` and deployed directly to GitHub Pages.

### ⚠️ GitHub Pages Deployment Requirement (`docs/` Build)

- **Deployment Mechanism**: GitHub Pages serves static files directly from the `/docs` folder on `master`. There is no automated build workflow in GitHub Actions that compiles the site on push.
- **Mandatory Pre-Merge Build Rule**: Before merging any branch into `master` or releasing updates, you MUST run:
  ```bash
  just build
  ```
  This recompiles all static HTML pages in `docs/` and copies updated assets (`src/assets/nznewspapers.css` -> `docs/assets/nznewspapers.css`).
- **Commit `docs/` for Production**: Rebuilt `docs/` files MUST be committed to `master` and pushed to GitHub so that GitHub Pages publishes the updated CSS, HTML templates, and newspaper counts live to `nznewspapers.org`.

---

## 5. Code Quality & Linting Pipeline

The project uses a two-phase linting strategy:

1. **Pre-Build (Source Code & Templates)**:
   - **Prettier**: Formats `.njk` Nunjucks templates, `.css` stylesheets, and `.md` files (`just format` / `just lint`).
   - **ESLint**: Lints JavaScript data scripts in `src/_data/*.js` and maintenance scripts in `scripts/`.
2. **Post-Build (Compiled HTML Validation)**:
   - **`html-validate`**: Validates generated HTML pages in `docs/**/*.html` after Eleventy compiles the site (`just lint-html`). Ensures macro and template rendering outputs valid HTML5 tags and accessibility structures.

---

## 6. Development & Task Execution (`justfile`)

Use the `just` command runner (or `npm run ...` equivalents) for common project tasks:

- `just install` — Install all Node dependencies (`npm install`)
- `just dev` — Run local Eleventy development server with live reloading (`npm start`)
- `just build` — Compile static site pages into `docs/` (`npm run build`)
- `just lint` — Run Prettier code style and ESLint JavaScript quality checks (`npm run lint`)
- `just lint-html` — Validate compiled HTML pages in `docs/` against W3C/HTML5 standards (`npm run lint:html`)
- `just format` — Auto-format source code with Prettier (`npm run format`)
- `just paperspast` — Run Papers Past digitised link updater (`npm run nzn-paperspast-updater`)
- `just release` — Perform a full static site rebuild sequence (`npm run release`)
