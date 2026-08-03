const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

const KNOWN_KEYS = new Set([
  "id",
  "title",
  "genre",
  "firstYear",
  "finalYear",
  "firstIssueDate",
  "finalIssueDate",
  "district",
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
  "links",
  "sources",
  "revision",
]);

const DUPLICATE_PAIRS = [
  { marcId: 3043, v1Id: 1299 },
  { marcId: 3048, v1Id: 1676 },
  { marcId: 3049, v1Id: 1836 },
  { marcId: 3059, v1Id: 2027 },
  { marcId: 3063, v1Id: 2296 },
  { marcId: 3070, v1Id: 1085 },
  { marcId: 3084, v1Id: 1911 },
  { marcId: 3085, v1Id: 1906 },
  { marcId: 3089, v1Id: 1064 },
  { marcId: 3098, v1Id: 2387 },
  { marcId: 3103, v1Id: 1249 },
  { marcId: 3104, v1Id: 1994 },
  { marcId: 3116, v1Id: 1672 },
  { marcId: 3120, v1Id: 2467 },
  { marcId: 3124, v1Id: 1506 },
  { marcId: 3135, v1Id: 1735 },
  { marcId: 3138, v1Id: 2004 },
  { marcId: 3144, v1Id: 2380 },
  { marcId: 3146, v1Id: 1402 },
];

function readPaper(id) {
  const file = path.join(PAPERS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function runAudit() {
  console.log(
    `================================================================================`
  );
  console.log(`AUDITING ${DUPLICATE_PAIRS.length} DUPLICATE MARC PAIRS`);
  console.log(
    `================================================================================\n`
  );

  let totalUnrecognizedKeys = 0;
  let totalCustomSources = 0;

  DUPLICATE_PAIRS.forEach(({ marcId, v1Id }) => {
    const marcPaper = readPaper(marcId);
    const v1Paper = readPaper(v1Id);

    console.log(
      `--------------------------------------------------------------------------------`
    );
    console.log(
      `DUPLICATE PAIR: MARC #${marcId} ["${marcPaper.title}"] vs V1 #${v1Id} ["${v1Paper.title}"]`
    );
    console.log(
      `MARC URL: http://localhost:8080/newspapers/${marcId}/  |  V1 URL: http://localhost:8080/newspapers/${v1Id}/`
    );

    // 1. Check for Unrecognized JSON Keys
    const marcKeys = Object.keys(marcPaper);
    const unrecKeys = marcKeys.filter((k) => !KNOWN_KEYS.has(k));
    if (unrecKeys.length > 0) {
      console.log(
        `  ❌ UNRECOGNIZED KEYS in #${marcId}: ${unrecKeys.join(", ")}`
      );
      totalUnrecognizedKeys += unrecKeys.length;
    } else {
      console.log(`  ✅ Keys Check: All JSON keys are standard.`);
    }

    // 2. Check Sources Field Entries
    const sourcesObj = marcPaper.sources || {};
    const sourceEntries = Object.entries(sourcesObj);
    const nonAutoSources = sourceEntries.filter(([time, msg]) => {
      return (
        !msg.includes(
          "Extracted from the New Zealand National Bibliography"
        ) && !msg.includes("downloaded June 2022")
      );
    });

    if (nonAutoSources.length > 0) {
      console.log(`  ⚠️ CUSTOM SOURCE ENTRIES in #${marcId}:`);
      nonAutoSources.forEach(([time, msg]) =>
        console.log(`     - [${time}]: "${msg}"`)
      );
      totalCustomSources += nonAutoSources.length;
    } else {
      console.log(
        `  ✅ Sources Check: Only standard 2022 MARC import note present.`
      );
    }

    // 3. Field Comparisons
    console.log(`  📋 Field Comparisons & Value Deltas:`);
    const compareFields = [
      "title",
      "genre",
      "firstYear",
      "finalYear",
      "district",
      "region",
      "placename",
      "frequency",
      "idMarcControlNumber",
      "idPapersPastCode",
      "urlDigitized",
      "urlCurrent",
    ];

    compareFields.forEach((field) => {
      const v1Val = v1Paper[field];
      const marcVal = marcPaper[field];

      if (marcVal !== undefined && marcVal !== v1Val) {
        console.log(
          `     • ${field}: V1="${v1Val || "(none)"}" <--> MARC="${marcVal || "(none)"}"`
        );
      }
    });

    console.log(`\n`);
  });

  console.log(
    `================================================================================`
  );
  console.log(`SUMMARY OF AUDIT FINDINGS:`);
  console.log(`- Unrecognized Keys Found Across All 19 MARC Files: ${totalUnrecognizedKeys}`);
  console.log(`- Custom Non-Automated Source Entries Found: ${totalCustomSources}`);
  console.log(
    `================================================================================`
  );
}

runAudit();
