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

function runDryRun() {
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

  const type1NewspaperMatches = [];
  const type2MastheadMatches = [];
  const type3PeriodicalMatches = [];
  const unresolvableExternal = [];

  papersMap.forEach((paper, id) => {
    if (!paper.links) return;

    Object.entries(paper.links).forEach(([key, linkObj]) => {
      if (key.includes("unknown") || key.includes("undefined")) {
        const desc = linkObj["target-description"] || "";
        const cleanDesc = cleanTitle(desc);
        const dir = linkObj.direction || linkObj.relationship || "";

        let candidates = titleMap.get(cleanDesc) || [];

        // 1. Disambiguate by Place (placename or district)
        if (candidates.length > 1) {
          const samePlace = candidates.filter(
            (c) =>
              c.placename &&
              paper.placename &&
              c.placename.toLowerCase() === paper.placename.toLowerCase()
          );
          if (samePlace.length > 0) candidates = samePlace;
        }

        // 2. Disambiguate by Type-Aware Dates
        if (candidates.length > 1) {
          const srcStart = Number(paper.firstYear);
          const srcEnd = Number(paper.finalYear);

          const dateMatched = candidates.filter((cand) => {
            const candStart = Number(cand.firstYear);
            const candEnd = Number(cand.finalYear);

            if (dir.toLowerCase().includes("preceding")) {
              // Preceding candidate should end before or near source start
              return !isNaN(candEnd) && !isNaN(srcStart) && candEnd <= srcStart + 2;
            }
            if (dir.toLowerCase().includes("succeeding")) {
              // Succeeding candidate should start after or near source end
              return !isNaN(candStart) && !isNaN(srcEnd) && candStart >= srcEnd - 2;
            }
            return true;
          });

          if (dateMatched.length > 0) candidates = dateMatched;
        }

        const matchInfo = {
          sourcePaper: paper,
          key,
          desc,
          dir,
          matches: candidates,
        };

        if (candidates.length === 1) {
          const match = candidates[0];
          if (paper.genre === "Newspaper" && match.genre === "Newspaper") {
            type1NewspaperMatches.push(matchInfo);
          } else if (paper.genre === "Masthead" || match.genre === "Masthead") {
            type2MastheadMatches.push(matchInfo);
          } else {
            type3PeriodicalMatches.push(matchInfo);
          }
        } else {
          unresolvableExternal.push(matchInfo);
        }
      }
    });
  });

  console.log(`================================================================================`);
  console.log(`DRY-RUN ANALYSIS OF UNKNOWN PLACEHOLDER LINKS`);
  console.log(`================================================================================\n`);

  console.log(`TYPE 1: Newspaper-to-Newspaper Matches (High Priority): ${type1NewspaperMatches.length}`);
  console.log(`TYPE 2: Newspaper-to-Masthead Matches: ${type2MastheadMatches.length}`);
  console.log(`TYPE 3: Periodicals & Other Serial Matches: ${type3PeriodicalMatches.length}`);
  console.log(`EXTERNAL / UNRESOLVED (Not in Database): ${unresolvableExternal.length}\n`);

  console.log(`--- TYPE 1 DETAILS (Newspaper <-> Newspaper) ---`);
  type1NewspaperMatches.forEach(({ sourcePaper, key, desc, dir, matches }) => {
    const m = matches[0];
    console.log(
      `Source #${sourcePaper.id} ["${sourcePaper.title}"] (${sourcePaper.firstYear}–${sourcePaper.finalYear}, ${sourcePaper.placename})`
    );
    console.log(`  Link [${key}]: "${dir}" -> "${desc}"`);
    console.log(
      `  MATCH: #${m.id} ["${m.title}"] (${m.firstYear}–${m.finalYear}, ${m.placename})`
    );
    console.log(
      `  URLs: http://localhost:8080/newspapers/${sourcePaper.id}/ vs http://localhost:8080/newspapers/${m.id}/\n`
    );
  });

  console.log(`--- TYPE 2 DETAILS (Newspaper <-> Masthead) ---`);
  type2MastheadMatches.forEach(({ sourcePaper, key, desc, dir, matches }) => {
    const m = matches[0];
    console.log(
      `Source #${sourcePaper.id} ["${sourcePaper.title}"] (genre: ${sourcePaper.genre})`
    );
    console.log(`  Link [${key}]: "${dir}" -> "${desc}"`);
    console.log(`  MATCH: #${m.id} ["${m.title}"] (genre: ${m.genre})\n`);
  });

  console.log(`--- TYPE 3 DETAILS (Periodicals / Other) ---`);
  type3PeriodicalMatches.forEach(({ sourcePaper, key, desc, dir, matches }) => {
    const m = matches[0];
    console.log(
      `Source #${sourcePaper.id} ["${sourcePaper.title}"] (genre: ${sourcePaper.genre})`
    );
    console.log(`  Link [${key}]: "${dir}" -> "${desc}"`);
    console.log(`  MATCH: #${m.id} ["${m.title}"] (genre: ${m.genre})\n`);
  });
}

runDryRun();
