const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

// Explicit list of horizontal links to remove from each paper record
const REMOVALS = {
  "2895": ["2897"],
  "2897": ["2895"],
  "2904": ["2908"],
  "2908": ["2904"],
  "2485": ["2486", "2487", "2488"],
  "2486": ["2485", "2487", "2488"],
  "2487": ["2485", "2486", "2488"],
  "2488": ["2485", "2486", "2487"],
  "2490": ["2491", "2492", "2493"],
  "2491": ["2490", "2492", "2493"],
  "2492": ["2490", "2491", "2493"],
  "2493": ["2490", "2491", "2492"],
  "2720": ["2721"],
  "2721": ["2720"],
};

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

function runFix() {
  const timestamp = new Date().toISOString();

  Object.entries(REMOVALS).forEach(([id, removeTargets]) => {
    const filePath = path.join(PAPERS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return;

    const paper = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!paper.links) return;

    let modified = false;
    removeTargets.forEach((targetId) => {
      if (paper.links[targetId]) {
        delete paper.links[targetId];
        modified = true;
      }
    });

    if (modified) {
      paper.sources = paper.sources || {};
      paper.sources[timestamp] =
        `Removed redundant horizontal co-predecessor links (${removeTargets.join(
          ", "
        )}) to standardize on DAG merger lineage.`;

      paper.sources = sortSourcesDescending(paper.sources);

      fs.writeFileSync(filePath, JSON.stringify(paper, null, 2) + "\n");
      console.log(
        `Removed redundant horizontal links from #${id} (${paper.title})`
      );
    }
  });

  console.log(
    "\n✅ Redundant co-predecessor horizontal links removed successfully!"
  );
}

runFix();
