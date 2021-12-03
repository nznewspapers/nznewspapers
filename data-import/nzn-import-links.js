// nzn-import-links.js
// Reads newspaper linking data and writes to JSON files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznImportShared = require("./nzn-import-shared");

var inputFilename = path.join(nznImportShared.inputDir, "links.txt");
if (!fs.existsSync(inputFilename)) {
  console.error("Missing input file: " + inputFilename);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log("Input file: " + inputFilename);
console.log("Output dir: " + nznImportShared.jsonDir);
console.log("Id file: " + nznImportShared.oldIdtoNewIdFilename);

/**
 * Read (or create) a newspaper JSON file and update it with new data.
 * @param  {string} newspaperId Id of newspaper we're linking from.
 * @param  {string} targetId Id of newspaper we're linking fromto
 * @param  {string} record Link info in JSON format
 */
function updateNewspaperRecord(newspaperId, targetId, record) {
  var newspaper = nznImportShared.readNewspaper(newspaperId);

  // Construct a link record to add to the newspaper:
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

  // Add a link record to the newspaper record:
  // console.log(link);
  if (!newspaper.links) {
    newspaper.links = {};
  }
  if (!targetId) {
    targetId = "undefined-" + record["Target Id"];
  }
  newspaper.links[targetId] = link;

  // Write back the updated newspaper JSON record:
  nznImportShared.writeNewspaper(newspaperId, newspaper);
}

function parseNewspaperRows(err, records) {
  console.log("Start parseNewspaperRows()");

  if (err) {
    console.log("Error parsing CSV data.");
    console.log(err);
    return;
  }

  var oldIdtoNewId = nznImportShared.readOldIdtoNewId();

  // Read and re-write the newspaper Json:
  var count = 0;
  var skipped = 0;

  records.forEach(function (arrayItem) {
    count += 1;

    var oldSourceId = arrayItem["Newspaper Id"];
    var oldTargetId = arrayItem["Target Id"];

    if (oldIdtoNewId[oldSourceId]) {
      var sourceId = oldIdtoNewId[oldSourceId];
      var targetId = oldIdtoNewId[oldTargetId];
      updateNewspaperRecord(sourceId, targetId, arrayItem);
    } else {
      // console.log("Skippiing row (unknown source Id): " + oldSourceId);
      skipped += 1;
    }
  });

  console.log("End parseNewspaperRows(): " + count + " records");
  console.log(
    "End parseNewspaperRows(): " + skipped + " records had an undefined source"
  );
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
fs.createReadStream(inputFilename).pipe(newspaperParser);
