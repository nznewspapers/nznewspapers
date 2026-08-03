const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

const AFFECTED_IDS = [
  "2895", "2897", "2898",
  "2904", "2908", "2257",
  "2485", "2486", "2487", "2488",
  "2490", "2491", "2492", "2493",
  "2720", "2721"
];

function run() {
  console.log(`================================================================================`);
  console.log(`INSPECTING MERGER LINK LABELS (DIRECTION & RELATIONSHIP) FOR UNION PAPERS`);
  console.log(`================================================================================\n`);

  AFFECTED_IDS.forEach((id) => {
    const filePath = path.join(PAPERS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return;

    const paper = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`Paper #${id} ["${paper.title}"] (${paper.firstYear}–${paper.finalYear}):`);

    if (paper.links) {
      Object.entries(paper.links).forEach(([targetId, link]) => {
        console.log(`  -> Link to #${targetId}: direction="${link.direction || ""}", relationship="${link.relationship || ""}", target="${link["target-description"] || ""}"`);
      });
    } else {
      console.log(`  (No links)`);
    }
    console.log("");
  });
}

run();
