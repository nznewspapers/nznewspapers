# justfile for Newspapers of New Zealand

# Default task: list all available commands
default:
    @just --list

# Run local Eleventy development server with live reloading
dev:
    npm start

# Build static site to docs/ folder for GitHub Pages deployment
build:
    npm run build

# Update digitised links and codes from Papers Past TSV data
paperspast:
    npm run nzn-paperspast-updater

# Run full rebuild sequence
release: build
