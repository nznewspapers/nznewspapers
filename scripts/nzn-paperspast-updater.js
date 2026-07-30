// scripts/nzn-paperspast-updater.js
// 1-Step Unified Papers Past Live Fetcher & Dataset Updater
// Fetches live Papers Past titles over HTTPS, updates data/papers/*.json records,
// and syncs scripts/PapersPastNewspaperData.tsv with status tracking.

const fs = require("fs");
const path = require("path");
const https = require("https");
const parse = require("csv-parse/lib/sync");
const nznShared = require("./nzn-shared");

console.log("==================================================");
console.log("  Newspapers of New Zealand — Papers Past Updater");
console.log("==================================================");

const tsvFile = path.join(nznShared.scriptDir, "PapersPastNewspaperData.tsv");

// Helper to normalize strings for comparison
function cleanTitle(t) {
  if (!t) return "";
  return t
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

// Known Out-Of-Scope titles (non-NZ serials per scope guidelines)
const knownOutOfScopeCodes = new Set(["STSSA", "STSSG", "SWH", "SAMZ", "SAMREP"]);

// Helper to generate clean Papers Past URLs
function makePapersPastUrl(slug) {
  return `https://paperspast.natlib.govt.nz/newspapers/${slug}`;
}

// 1. Fetch live Papers Past titles over HTTPS
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    };

    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      })
      .on("error", (err) => reject(err));
  });
}

// Load existing TSV file as baseline fallback
function loadExistingTsv() {
  const existingMap = new Map();
  if (fs.existsSync(tsvFile)) {
    try {
      const tsvContent = fs.readFileSync(tsvFile, "utf8");
      const records = parse(tsvContent, {
        columns: true,
        delimiter: "\t",
        trim: true,
        skip_empty_lines: true,
      });
      records.forEach((row) => {
        if (row.Code) {
          existingMap.set(row.Code.toUpperCase().trim(), row);
        }
      });
    } catch (e) {
      console.warn("Notice: Could not parse existing TSV file, starting fresh.");
    }
  }
  return existingMap;
}

async function run() {
  const existingTsvMap = loadExistingTsv();

  // Load repository JSON records
  console.log("Reading repository newspaper records from data/papers/ ...");
  const newspaperRecords = nznShared.getNewspaperRecords();
  const papersByTitle = new Map();
  const papersByCode = new Map();

  for (const [id, paper] of Object.entries(newspaperRecords)) {
    const titleKey = cleanTitle(paper.title);
    if (!papersByTitle.has(titleKey)) {
      papersByTitle.set(titleKey, []);
    }
    papersByTitle.get(titleKey).push(id);

    if (paper.idPapersPastCode) {
      const codeKey = paper.idPapersPastCode.toUpperCase().trim();
      if (!papersByCode.has(codeKey)) {
        papersByCode.set(codeKey, []);
      }
      papersByCode.get(codeKey).push(id);
    }
  }

  // Fetch live Papers Past titles
  console.log("Fetching live Papers Past index from https://paperspast.natlib.govt.nz/newspapers ...");
  let liveList = [];
  try {
    const res = await fetchUrl("https://paperspast.natlib.govt.nz/newspapers");
    if (res.status === 200 && !res.body.includes("_Incapsula_Resource")) {
      const linkRegex = /href="\/newspapers\/([a-z0-9-]+)"[^>]*>([^<]+)<\/a>/gi;
      const seenSlugs = new Set();
      let match;
      while ((match = linkRegex.exec(res.body)) !== null) {
        const slug = match[1];
        const rawTitle = match[2].trim();
        const decodedTitle = rawTitle.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        if (["all", "by-region", "search", "about", "last-text-corrections"].includes(slug)) continue;
        if (!seenSlugs.has(slug) && decodedTitle.length > 0) {
          seenSlugs.add(slug);
          liveList.push({ slug, title: decodedTitle });
        }
      }
      console.log(`✅ Live fetch successful! Found ${liveList.length} titles on front page.`);
    }
  } catch (e) {
    console.warn("Notice: Live HTTPS fetch encountered an issue, relying on offline TSV dataset.");
  }

  // Merge live items with existing TSV records so no historic codes are lost
  const allTargetRecords = new Map();

  // First seed with existing TSV records
  existingTsvMap.forEach((row, code) => {
    allTargetRecords.set(code, {
      code: code,
      title: row.Title,
      status: row.Status || "UNLINKED",
      targetPaperIds: row.TargetPaperIds || "",
      notes: row.Notes || "",
      liveSlug: null,
    });
  });

  // Supplement with live fetched records (which contain authoritative href slugs)
  liveList.forEach((item) => {
    let matchedCode = null;
    // Check if title matches existing TSV
    for (const [code, row] of existingTsvMap.entries()) {
      if (cleanTitle(row.Title) === cleanTitle(item.title)) {
        matchedCode = code;
        break;
      }
    }

    if (matchedCode && allTargetRecords.has(matchedCode)) {
      const rec = allTargetRecords.get(matchedCode);
      rec.title = item.title;
      rec.liveSlug = item.slug;
    }
  });

  // Match against repository JSON records and apply updates
  console.log("\nMatching Papers Past records against data/papers/*.json ...");
  let jsonUpdatesCount = 0;
  let linkedCount = 0;
  let outOfScopeCount = 0;
  let unlinkedCount = 0;

  const updatedTsvRows = [];

  allTargetRecords.forEach((entry, code) => {
    let matchedIds = new Set();

    // Check code match first
    if (papersByCode.has(code)) {
      papersByCode.get(code).forEach((id) => matchedIds.add(id));
    }
    // Check title match ONLY for papers that do not already have a different code assigned
    const titleKey = cleanTitle(entry.title);
    if (papersByTitle.has(titleKey)) {
      papersByTitle.get(titleKey).forEach((id) => {
        const p = newspaperRecords[id];
        if (!p.idPapersPastCode || p.idPapersPastCode === code) {
          matchedIds.add(id);
        }
      });
    }

    const matchedIdArray = Array.from(matchedIds).sort((a, b) => Number(a) - Number(b));
    // Use exact live href slug if available, otherwise fallback to title slug
    const urlSlug = entry.liveSlug || cleanTitle(entry.title).replace(/\s+/g, "-");
    const urlDigitized = makePapersPastUrl(urlSlug);

    // Determine status
    if (knownOutOfScopeCodes.has(code) || entry.notes.toLowerCase().includes("non-nz")) {
      entry.status = "OUT_OF_SCOPE";
      entry.targetPaperIds = "";
      if (!entry.notes) entry.notes = "Excluded: Non-NZ serial per Scope guidelines";
      outOfScopeCount++;
    } else if (matchedIdArray.length > 0) {
      entry.status = "LINKED";
      entry.targetPaperIds = matchedIdArray.join(", ");
      if (!entry.notes) entry.notes = `Linked to ${matchedIdArray.length} paper record(s)`;
      linkedCount++;

      // Update JSON files
      matchedIdArray.forEach((id) => {
        const paperRecord = nznShared.readNewspaper(id);
        let recordChanged = false;

        if (paperRecord.idPapersPastCode !== code) {
          paperRecord.idPapersPastCode = code;
          recordChanged = true;
        }
        if (!paperRecord.urlDigitized) {
          paperRecord.urlDigitized = urlDigitized;
          recordChanged = true;
        }

        if (recordChanged) {
          nznShared.writeNewspaper(
            id,
            paperRecord,
            "Updated Papers Past info using the nzn-paperspast-updater.js script."
          );
          jsonUpdatesCount++;
        }
      });
    } else {
      entry.status = "UNLINKED";
      entry.targetPaperIds = "";
      if (!entry.notes) entry.notes = "In-scope NZ paper; no matching JSON record in data/papers/ yet";
      unlinkedCount++;
    }

    updatedTsvRows.push(entry);
  });

  // Write updated TSV audit log
  console.log(`\nWriting updated audit log to ${tsvFile} ...`);
  const tsvHeader = "Code\tTitle\tStatus\tTargetPaperIds\tNotes\n";
  const tsvLines = updatedTsvRows
    .map((r) => `${r.code}\t${r.title}\t${r.status}\t${r.targetPaperIds}\t${r.notes}`)
    .join("\n");

  fs.writeFileSync(tsvFile, tsvHeader + tsvLines + "\n", "utf8");

  console.log("\n==================================================");
  console.log("  Papers Past Update Completed Successfully!");
  console.log("==================================================");
  console.log(`* Total TSV Audit Records Processed: ${updatedTsvRows.length}`);
  console.log(`* Linked Titles (Matched to JSON): ${linkedCount}`);
  console.log(`* Out-Of-Scope Titles (Excluded): ${outOfScopeCount}`);
  console.log(`* Unlinked Titles (Needs JSON Record): ${unlinkedCount}`);
  console.log(`* Total JSON File Updates Written: ${jsonUpdatesCount}`);
  console.log("==================================================");
}

run();
