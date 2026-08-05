const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function run() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papers = [];
  const titleMap = new Map(); // normalized title -> paper

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papers.push(paper);

    const norm = paper.title.toLowerCase().trim();
    if (!titleMap.has(norm)) titleMap.set(norm, []);
    titleMap.get(norm).push(paper);
  });

  const unknownRecords = papers.filter(
    (p) =>
      p.links &&
      Object.keys(p.links).some(
        (k) => k.includes("unknown") || k.includes("undefined")
      )
  );

  console.log(`Found ${unknownRecords.length} records with unknown-X links.\n`);

  unknownRecords.forEach((paper) => {
    console.log(
      `--------------------------------------------------------------------------------`
    );
    console.log(
      `Source Paper: [${paper.title}] (${paper.firstYear}–${paper.finalYear}) -> http://localhost:8080/newspapers/${paper.id}/`
    );
    console.log(`Location: ${paper.placename || "Unknown"}`);

    Object.entries(paper.links).forEach(([key, link]) => {
      if (key.includes("unknown") || key.includes("undefined")) {
        const desc = link["target-description"] || "";
        const dir = link.direction || link.relationship || "";

        // Attempt match
        const cleanDesc = desc
          .replace(/\s*\([^)]*\)/g, "")
          .toLowerCase()
          .trim();
        let matches = titleMap.get(cleanDesc) || [];

        if (matches.length === 0) {
          // Try fuzzy match
          matches = papers.filter((p) =>
            p.title.toLowerCase().includes(cleanDesc)
          );
        }

        console.log(`  • Link [${key}]: "${dir}" -> "${desc}"`);
        if (matches.length > 0) {
          matches.forEach((m) => {
            console.log(
              `    MATCH: [${m.title}] (${m.firstYear}–${m.finalYear}) at ${m.placename} -> http://localhost:8080/newspapers/${m.id}/`
            );
          });
        } else {
          console.log(`    NO MATCHING RECORD FOUND IN DATABASE`);
        }
      }
    });
  });
}

run();
