const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function run() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const allPapers = [];
  const v1Papers = []; // Papers with idNZNewspapersV1
  const marcOnlyPapers = []; // Papers with only idMarcControlNumber (no idNZNewspapersV1)

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    allPapers.push(paper);

    if (paper.idNZNewspapersV1) {
      v1Papers.push(paper);
    } else if (paper.idMarcControlNumber) {
      marcOnlyPapers.push(paper);
    }
  });

  console.log(`Total paper records: ${allPapers.length}`);
  console.log(`V1 Records (with idNZNewspapersV1): ${v1Papers.length}`);
  console.log(
    `MARC-only Records (only idMarcControlNumber, no V1 ID): ${marcOnlyPapers.length}\n`
  );

  // Normalize title helper
  function normTitle(t) {
    return (t || "")
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/\[.*?\]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  // Index V1 papers by normalized title
  const v1TitleMap = new Map();
  v1Papers.forEach((p) => {
    const key = normTitle(p.title);
    if (!v1TitleMap.has(key)) v1TitleMap.set(key, []);
    v1TitleMap.get(key).push(p);
  });

  const duplicatesFound = [];
  const uniqueNewPapers = [];

  marcOnlyPapers.forEach((marcPaper) => {
    const key = normTitle(marcPaper.title);
    const candidates = v1TitleMap.get(key) || [];

    // Filter candidates by same or nearby place / overlapping years
    const match = candidates.find((cand) => {
      const samePlace = cand.placename === marcPaper.placename;
      const yearOverlap =
        Math.abs(Number(cand.firstYear) - Number(marcPaper.firstYear)) <= 2 ||
        (cand.finalYear !== "9999" &&
          marcPaper.finalYear !== "9999" &&
          Math.abs(Number(cand.finalYear) - Number(marcPaper.finalYear)) <= 2);
      return samePlace || yearOverlap;
    });

    if (match) {
      duplicatesFound.push({ marcPaper, v1Match: match });
    } else {
      uniqueNewPapers.push(marcPaper);
    }
  });

  console.log(
    `=== DUPLICATE ANALYSIS RESULTS ===`
  );
  console.log(`Total MARC-only records analyzed: ${marcOnlyPapers.length}`);
  console.log(
    `DUPLICATES OF V1 RECORDS: ${duplicatesFound.length}`
  );
  console.log(`GENUINE NEW UNIQUE PAPERS: ${uniqueNewPapers.length}\n`);

  console.log(`--- DETAILED DUPLICATE LIST (${duplicatesFound.length} items) ---`);
  duplicatesFound.forEach(({ marcPaper, v1Match }) => {
    console.log(
      `MARC Record ${marcPaper.id} ["${marcPaper.title}"] (${marcPaper.firstYear}–${marcPaper.finalYear}, ${marcPaper.placename})`
    );
    console.log(
      `  ==> DUP OF V1 Record ${v1Match.id} ["${v1Match.title}"] (${v1Match.firstYear}–${v1Match.finalYear}, ${v1Match.placename})`
    );
    console.log(`  http://localhost:8080/newspapers/${marcPaper.id}/ vs http://localhost:8080/newspapers/${v1Match.id}/\n`);
  });
}

run();
