const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

const PRE_LINKS_ORDER = [
  "id",
  "title",
  "genre",
  "firstYear",
  "finalYear",
  "district",
  "firstIssueDate",
  "finalIssueDate",
  "frequency",
  "idMarcControlNumber",
  "idNZNewspapersV1",
  "idPapersPastCode",
  "isCurrent",
  "placecode",
  "placename",
  "price",
  "region",
  "urlCurrent",
  "urlDigitized",
];

const POST_LINKS_ORDER = ["links", "sources", "revision"];

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

function canonicalizePaperObject(paper) {
  const orderedObj = {};

  PRE_LINKS_ORDER.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(paper, key)) {
      orderedObj[key] = paper[key];
    }
  });

  Object.keys(paper)
    .filter(
      (k) => !PRE_LINKS_ORDER.includes(k) && !POST_LINKS_ORDER.includes(k)
    )
    .sort()
    .forEach((key) => {
      orderedObj[key] = paper[key];
    });

  if (Object.prototype.hasOwnProperty.call(paper, "links")) {
    orderedObj.links = paper.links;
  }
  if (Object.prototype.hasOwnProperty.call(paper, "sources")) {
    orderedObj.sources = sortSourcesDescending(paper.sources);
  }
  if (Object.prototype.hasOwnProperty.call(paper, "revision")) {
    orderedObj.revision = paper.revision;
  }

  return orderedObj;
}

function getReciprocalDirection(dir, rel) {
  const d = (dir || "").toLowerCase();
  const r = (rel || "").toLowerCase();

  if (d.includes("edition") || r.includes("edition")) {
    return {
      direction: d.includes("has edition") ? "Is Edition Of" : "Has Edition",
      relationship: "Parallel Edition",
    };
  }
  if (d.includes("masthead") || r.includes("masthead")) {
    return {
      direction: d.includes("has masthead") ? "Is Masthead Of" : "Has Masthead",
      relationship: undefined,
    };
  }

  if (d === "preceding" || d === "continues" || r.includes("continues")) {
    return { direction: "Succeeding", relationship: "Continued by" };
  }
  if (
    d === "succeeding" ||
    d === "continued by" ||
    r.includes("continued by") ||
    r.includes("merged into")
  ) {
    return { direction: "Preceding", relationship: "Continues" };
  }

  return { direction: "Preceding", relationship: "Continues" };
}

function runFixReciprocals() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papersMap.set(String(paper.id), paper);
  });

  const timestamp = new Date().toISOString();
  let addedCount = 0;

  papersMap.forEach((paperA, idA) => {
    if (!paperA.links) return;

    Object.entries(paperA.links).forEach(([idB, linkAB]) => {
      if (idA === idB) return;
      if (idB.includes("unknown") || idB.includes("undefined")) return;

      const paperB = papersMap.get(idB);
      if (!paperB) return;

      paperB.links = paperB.links || {};

      if (!paperB.links[idA]) {
        const recipInfo = getReciprocalDirection(
          linkAB.direction,
          linkAB.relationship
        );

        const newLink = {
          direction: recipInfo.direction,
          "target-description": paperA.title,
        };
        if (recipInfo.relationship) {
          newLink.relationship = recipInfo.relationship;
        }

        paperB.links[idA] = newLink;

        paperB.sources = paperB.sources || {};
        paperB.sources[timestamp] =
          `Added reciprocal ${recipInfo.direction} link to record ${idA} (${paperA.title}).`;

        const canonicalB = canonicalizePaperObject(paperB);
        const filePathB = path.join(PAPERS_DIR, `${idB}.json`);
        fs.writeFileSync(filePathB, JSON.stringify(canonicalB, null, 2) + "\n");

        addedCount++;
        console.log(
          `Added reciprocal link in #${idB} ("${paperB.title}") pointing to #${idA} ("${paperA.title}")`
        );
      }
    });
  });

  console.log(
    `\n================================================================================`
  );
  console.log(
    `MISSING RECIPROCAL LINKS RESOLVED: ${addedCount} back-links added`
  );
  console.log(
    `================================================================================`
  );
}

runFixReciprocals();
