const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function readPaper(id) {
  const filePath = path.join(PAPERS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
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

function runGraphFixes() {
  const timestamp = new Date().toISOString();

  // 1. Fix Cycle 11: 1736 (Hawke's Bay Herald-Tribune) link to 1735 should be Preceding
  const p1736 = readPaper("1736");
  if (p1736 && p1736.links && p1736.links["1735"]) {
    p1736.links["1735"] = {
      direction: "Preceding",
      relationship: "Formed by the union",
      "target-description": "Hawke's Bay Tribune",
    };
    p1736.sources = p1736.sources || {};
    p1736.sources[timestamp] =
      "Fixed link direction to 1735 (Hawke's Bay Tribune) to Preceding.";
    writePaper("1736", p1736);
    console.log("Fixed Cycle 11: Updated 1736.json link to 1735");
  }

  // 2. Fix Cycle 13: 2411 (The Press) and 2506 (South Island Ed) edition links
  const p2411 = readPaper("2411");
  if (p2411 && p2411.links && p2411.links["2506"]) {
    p2411.links["2506"] = {
      direction: "Has Edition",
      relationship: "Parallel Edition",
      "target-description": "The Press (South Island edition)",
    };
    p2411.sources = p2411.sources || {};
    p2411.sources[timestamp] =
      "Updated link direction to 2506 (Press South Island Edition) to Has Edition.";
    writePaper("2411", p2411);
    console.log("Fixed Cycle 13: Updated 2411.json link to 2506");
  }

  const p2506 = readPaper("2506");
  if (p2506 && p2506.links && p2506.links["2411"]) {
    p2506.links["2411"] = {
      direction: "Is Edition Of",
      relationship: "Parallel Edition",
      "target-description": "The Press",
    };
    p2506.sources = p2506.sources || {};
    p2506.sources[timestamp] =
      "Updated link direction to 2411 (The Press) to Is Edition Of.";
    writePaper("2506", p2506);
    console.log("Fixed Cycle 13: Updated 2506.json link to 2411");
  }

  // 3. Fix Cycles 12 & 14 and 1, 2, 3: Remove horizontal co-predecessor links
  const horizontalRemovals = {
    "2197": ["2201"],
    "2201": ["2197"],
    "2478": ["2479"],
    "2479": ["2478"],
    "1231": ["1232", "1418"],
    "1232": ["1231", "1418"],
    "1418": ["1231", "1232"],
  };

  Object.entries(horizontalRemovals).forEach(([id, targets]) => {
    const paper = readPaper(id);
    if (paper && paper.links) {
      let mod = false;
      targets.forEach((tId) => {
        if (paper.links[tId]) {
          delete paper.links[tId];
          mod = true;
        }
      });
      if (mod) {
        paper.sources = paper.sources || {};
        paper.sources[timestamp] =
          `Removed redundant horizontal co-predecessor link (${targets.join(
            ", "
          )}).`;
        writePaper(id, paper);
        console.log(`Removed horizontal links from #${id}`);
      }
    }
  });

  // 4. Fix Cycles 4-10: Clean up Aucklander regional edition horizontal mesh (1244-1247, 1257, 1258)
  const aucklanderMesh = ["1244", "1245", "1246", "1247", "1257", "1258"];
  aucklanderMesh.forEach((id) => {
    const paper = readPaper(id);
    if (paper && paper.links) {
      let mod = false;
      aucklanderMesh.forEach((tId) => {
        if (tId !== id && paper.links[tId]) {
          delete paper.links[tId];
          mod = true;
        }
      });
      if (mod) {
        paper.sources = paper.sources || {};
        paper.sources[timestamp] =
          "Removed inter-edition horizontal mesh links between Aucklander regional editions.";
        writePaper(id, paper);
        console.log(`Cleaned Aucklander edition mesh in #${id}`);
      }
    }
  });

  console.log("\n✅ All 14 graph cycle repairs completed successfully!");
}

runGraphFixes();
