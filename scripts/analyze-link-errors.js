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
  if (
    d === "preceding" ||
    d === "continues" ||
    r.includes("formed by") ||
    r.includes("continues")
  ) {
    return ["succeeding", "continued by", "merged into", "absorbed by"];
  }
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

function analyze() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();

  files.forEach((f) => {
    const filePath = path.join(PAPERS_DIR, f);
    const content = fs.readFileSync(filePath, "utf8");
    const paper = JSON.parse(content);
    papersMap.set(String(paper.id), paper);
  });

  const marcPlaceholders = [];
  const missingReciprocals = [];
  const directionMismatches = [];
  const selfLinks = [];

  papersMap.forEach((paper, id) => {
    if (paper.links) {
      Object.entries(paper.links).forEach(([targetId, linkObj]) => {
        const targetStr = String(targetId);

        if (id === targetStr) {
          selfLinks.push({
            id,
            title: paper.title,
            dir: linkObj.direction || linkObj.relationship,
          });
          return;
        }

        if (targetStr.includes("unknown") || targetStr.includes("undefined")) {
          marcPlaceholders.push({
            id,
            title: paper.title,
            targetId,
            desc: linkObj["target-description"] || "",
          });
          return;
        }

        const targetPaper = papersMap.get(targetStr);
        if (!targetPaper) {
          marcPlaceholders.push({
            id,
            title: paper.title,
            targetId,
            desc: linkObj["target-description"] || "",
          });
          return;
        }

        if (!targetPaper.links || !targetPaper.links[id]) {
          missingReciprocals.push({
            fromId: id,
            fromTitle: paper.title,
            toId: targetStr,
            toTitle: targetPaper.title,
            dir: linkObj.direction || linkObj.relationship,
          });
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
          directionMismatches.push({
            fromId: id,
            fromTitle: paper.title,
            toId: targetStr,
            toTitle: targetPaper.title,
            fromDir: linkObj.direction || linkObj.relationship,
            toDir: backLink.direction || backLink.relationship,
          });
        }
      });
    }
  });

  console.log("--- ANALYSIS SUMMARY ---");
  console.log(`1. MARC Placeholders (unknown-X): ${marcPlaceholders.length}`);
  console.log(
    `2. Missing Reciprocal Back-Links (One-Way): ${missingReciprocals.length}`
  );
  console.log(
    `3. Direction Mismatches (Conflicting): ${directionMismatches.length}`
  );
  console.log(`4. Self-Referential Links: ${selfLinks.length}`);

  console.log("\n--- DETAILED BREAKDOWN ---");
  console.log("\n1. MARC PLACEHOLDERS (Sample):");
  marcPlaceholders.slice(0, 15).forEach((p) => {
    console.log(
      `  Record ${p.id} ("${p.title}") -> Target: "${p.targetId}" (${p.desc})`
    );
  });

  console.log("\n2. MISSING RECIPROCAL BACK-LINKS:");
  missingReciprocals.forEach((p) => {
    console.log(
      `  Record ${p.fromId} ("${p.fromTitle}") -> links to ${p.toId} ("${p.toTitle}") as "${p.dir}", but ${p.toId} has no link back.`
    );
  });

  console.log("\n3. DIRECTION MISMATCHES:");
  directionMismatches.forEach((p) => {
    console.log(
      `  Record ${p.fromId} ("${p.fromTitle}") [${p.fromDir}] <-> Record ${p.toId} ("${p.toTitle}") [${p.toDir}]`
    );
  });

  console.log("\n4. SELF LINKS:");
  selfLinks.forEach((p) => {
    console.log(`  Record ${p.id} ("${p.title}") links to itself!`);
  });
}

analyze();
