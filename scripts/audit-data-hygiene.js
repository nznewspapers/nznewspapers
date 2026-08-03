const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function runAudit() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papersMap.set(String(paper.id), paper);
  });

  console.log(`================================================================================`);
  console.log(`REPOSITORY DATA HYGIENE & QUALITY AUDIT (${files.length} PAPERS)`);
  console.log(`================================================================================\n`);

  let missingPlacecode = 0;
  let missingPlacename = 0;
  let invalidYearFormat = 0;
  let brokenUrls = 0;
  let externalTextLinks = 0;

  papersMap.forEach((paper, id) => {
    // 1. Placecode / Placename check
    if (!paper.placecode) missingPlacecode++;
    if (!paper.placename) missingPlacename++;

    // 2. Year Format check (should be 4 digits or 'uuuu'/'9999' or '19uu')
    const y1 = paper.firstYear || "";
    const y2 = paper.finalYear || "";
    if (y1 && !/^\d{4}$|^uuuu$|^\d{2}uu$/.test(y1)) invalidYearFormat++;
    if (y2 && !/^\d{4}$|^9999$|^uuuu$|^\d{2}uu$/.test(y2)) invalidYearFormat++;

    // 3. URLs check
    [paper.urlCurrent, paper.urlDigitized].forEach((url) => {
      if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        brokenUrls++;
      }
    });

    // 4. External text links check
    if (paper.links) {
      Object.keys(paper.links).forEach((k) => {
        if (k.includes("unknown") || k.includes("undefined")) {
          externalTextLinks++;
        }
      });
    }
  });

  console.log(`1. Missing placecode: ${missingPlacecode} records`);
  console.log(`2. Missing placename: ${missingPlacename} records`);
  console.log(`3. Non-standard year formats: ${invalidYearFormat} records`);
  console.log(`4. Malformed URLs: ${brokenUrls} records`);
  console.log(`5. Remaining external text links (not in DB): ${externalTextLinks} links\n`);
}

runAudit();
