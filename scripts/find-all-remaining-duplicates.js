const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function run() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papers = [];

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papers.push(paper);
  });

  function cleanTitle(t) {
    return (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove macrons
      .replace(/^the\s+/, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  // Group papers by normalized title
  const titleGroups = new Map();
  papers.forEach((p) => {
    const key = cleanTitle(p.title);
    if (!key) return;
    if (!titleGroups.has(key)) titleGroups.set(key, []);
    titleGroups.get(key).push(p);
  });

  const potentialDups = [];

  titleGroups.forEach((group, key) => {
    if (group.length > 1) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const p1 = group[i];
          const p2 = group[j];

          // Rule 1: Distinct MARC IDs mean they are separate National Library cataloguing records
          if (
            p1.idMarcControlNumber &&
            p2.idMarcControlNumber &&
            p1.idMarcControlNumber !== p2.idMarcControlNumber
          ) {
            continue; // Skip distinct MARC records
          }

          // Rule 2: Distinct start years mean separate publication runs/eras
          if (
            p1.firstYear &&
            p2.firstYear &&
            p1.firstYear !== "uuuu" &&
            p2.firstYear !== "uuuu" &&
            p1.firstYear !== p2.firstYear
          ) {
            continue; // Skip distinct start years
          }

          const sameMarc =
            p1.idMarcControlNumber &&
            p2.idMarcControlNumber &&
            p1.idMarcControlNumber === p2.idMarcControlNumber;

          const samePPCode =
            p1.idPapersPastCode &&
            p2.idPapersPastCode &&
            p1.idPapersPastCode === p2.idPapersPastCode;

          const samePlace =
            p1.placename &&
            p2.placename &&
            p1.placename.toLowerCase() === p2.placename.toLowerCase();

          const sameStartYear = p1.firstYear === p2.firstYear;

          if (sameMarc || samePPCode || (samePlace && sameStartYear)) {
            potentialDups.push({
              p1,
              p2,
              samePlace,
              samePPCode,
              sameMarc,
              sameStartYear,
            });
          }
        }
      }
    }
  });

  console.log(
    `================================================================================`
  );
  console.log(
    `STRICT DUPLICATE AUDIT ACROSS ALL ${papers.length} RECORDS`
  );
  console.log(
    `================================================================================\n`
  );

  console.log(
    `Found ${potentialDups.length} strict duplicate pairs:\n`
  );

  potentialDups.forEach(
    ({ p1, p2, samePlace, samePPCode, sameMarc, sameStartYear }) => {
      const reasons = [];
      if (sameMarc) reasons.push("SAME MARC ID");
      if (samePPCode) reasons.push("SAME PAPERS PAST CODE");
      if (samePlace && sameStartYear)
        reasons.push("SAME PLACE & EXACT START YEAR");

      console.log(
        `• Pair: #${p1.id} ["${p1.title}"] (${p1.firstYear}–${p1.finalYear}, ${p1.placename})`
      );
      console.log(
        `    vs  #${p2.id} ["${p2.title}"] (${p2.firstYear}–${p2.finalYear}, ${p2.placename})`
      );
      console.log(`    Reasons: ${reasons.join(", ")}`);
      console.log(
        `    http://localhost:8080/newspapers/${p1.id}/ vs http://localhost:8080/newspapers/${p2.id}/\n`
      );
    }
  );
}

run();
