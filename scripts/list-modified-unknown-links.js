const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function run() {
  const diffOutput = execSync("git diff --name-only data/papers/", {
    encoding: "utf8",
  });
  const files = diffOutput
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".json"));

  console.log(`================================================================================`);
  console.log(`SUMMARY OF CHANGED PAPER RECORDS (${files.length} FILES) WITH LOCAL LINKS`);
  console.log(`================================================================================\n`);

  files.forEach((relPath) => {
    const fullPath = path.join(__dirname, "..", relPath);
    const paper = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const id = String(paper.id);

    console.log(`• Record #${id} - "${paper.title}" (${paper.firstYear}–${paper.finalYear}, ${paper.placename || "N/A"})`);
    console.log(`  File: file://${fullPath}`);
    console.log(`  Web:  http://localhost:8080/newspapers/${id}/\n`);
  });
}

run();
