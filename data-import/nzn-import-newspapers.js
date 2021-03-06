// nzn-import-newspapers.js
// Reads newspaper data from a tab-seperated archived data file and writes to JSON files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznImportShared = require("./nzn-import-shared");

var inputFilename = path.join(nznImportShared.inputDir, "newspapers.txt");
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
 * @param  {string} newspaperId New identifier for the newspaper.
 * @param  {string} record Newspaper info in JSON format
 */
function updateNewspaperRecord(newspaperId, record) {
  var newspaper = nznImportShared.readNewspaper(newspaperId);

  // Update with new data:
  newspaper.id = newspaperId;
  if (!newspaper.sources) {
    newspaper.sources = {};
  }
  for (var key in record) {
    if (key == "Id") {
      newspaper.idNZNewspapersV1 = record[key];
    } else if (key == "MARC Control Number") {
      if (record[key]) {
        newspaper.idMarcControlNumber = record[key];
        myDate = new Date("Tue Apr 02 08:58:38 UTC 2013");
        newspaper.sources[myDate.toISOString()] =
          "Extracted from the New Zealand National Bibliography" +
          " (MARC record " +
          newspaper.idMarcControlNumber +
          ") downloaded March 2013.";
      }
    } else if (key == "Current?") {
      newspaper.isCurrent = record[key] == "yes";
    } else if (key == "Current URL") {
      newspaper.urlCurrent = record[key];
    } else if (key == "Digitised URL") {
      newspaper.urlDigitized = record[key];
    } else if (key == "Placecode") {
      if (record[key] == "") {
        newspaper.placecode = "unknown";
      } else {
        newspaper.placecode = record[key];
      }
    } else if (key == "Modified At") {
      // Ignore
    } else if (key == "Modified By") {
      if (record["Modified By"] != "marc-loader-bot") {
        if (record["Modified At"] != "An Unknown Date") {
          const dateModified = new Date(record["Modified At"]);
          newspaper.sources[dateModified.toISOString()] =
            "Modified by " + record["Modified By"];
        }
      }
    } else {
      if (record[key] != "") {
        newKey = nznImportShared.camelize(key);
        newValue = record[key].replace(/  /g, " ");
        newspaper[newKey] = newValue;
      }
    }
  }

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

  var oldIdtoNewId = nznImportShared.readOrCreateOldIdtoNewId(records);

  // Read and re-write the newspaper Json:
  var count = 0;
  var countGenre = {};

  records.forEach(function (arrayItem) {
    count += 1;

    var id = oldIdtoNewId[arrayItem.Id];
    var genre = arrayItem.Genre;
    updateNewspaperRecord(id, arrayItem);

    if (countGenre[genre]) {
      countGenre[genre] += 1;
    } else {
      countGenre[genre] = 1;
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
fs.createReadStream(inputFilename).pipe(newspaperParser);
