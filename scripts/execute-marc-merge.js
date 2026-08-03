const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

const CATEGORY_A_PAIRS = [
  { marcId: 3048, v1Id: 1676 }, // Rotorua Chronicle
  { marcId: 3116, v1Id: 1672 }, // Hot Lakes Chronicle
  { marcId: 3124, v1Id: 1506 }, // Hauraki Plains Gazette
  { marcId: 3135, v1Id: 1735 }, // Hawke's Bay Tribune
  { marcId: 3070, v1Id: 1085 }, // Kaipara Advertiser
  { marcId: 3063, v1Id: 2296 }, // Argus (Lyell)
  { marcId: 3089, v1Id: 1064 }, // Kopuru Bell
  { marcId: 3049, v1Id: 1836 }, // Hawera Star
  { marcId: 3144, v1Id: 2380 }, // Akaroa Mail
];

const CATEGORY_B_PAIRS = [
  { earlierId: 3098, laterId: 2387 }, // Christchurch Star (1929-1935 -> 1958-2005)
  { earlierId: 3138, laterId: 2004 }, // Kapiti Observer (1949-1972 -> 1979-Present)
  { earlierId: 3120, laterId: 2467 }, // Observer (1960-1989 -> 1996-2005)
  { earlierId: 3084, laterId: 1911 }, // Manawatu Evening Standard (1899-1902 -> 1905-1970)
];

function readPaper(id) {
  const filePath = path.join(PAPERS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function writePaper(id, paper) {
  if (paper.sources) {
    paper.sources = sortSourcesDescending(paper.sources);
  }
  const filePath = path.join(PAPERS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(paper, null, 2) + "\n");
}

function runMerge() {
  const timestamp = new Date().toISOString();

  // 1. Process Category A (Merge metadata and sources into V1)
  const dupMap = new Map();
  CATEGORY_A_PAIRS.forEach(({ marcId, v1Id }) => {
    dupMap.set(String(marcId), String(v1Id));

    const marcPaper = readPaper(marcId);
    const v1Paper = readPaper(v1Id);

    if (marcPaper && v1Paper) {
      if (marcPaper.idMarcControlNumber && !v1Paper.idMarcControlNumber) {
        v1Paper.idMarcControlNumber = marcPaper.idMarcControlNumber;
      }
      if (marcPaper.frequency && !v1Paper.frequency) {
        v1Paper.frequency = marcPaper.frequency;
      }

      v1Paper.sources = v1Paper.sources || {};
      v1Paper.sources[timestamp] =
        `Merged metadata from duplicate MARC record ${marcId} into record ${v1Id}.`;

      if (marcPaper.sources) {
        Object.entries(marcPaper.sources).forEach(([time, msg]) => {
          if (
            !msg.includes(
              "Extracted from the New Zealand National Bibliography"
            )
          ) {
            v1Paper.sources[time] = msg;
          }
        });
      }

      writePaper(v1Id, v1Paper);
      console.log(`Merged metadata from #${marcId} into #${v1Id}`);
    }
  });

  // 2. Remap links ONLY in papers that point to duplicate IDs
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));

  files.forEach((f) => {
    const id = f.replace(".json", "");
    const paper = readPaper(id);
    let modified = false;

    if (paper && paper.links) {
      const newLinks = {};
      Object.entries(paper.links).forEach(([targetId, linkObj]) => {
        const remappedTarget = dupMap.get(String(targetId)) || targetId;
        if (remappedTarget !== String(paper.id)) {
          newLinks[remappedTarget] = linkObj;
          if (remappedTarget !== String(targetId)) {
            modified = true;
          }
        } else {
          modified = true;
        }
      });

      if (modified) {
        paper.links = newLinks;
        writePaper(id, paper);
        console.log(`Remapped links in #${id}`);
      }
    }
  });

  // 3. Delete Category A Duplicate JSON files
  CATEGORY_A_PAIRS.forEach(({ marcId }) => {
    const filePath = path.join(PAPERS_DIR, `${marcId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted duplicate file data/papers/${marcId}.json`);
    }
  });

  // 4. Process Category B (Add sequential links between distinct runs)
  CATEGORY_B_PAIRS.forEach(({ earlierId, laterId }) => {
    const earlierPaper = readPaper(earlierId);
    const laterPaper = readPaper(laterId);

    if (earlierPaper && laterPaper) {
      earlierPaper.links = earlierPaper.links || {};
      earlierPaper.links[String(laterId)] = {
        direction: "Succeeding",
        relationship: "Continued by",
        "target-description": laterPaper.title,
      };
      earlierPaper.sources = earlierPaper.sources || {};
      earlierPaper.sources[timestamp] =
        `Added sequential continuation link to later run #${laterId} (${laterPaper.title}).`;
      writePaper(earlierId, earlierPaper);

      laterPaper.links = laterPaper.links || {};
      laterPaper.links[String(earlierId)] = {
        direction: "Preceding",
        relationship: "Continues",
        "target-description": earlierPaper.title,
      };
      laterPaper.sources = laterPaper.sources || {};
      laterPaper.sources[timestamp] =
        `Added sequential continuation link from earlier run #${earlierId} (${earlierPaper.title}).`;
      writePaper(laterId, laterPaper);

      console.log(
        `Linked historical runs #${earlierId} <-> #${laterId} (${earlierPaper.title})`
      );
    }
  });

  console.log(
    "\n✅ MARC merge, deduplication, and selective sources sorting completed!"
  );
}

runMerge();
