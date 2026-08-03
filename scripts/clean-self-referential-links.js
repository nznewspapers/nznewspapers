const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function sortSourcesDescending(sourcesObj) {
  if (!sourcesObj) return sourcesObj;
  const sorted = {};
  Object.keys(sourcesObj)
    .sort((a, b) => b.localeCompare(a))
    .forEach((key) => {
      sorted[key] = sourcesObj[key];
    });
  return sorted;
}

function runSelfClean() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const timestamp = new Date().toISOString();

  files.forEach((f) => {
    const filePath = path.join(PAPERS_DIR, f);
    const paper = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const id = String(paper.id);

    if (paper.links && paper.links[id]) {
      delete paper.links[id];
      paper.sources = paper.sources || {};
      paper.sources[timestamp] = "Removed self-referential link pointing to own record ID.";
      paper.sources = sortSourcesDescending(paper.sources);

      fs.writeFileSync(filePath, JSON.stringify(paper, null, 2) + "\n");
      console.log(`Removed self-referential link in #${id} (${paper.title})`);
    }
  });
}

runSelfClean();
