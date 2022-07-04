// nzn-summarise.js

// This script reads the Papers Past website to build a Papers Past
// coverage datasetm then updates the relevant newspaper data files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznShared = require("./nzn-shared");

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
    let theKeys = Object.keys(theObject);
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
  let baseUrl = "https://paperspast.natlib.govt.nz/newspapers/";
  const space = " +";
  const dash = "-";
  let key = title
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .trim()
    .replaceAll(" ", dash);
  return baseUrl + key;
}

/**
 * Update a newspaper record with new Papers Past information.
 * @param {*} id
 * @param {*} papersPastCode
 * @param {*} url
 * @returns True if the newspaper record was updated.
 */
function addPapersPastData(id, papersPastCode, url) {
  let record = nznShared.readNewspaper(id);
  let isUpdated = false;

  // Update the Papers Past code and URL:
  if (record.idPapersPastCode && record.idPapersPastCode == papersPastCode) {
    // do nothing
  } else {
    record.idPapersPastCode = papersPastCode;
    isUpdated = true;
  }
  if (record.urlDigitized && record.urlDigitized == url) {
    // do nothing
  } else {
    record.urlDigitized = url;
    isUpdated = true;
  }

  // Update the paper if we made any changes.
  if (isUpdated) {
    nznShared.writeNewspaper(
      id,
      record,
      "Updated Papers Past info using the nzn-paperspast-updater.js script."
    );
  }
  return isUpdated;
}

/**
 * Update a list of newspaper records with new Papers Past information.
 * @param {*} idList The list of newspaper ids to be updated.
 * @param {*} papersPastCode
 * @param {*} url
 * @returns The number of newspaper records updated.
 */
function addPapersPastDataList(idList, papersPastCode, url) {
  updates = 0;
  for (id of idList) {
    if (addPapersPastData(id, papersPastCode, url)) {
      updates++;
    }
  }
  return updates;
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
  console.log("Scanning existing records for Papers Past ids");

  let newspaperRecords = nznShared.getNewspaperRecords();
  let papersPastTitles = {};
  let papersPastCodes = {};
  for (const [key, value] of Object.entries(newspaperRecords)) {
    // Save the title:
    title = newspaperRecords[key].title;
    if (!papersPastTitles[title]) {
      papersPastTitles[title] = [];
    }
    papersPastTitles[title].push(key);

    // Save the code:
    if (newspaperRecords[key].idPapersPastCode) {
      code = newspaperRecords[key].idPapersPastCode;
      if (!papersPastCodes[code]) {
        papersPastCodes[code] = [];
      }
      papersPastCodes[code].push(key);
    }
  }

  // Read and re-write the newspaper Json:
  console.log("Reading the Papers Past data file");

  let count = 0;
  let countCodeMatch = 0;
  let countTitleMatch = 0;
  let countNoMatch = 0;
  let countUpdates = 0;

  records.forEach(function (arrayItem) {
    count += 1;

    let code = arrayItem.Code;
    let title = arrayItem.Title;
    let url = makePapersPastUrl(title);
    // console.log(code + " -> " + url);

    if (papersPastCodes[code]) {
      console.log("Match code, update URL for " + code + " (" + title + ")");
      countCodeMatch++;
      countUpdates += addPapersPastDataList(papersPastCodes[code], code, url);
    } else if (papersPastTitles[title]) {
      console.log("Match title, add code and URL for: " + title);
      countTitleMatch++;
      countUpdates += addPapersPastDataList(papersPastTitles[title], code, url);
    } else {
      console.log("New code / new title: " + code + " / " + title);
      countNoMatch++;
    }
  });

  console.log("End parsePapersPastRows(): " + count + " records");
  console.log("* Code matches: " + countCodeMatch + " records");
  console.log("* Title matches: " + countTitleMatch + " records");
  console.log("* No match: " + countNoMatch + " records");
  console.log("* Total updates: " + countUpdates + " records");
}

const newspaperParser = parse(
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
