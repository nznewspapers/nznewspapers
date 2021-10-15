// nzn-import-links.js
// Reads newspaper linking data and writes to JSON files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznImportShared = require("./nzn-import-shared");

var linkFilename = path.join(nznImportShared.inputDir, "links.txt");
if (!fs.existsSync(linkFilename)) {
  console.error("Missing input file: " + linkFilename);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log("Input file: " + linkFilename);
console.log("Json dir: " + nznImportShared.jsonDir);
console.log("Id file: " + nznImportShared.oldIdtoNewIdFilename);

/**
 * Read (or create) a newspaper JSON file and update it with new data.
 */
function updateNewspaperRecord(sourceId, targetId, record) {
  console.log(sourceId);

  var newspaper = nznImportShared.readNewspaper(sourceId);

  var link = {};
  for (var key in record) {
    if (key == "Id") {
      // link["nzn-link-id"] = record[key];
    } else if (
      key == "Newspaper Id" ||
      key == "Target Id" ||
      key == "Is Auto" ||
      key == "Is Modified"
    ) {
      // Ignore
    } else {
      if (record[key] != "") {
        newKey = key.toLowerCase().replaceAll(" ", "-");
        link[newKey] = record[key];
      }
    }
  }

  console.log(link);
  if (!newspaper.links) {
    newspaper.links = {};
  }
  if (!targetId) {
    targetId = "undefined-" + record["Target Id"];
  }
  newspaper.links[targetId] = link;

  nznImportShared.writeNewspaper(sourceId, newspaper);
}

function parseNewspaperRows(err, records) {
  console.log("Start parseNewspaperRows()");

  if (err) {
    console.log("Error parsing newspaper records.");
    console.log(err);
    return;
  }

  var oldIdtoNewId = nznImportShared.readOldIdtoNewId();

  // Read and re-write the newspaper Json:
  var count = 0;
  var countGenre = {};

  records.forEach(function (arrayItem) {
    count += 1;

    var oldSourceId = arrayItem["Newspaper Id"];
    var oldTargetId = arrayItem["Target Id"];

    if (oldIdtoNewId[oldSourceId]) {
      var sourceId = oldIdtoNewId[oldSourceId];
      var targetId = oldIdtoNewId[oldTargetId];
      updateNewspaperRecord(sourceId, targetId, arrayItem);
    } else {
      // console.log("Skippiing row " + rowId);
    }
  });

  console.log("End parseNewspaperRows(): " + count + " records");
  console.log(countGenre);
}

var newspaperParser = parse(
  {
    columns: true,
    delimiter: "\t",
    trim: true,
    skip_empty_lines: true,
  },
  parseNewspaperRows
);

console.log("Starting Read");
fs.createReadStream(linkFilename).pipe(newspaperParser);
