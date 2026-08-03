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

function cleanTitle(t) {
  return (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function runResolution() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();
  const titleMap = new Map();

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papersMap.set(String(paper.id), paper);

    const norm = cleanTitle(paper.title);
    if (norm) {
      if (!titleMap.has(norm)) titleMap.set(norm, []);
      titleMap.get(norm).push(paper);
    }
  });

  const timestamp = new Date().toISOString();
  let resolvedCount = 0;
  let unresolvableCount = 0;

  papersMap.forEach((paper, id) => {
    if (!paper.links) return;

    let modified = false;
    const newLinks = {};

    Object.entries(paper.links).forEach(([key, linkObj]) => {
      if (key.includes("unknown") || key.includes("undefined")) {
        const desc = linkObj["target-description"] || "";
        const cleanDesc = cleanTitle(desc);

        // Try exact match
        let matches = titleMap.get(cleanDesc) || [];

        // If multiple matches, prefer same placename / district
        if (matches.length > 1) {
          const samePlace = matches.filter(
            (m) =>
              m.placename &&
              paper.placename &&
              m.placename.toLowerCase() === paper.placename.toLowerCase()
          );
          if (samePlace.length > 0) matches = samePlace;
        }

        if (matches.length === 1) {
          const targetPaper = matches[0];
          const targetId = String(targetPaper.id);

          newLinks[targetId] = linkObj;
          modified = true;
          resolvedCount++;

          console.log(
            `Resolved [${key}] in #${id} ("${paper.title}") -> #${targetId} ("${targetPaper.title}")`
          );

          // Add reciprocal back-link to targetPaper if missing
          targetPaper.links = targetPaper.links || {};
          if (!targetPaper.links[id]) {
            const isPreceding =
              linkObj.direction === "Preceding" ||
              linkObj.relationship === "Continues";
            const recipDir = isPreceding ? "Succeeding" : "Preceding";
            const recipRel = isPreceding ? "Continued by" : "Continues";

            targetPaper.links[id] = {
              direction: recipDir,
              relationship: recipRel,
              "target-description": paper.title,
            };

            targetPaper.sources = targetPaper.sources || {};
            targetPaper.sources[timestamp] =
              `Added reciprocal ${recipDir} link to record ${id} (${paper.title}).`;
            targetPaper.sources = sortSourcesDescending(targetPaper.sources);

            const targetFile = path.join(PAPERS_DIR, `${targetId}.json`);
            fs.writeFileSync(
              targetFile,
              JSON.stringify(targetPaper, null, 2) + "\n"
            );
          }
        } else {
          // Keep key if unresolvable for now
          newLinks[key] = linkObj;
          unresolvableCount++;
        }
      } else {
        newLinks[key] = linkObj;
      }
    });

    if (modified) {
      paper.links = newLinks;
      paper.sources = paper.sources || {};
      paper.sources[timestamp] =
        "Resolved unknown target placeholder link(s) to numerical record ID(s).";
      paper.sources = sortSourcesDescending(paper.sources);

      const paperFile = path.join(PAPERS_DIR, `${id}.json`);
      fs.writeFileSync(paperFile, JSON.stringify(paper, null, 2) + "\n");
    }
  });

  console.log(
    `\n================================================================================`
  );
  console.log(`UNKNOWN LINK RESOLUTION SUMMARY:`);
  console.log(`- Successfully Resolved & Linked: ${resolvedCount}`);
  console.log(`- Unresolvable Text Placeholders Remaining: ${unresolvableCount}`);
  console.log(
    `================================================================================`
  );
}

runResolution();
