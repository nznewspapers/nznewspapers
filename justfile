# justfile for Newspapers of New Zealand

# Default task: list all available commands
default:
    @just --list

# Install all Node dependencies needed for development, building, and linting
install:
    npm install

# Run local Eleventy development server with live reloading
dev:
    npm start

# Build static site to docs/ folder for GitHub Pages deployment
build:
    npm run build

# Update digitised links and codes from Papers Past TSV data
paperspast:
    npm run nzn-paperspast-updater

# Run code style, template, and JS linter checks
lint:
    npm run lint

# Validate compiled HTML pages in docs/
lint-html:
    npm run lint:html

# Auto-format source files with Prettier
format:
    npm run format

# Run full rebuild sequence
release: build
