# Newspapers of New Zealand

An index of every newspaper published in New Zealand since 1839.

🌐 **Live Website**: [https://www.nznewspapers.org/](https://www.nznewspapers.org/)  
📦 **GitHub Pages Mirror**: [https://nznewspapers.github.io/nznewspapers/](https://nznewspapers.github.io/nznewspapers/)

---

## 📰 About the Project

**Newspapers of New Zealand** catalogues historical and current newspapers published across New Zealand, from early 19th-century gazettes to modern community papers.

This project is a modern reconstruction of an older website that went offline in 2020. The original site was archived by the [Internet Archive](https://web.archive.org/web/20200710010513/http://nznewspapers.appspot.com/).

- **Data**: Each newspaper is stored as an individual JSON record in `data/papers/`.
- **Build System**: [Eleventy (11ty)](https://www.11ty.dev/) compiles data and templates into static web pages.
- **Hosting**: Automated static site hosting via GitHub Pages from the `docs/` directory.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- Optional: [`just`](https://github.com/casey/just) command runner

### Development

```bash
# Clone the repository
git clone https://github.com/nznewspapers/nznewspapers.git
cd nznewspapers

# Install dependencies
just install  # or: npm install

# Start local dev server (http://localhost:8080)
just dev      # or: npm start
```

---

## 🛠️ Common Commands

You can run common project tasks using `just` or `npm`:

| Task                   | `just` Command    | `npm` Command                    | Description                                          |
| ---------------------- | ----------------- | -------------------------------- | ---------------------------------------------------- |
| **Install Packages**   | `just install`    | `npm install`                    | Installs all Node dependencies                       |
| **Development**        | `just dev`        | `npm start`                      | Launches live-reloading local web server             |
| **Build Site**         | `just build`      | `npm run build`                  | Compiles site pages into `docs/` with Eleventy       |
| **Source Linting**     | `just lint`       | `npm run lint`                   | Runs Prettier template formatting & ESLint JS checks |
| **Validate HTML**      | `just lint-html`  | `npm run lint:html`              | Validates compiled HTML pages in `docs/`             |
| **Auto-format**        | `just format`     | `npm run format`                 | Auto-formats Nunjucks templates, CSS, and Markdown   |
| **Papers Past Update** | `just paperspast` | `npm run nzn-paperspast-updater` | Updates digitised links & codes from Papers Past TSV |
| **Release Build**      | `just release`    | `npm run release`                | Rebuilds full production static site                 |

---

## 📁 Repository Structure

```
├── data/
│   └── papers/        # Source of truth: JSON records (one file per newspaper)
├── src/               # Site source code (Eleventy templates, layout, CSS)
│   ├── _data/         # Data loading and index aggregation scripts
│   ├── assets/        # CSS stylesheet and images
│   └── *.njk          # Page templates (home, newspaper details, place, titles)
├── scripts/           # Maintenance scripts & Papers Past dataset (PapersPastNewspaperData.tsv)
├── docs/              # Generated static HTML site (served by GitHub Pages)
├── AGENT.md           # Developer & AI Agent scope guidelines, rules, and data policies
└── justfile           # Command runner configuration
```

---

## 🤖 Maintainer & AI Guidelines

For detailed scope definitions (what counts as a newspaper), data schemas, continuation rules, and deprecated data pipelines, please see **[AGENT.md](./AGENT.md)**.

---

## 🤝 Contributing

Contributions are welcome!

### Quick Guide: How to Edit or Add a Newspaper

1. **Find the Record**: Locate the newspaper's file in `data/papers/<id>.json` (e.g., [`data/papers/1001.json`](file:///Users/gpaynter/Working/nznewspapers/data/papers/1001.json)).
2. **Make Edits**: Update metadata fields (title, dates, place, `urlDigitized`, etc.).
3. **Preview Locally**: Run `just dev` (or `npm start`) and check the page at `http://localhost:8080/newspapers/<id>/`.
4. **Submit PR**: Commit your change and open a Pull Request.

- **Code Improvements**: Enhancements to Nunjucks templates or CSS in `src/` are also appreciated.

---

## 📄 License

- **Code**: [MIT License](https://opensource.org/licenses/MIT)
- **Data**: Derived from the [Publications New Zealand Metadata Dataset](https://natlib.govt.nz/about-us/open-data/publications-nz-metadata) by the National Library of New Zealand, licensed under [CC BY 3.0 NZ](https://creativecommons.org/licenses/by/3.0/nz/).
