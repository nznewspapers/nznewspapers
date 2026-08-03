const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function isSourcesSortedDescending(sourcesObj) {
  if (!sourcesObj) return true;
  const keys = Object.keys(sourcesObj);
  const sortedKeys = [...keys].sort((a, b) => b.localeCompare(a));
  return JSON.stringify(keys) === JSON.stringify(sortedKeys);
}

function checkCanonicalOrder(paper) {
  const keys = Object.keys(paper);

  // Verify links comes before sources, and sources comes before revision
  const linksIdx = keys.indexOf("links");
  const sourcesIdx = keys.indexOf("sources");
  const revisionIdx = keys.indexOf("revision");

  if (linksIdx !== -1 && sourcesIdx !== -1 && linksIdx > sourcesIdx) {
    return false;
  }
  if (sourcesIdx !== -1 && revisionIdx !== -1 && sourcesIdx > revisionIdx) {
    return false;
  }

  // Verify sources keys are sorted descending
  if (paper.sources && !isSourcesSortedDescending(paper.sources)) {
    return false;
  }

  return true;
}

function runTest() {
  console.log("Checking canonical field order in data/papers/*.json...");
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const failures = [];

  files.forEach((f) => {
    const filePath = path.join(PAPERS_DIR, f);
    const paper = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!checkCanonicalOrder(paper)) {
      failures.push(f);
    }
  });

  if (failures.length > 0) {
    console.error(`❌ Field order test failed in ${failures.length} file(s):`);
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log(`✅ All ${files.length} paper JSON files passed canonical field order test!`);
  }
}

runTest();
