const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function getComplementaryDirections(dir, rel) {
  const d = (dir || "").toLowerCase();
  const r = (rel || "").toLowerCase();

  if (d.includes("edition") || r.includes("edition")) {
    return d.includes("has edition") ? ["is edition of"] : ["has edition"];
  }
  if (d.includes("masthead") || r.includes("masthead")) {
    return d.includes("has masthead") ? ["is masthead of"] : ["has masthead"];
  }

  // Preceding -> Succeeding
  if (
    d === "preceding" ||
    d === "continues" ||
    r.includes("formed by") ||
    r.includes("continues")
  ) {
    return ["succeeding", "continued by", "merged into", "absorbed by"];
  }

  // Succeeding -> Preceding
  if (
    d === "succeeding" ||
    d === "continued by" ||
    r.includes("continued by") ||
    r.includes("merged into")
  ) {
    return ["preceding", "continues", "formed by union", "absorbed"];
  }

  return [];
}

function runTest() {
  console.log("Checking reciprocal paper links in data/papers/...");

  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();

  files.forEach((f) => {
    const filePath = path.join(PAPERS_DIR, f);
    const content = fs.readFileSync(filePath, "utf8");
    const paper = JSON.parse(content);
    papersMap.set(String(paper.id), paper);
  });

  const errors = [];
  let totalLinksChecked = 0;

  papersMap.forEach((paper, id) => {
    if (paper.links) {
      Object.entries(paper.links).forEach(([targetId, linkObj]) => {
        totalLinksChecked++;
        const targetStr = String(targetId);
        const targetPaper = papersMap.get(targetStr);

        if (!targetPaper) {
          errors.push(
            `Paper ${id} ("${paper.title}") links to missing target paper ${targetStr}.`
          );
          return;
        }

        if (!targetPaper.links || !targetPaper.links[id]) {
          errors.push(
            `Paper ${id} ("${paper.title}") links to Paper ${targetStr} ("${targetPaper.title}") as "${linkObj.direction || linkObj.relationship}", but ${targetStr} has NO reciprocal link back to ${id}.`
          );
          return;
        }

        const backLink = targetPaper.links[id];
        const expectedBackDirs = getComplementaryDirections(
          linkObj.direction,
          linkObj.relationship
        );
        const actualBackDir = (
          backLink.direction ||
          backLink.relationship ||
          ""
        ).toLowerCase();

        if (
          expectedBackDirs.length > 0 &&
          !expectedBackDirs.some((exp) => actualBackDir.includes(exp))
        ) {
          errors.push(
            `Paper ${id} ("${paper.title}") links to ${targetStr} as "${linkObj.direction || linkObj.relationship}", but reciprocal link from ${targetStr} is "${backLink.direction || backLink.relationship}" (expected inverse).`
          );
        }
      });
    }
  });

  console.log(
    `Checked ${totalLinksChecked} links across ${papersMap.size} paper records.`
  );

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} link error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log(`\n✅ All ${totalLinksChecked} paper links are reciprocal!`);
    process.exit(0);
  }
}

runTest();
