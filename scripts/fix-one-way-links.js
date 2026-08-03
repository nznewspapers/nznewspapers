const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function readPaper(id) {
  const filePath = path.join(PAPERS_DIR, `${id}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

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

function writePaper(id, paper) {
  if (paper.sources) {
    paper.sources = sortSourcesDescending(paper.sources);
  }
  const filePath = path.join(PAPERS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(paper, null, 2) + "\n");
}

function runFixes() {
  const timestamp = new Date().toISOString();

  // Fix 1: 2423.json (The Prohibitionist) -> Add reciprocal link to 2873 (Vanguard)
  const p2423 = readPaper(2423);
  p2423.links = p2423.links || {};
  p2423.links["2873"] = {
    direction: "Succeeding",
    relationship: "Continued by",
    "target-description": "Vanguard",
  };
  p2423.sources = p2423.sources || {};
  p2423.sources[timestamp] =
    "Added reciprocal Succeeding link to record 2873 (Vanguard).";
  writePaper(2423, p2423);
  console.log("Updated 2423.json with reciprocal link to 2873");

  // Fix 2: 2881.json (South Auckland Farm Review) -> Replace undefined-unknown with 2882
  const p2881 = readPaper(2881);
  p2881.links = p2881.links || {};
  delete p2881.links["undefined-unknown"];
  p2881.links["2882"] = {
    direction: "Succeeding",
    relationship: "Continued by",
    "target-description":
      "Northern farm review incorporating farming world",
  };
  p2881.sources = p2881.sources || {};
  p2881.sources[timestamp] =
    "Resolved reciprocal Succeeding link to record 2882 (Northern Farm Review).";
  writePaper(2881, p2881);
  console.log("Updated 2881.json with resolved link to 2882");

  // Fix 3: 2196.json (Creativity Network) -> Replace undefined-unknown with 2889
  const p2196 = readPaper(2196);
  p2196.links = p2196.links || {};
  delete p2196.links["undefined-unknown"];
  p2196.links["2889"] = {
    direction: "Preceding",
    relationship: "Continues",
    "target-description": "Art & creativity",
  };
  p2196.sources = p2196.sources || {};
  p2196.sources[timestamp] =
    "Resolved reciprocal Preceding link to record 2889 (Art & Creativity).";
  writePaper(2196, p2196);
  console.log("Updated 2196.json with resolved link to 2889");

  // Fix 4: 2761.json (Pacific Star Auckland) -> Add links object and link to 2892
  const p2761 = readPaper(2761);
  p2761.links = p2761.links || {};
  p2761.links["2892"] = {
    direction: "Preceding",
    relationship: "Continues",
    "target-description": "Pacific Network Newspaper",
  };
  p2761.sources = p2761.sources || {};
  p2761.sources[timestamp] =
    "Added reciprocal Preceding link to record 2892 (Pacific Network Newspaper).";
  writePaper(2761, p2761);
  console.log("Updated 2761.json with reciprocal link to 2892");

  // Fix 5: 2461.json (Community News Pegasus Post Ed) -> Replace incorrect 2500 with 2931
  const p2461 = readPaper(2461);
  p2461.links = p2461.links || {};
  delete p2461.links["2500"];
  p2461.links["2931"] = {
    direction: "Preceding",
    relationship: "Continues",
    "target-description": "Pegasus post",
  };
  p2461.sources = p2461.sources || {};
  p2461.sources[timestamp] =
    "Fixed reciprocal Preceding link target ID from 2500 to 2931 (Pegasus Post).";
  writePaper(2461, p2461);
  console.log("Updated 2461.json with corrected link to 2931");

  console.log("\n✅ All 5 one-way link fixes applied successfully!");
}

runFixes();
