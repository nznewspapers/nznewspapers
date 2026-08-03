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

  // 1. Add known pre-links fields in exact canonical order
  PRE_LINKS_ORDER.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(paper, key)) {
      orderedObj[key] = paper[key];
    }
  });

  // 2. Add any custom / unexpected fields not in PRE_LINKS_ORDER or POST_LINKS_ORDER (sorted alphabetically)
  Object.keys(paper)
    .filter(
      (k) => !PRE_LINKS_ORDER.includes(k) && !POST_LINKS_ORDER.includes(k)
    )
    .sort()
    .forEach((key) => {
      orderedObj[key] = paper[key];
    });

  // 3. Add links (if present)
  if (Object.prototype.hasOwnProperty.call(paper, "links")) {
    orderedObj.links = paper.links;
  }

  // 4. Add sources (if present, sorted descending)
  if (Object.prototype.hasOwnProperty.call(paper, "sources")) {
    orderedObj.sources = sortSourcesDescending(paper.sources);
  }

  // 5. Add revision (if present)
  if (Object.prototype.hasOwnProperty.call(paper, "revision")) {
    orderedObj.revision = paper.revision;
  }

  return orderedObj;
}

function runCanonicalization() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  let reorderedCount = 0;

  files.forEach((f) => {
    const filePath = path.join(PAPERS_DIR, f);
    const content = fs.readFileSync(filePath, "utf8");
    const paper = JSON.parse(content);

    const canonicalPaper = canonicalizePaperObject(paper);
    const newContent = JSON.stringify(canonicalPaper, null, 2) + "\n";

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      reorderedCount++;
    }
  });

  console.log(
    `\n================================================================================`
  );
  console.log(
    `CANONICAL FIELD ORDER ENFORCED ACROSS ${files.length} PAPER FILES`
  );
  console.log(`- Reordered / Reformatted: ${reorderedCount} files`);
  console.log(
    `================================================================================`
  );
}

runCanonicalization();
