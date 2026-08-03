const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

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

function runExecuteResolution() {
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
  let totalResolved = 0;

  papersMap.forEach((paper, id) => {
    if (!paper.links) return;

    let modified = false;
    const newLinks = {};

    Object.entries(paper.links).forEach(([key, linkObj]) => {
      if (key.includes("unknown") || key.includes("undefined")) {
        const desc = linkObj["target-description"] || "";
        const cleanDesc = cleanTitle(desc);
        const dir = linkObj.direction || linkObj.relationship || "";

        let candidates = titleMap.get(cleanDesc) || [];

        // Disambiguate by Place
        if (candidates.length > 1) {
          const samePlace = candidates.filter(
            (c) =>
              c.placename &&
              paper.placename &&
              c.placename.toLowerCase() === paper.placename.toLowerCase()
          );
          if (samePlace.length > 0) candidates = samePlace;
        }

        // Disambiguate by Dates
        if (candidates.length > 1) {
          const srcStart = Number(paper.firstYear);
          const srcEnd = Number(paper.finalYear);

          const dateMatched = candidates.filter((cand) => {
            const candStart = Number(cand.firstYear);
            const candEnd = Number(cand.finalYear);

            if (dir.toLowerCase().includes("preceding")) {
              return !isNaN(candEnd) && !isNaN(srcStart) && candEnd <= srcStart + 2;
            }
            if (dir.toLowerCase().includes("succeeding")) {
              return !isNaN(candStart) && !isNaN(srcEnd) && candStart >= srcEnd - 2;
            }
            return true;
          });

          if (dateMatched.length > 0) candidates = dateMatched;
        }

        if (candidates.length === 1) {
          const targetPaper = candidates[0];
          const targetId = String(targetPaper.id);

          // Determine type-aware link direction
          let finalDir = linkObj.direction;
          if (paper.genre === "Masthead" || targetPaper.genre === "Masthead") {
            finalDir = paper.genre === "Masthead" ? "Is Masthead Of" : "Has Masthead";
          }

          newLinks[targetId] = {
            ...linkObj,
            direction: finalDir || linkObj.direction || "Succeeding",
          };

          modified = true;
          totalResolved++;

          // Reciprocal back-link on target paper
          targetPaper.links = targetPaper.links || {};
          if (!targetPaper.links[id]) {
            let recipDir = "Preceding";
            let recipRel = "Continues";

            if (finalDir === "Has Masthead") {
              recipDir = "Is Masthead Of";
              recipRel = undefined;
            } else if (finalDir === "Is Masthead Of") {
              recipDir = "Has Masthead";
              recipRel = undefined;
            } else if (finalDir === "Preceding" || linkObj.relationship === "Continues") {
              recipDir = "Succeeding";
              recipRel = "Continued by";
            } else if (finalDir === "Succeeding" || linkObj.relationship === "Continued by") {
              recipDir = "Preceding";
              recipRel = "Continues";
            }

            const recipObj = {
              direction: recipDir,
              "target-description": paper.title,
            };
            if (recipRel) recipObj.relationship = recipRel;
            targetPaper.links[id] = recipObj;

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
          newLinks[key] = linkObj;
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
  console.log(`EXECUTION SUMMARY:`);
  console.log(`- Successfully Resolved & Linked: ${totalResolved} placeholder links`);
  console.log(
    `================================================================================`
  );
}

runExecuteResolution();
