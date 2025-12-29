# The Newspapers of New Zealand

An index to all the newspapers ever published in New Zealand.

The website is available at: **https://www.nznewspapers.org/** (or **https://nznewspapers.github.io/nznewspapers/**)

This project is a modern reconstruction of an older website that went offline in 2020. The original site was archived by the [Internet Archive](https://web.archive.org/web/20200710010513/http://nznewspapers.appspot.com/).

## Project Overview

This version uses a static site generator approach:
*   **Data**: Stored as individual JSON files in `data/papers/`, with source MARC records in `data/marc/`.
*   **Build System**: [Eleventy (11ty)](https://www.11ty.dev/) compiles the data and templates into a static website.
*   **Hosting**: The built site is served via GitHub Pages from the `docs/` folder.

## Prerequisites

*   [Node.js](https://nodejs.org/) (Version 14 or higher recommended)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nznewspapers/nznewspapers.git
    cd nznewspapers
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the local development server:**
    ```bash
    npm start
    ```
    This will start a local server (usually at `http://localhost:8080`) and watch for file changes.

## Building for Production

To generate the static site in the `docs/` folder (which is served by GitHub Pages):

```bash
npm run build
```

## Project Structure

*   **`data/`**: The core database.
    *   `papers/`: JSON files, one per newspaper. These are the source of truth for the website.
    *   `marc/`: Raw MARC records (text format) used to generate the JSON data initially or for reference.
*   **`src/`**: The source code for the website.
    *   `_data/`: JavaScript files that load, process, and group the JSON data for Eleventy.
    *   `*.njk`: Nunjucks templates for the site pages.
    *   `assets/`: Static assets (CSS, images).
*   **`scripts/`**: Maintenance scripts for updating the data.
*   **`docs/`**: The compiled output directory (do not edit directly).

## Data Maintenance

The newspaper data is maintained using scripts in the `scripts/` directory.

### Updating from National Bibliography

The `nzn-nat-bib-updater.js` script adds new records or updates existing ones from the New Zealand National Bibliography.

See `scripts/README.md` for detailed instructions on running these updates.

### Updating Papers Past Links

The `nzn-paperspast-updater.js` script updates the JSON files with links to digitized copies on the Papers Past website.

## Contributing

Contributions are welcome!

*   **Data Corrections**: You can directly edit the JSON files in `data/papers/` and submit a Pull Request.
*   **Code Improvements**: Feel free to improve the Eleventy templates or styles in `src/`.

## License

This project operates under a dual license:

*   **Code**: The source code is licensed under the [MIT License](https://opensource.org/licenses/MIT).
*   **Data**: The dataset is derived from the [Publications New Zealand Metadata Dataset](https://natlib.govt.nz/about-us/open-data/publications-nz-metadata) and is licensed under the [Creative Commons Attribution 3.0 New Zealand licence (CC BY 3.0 NZ)](https://creativecommons.org/licenses/by/3.0/nz/).

Please attribute the National Library of New Zealand when using the data.