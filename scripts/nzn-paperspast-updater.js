// nzn-summarise.js

// This script reads the Papers Past website to build a Papers Past
// coverage datasetm then updates the relevant newspaper data files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznShared = require("./nzn-shared");
const { getSystemErrorMap } = require("util");

// Confirm the required paths and input files:
if (!fs.existsSync(nznShared.oldIdtoNewIdFilename)) {
  console.error("Missing identifier map: " + nznShared.oldIdtoNewIdFilename);
  process.exit(1);
}

const ppFile = path.join(nznShared.scriptDir, "PapersPastNewspaperData.tsv");
if (!fs.existsSync(ppFile)) {
  console.error("Missing Papers Past data: " + ppFile);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log(" * Papers Past file: " + ppFile);
console.log(" * Newspaper data dir: " + nznShared.paperDir);

function logObjectKeys(theObject, label = "Unknown") {
  console.log("Examining " + label + " (" + typeof theObject + "):");

  if (typeof theObject == "object") {
    var theKeys = Object.keys(theObject);
    console.log(theKeys);
    theKeys.forEach(function (key) {
      console.log(" * " + key + " -> " + typeof theObject[key]);
    });
  } else if (typeof theObject == "string") {
    console.log(
      "string, " +
        theObject.length +
        "chars, starts " +
        theObject.substring(0, 16)
    );
  }
}

/**
 * Make a Papers Past URL from a Papers Past newspaper title.
 */
function makePapersPastUrl(title) {
  var baseUrl = "https://paperspast.natlib.govt.nz/newspapers/";
  const space = " +";
  const dash = "-";
  var key = title
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .trim()
    .replaceAll(" ", dash);
  return baseUrl + key;
}

/**
 * Get the complete list of valid newspaper ids.
 * @returns A sorted list of newspaper ids.
 */
function getNewspaperIds() {
  var oldIdtoNewId = nznShared.readOldIdtoNewId();
  return Object.values(oldIdtoNewId).sort();
}

/**
 * Get the complete set of newspaper records.
 * @returns A dict that maps from newspaper Id to a newspaper record.
 */
function getNewspaperRecords() {
  results = {};
  const newspaperIdList = getNewspaperIds();
  for (const id of newspaperIdList) {
    results[id] = nznShared.readNewspaper(id);
  }
  return results;
}

/**
 * Process the Papers Past information records that have been extracted from the data file.
 */
function parsePapersPastRows(err, records) {
  console.log("Start parsePapersPastRows()");

  if (err) {
    console.log("Error parsing TSV data.");
    console.log(err);
    return;
  }

  // Find the records that newspaper data now
  console.log("Reading existing Papers Past data");
  var newspaperRecords = getNewspaperRecords();
  var papersPastCodes = {};
  for (const [key, value] of Object.entries(newspaperRecords)) {
    //console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
    // console.log(key);
    if (newspaperRecords[key].idPapersPastCode) {
      code = newspaperRecords[key].idPapersPastCode;

      if (!papersPastCodes[code]) {
        papersPastCodes[code] = [];
      }
      papersPastCodes[code].push(key);
      console.log(code + " -> " + papersPastCodes[code]);
    }
  }

  // Read and re-write the newspaper Json:
  var count = 0;
  var countGenre = {};

  records.forEach(function (arrayItem) {
    count += 1;

    var code = arrayItem.Code;
    var title = arrayItem.Title;
    var url = makePapersPastUrl(title);
    // console.log(code + " -> " + url);
  });

  console.log("End parsePapersPastRows(): " + count + " records");
  console.log(countGenre);
}
var newspaperParser = parse(
  {
    columns: true,
    delimiter: "\t",
    trim: true,
    skip_empty_lines: true,
  },
  parsePapersPastRows
);

console.log("Starting");
console.log("Starting Parser");
fs.createReadStream(ppFile).pipe(newspaperParser);

console.log("Ending: " + process.argv[1]);