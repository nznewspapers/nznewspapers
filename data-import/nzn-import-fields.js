// nzn-import-links.js
// Reads newspaper linking data and writes to JSON files.

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");
const nznImportShared = require("./nzn-import-shared");

var inputFilename = path.join(nznImportShared.inputDir, "fields.txt");
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
 * @param  {string} newspaperId Id of newspaper we're updating.
 * @param  {string} record Link info in JSON format
 */
function updateNewspaperRecord(newspaperId, record) {
  var newspaper = nznImportShared.readNewspaper(newspaperId);

  // Construct a fields record to add to the newspaper:
  var fieldId = record["Id"];
  var fieldName = record["Field"];
  var fieldValue = record["Value"];

  if (fieldName != "") {
    fieldName = nznImportShared.camelize(fieldName);
  }

  // Add a fields record to the newspaper record:
  if (fieldName == "papersPastCode") {
    var fieldValue = record["Value"];
    newspaper.idPapersPastCode = fieldValue;
  } else if (fieldName == "note") {
    // There may be multiple note fields:
    if (!newspaper.notes) {
      newspaper.notes = {};
    }
    newspaper.notes[fieldId] = fieldValue;
  } else if (fieldName == "alternateTitle") {
    // There may be multiple alternate titles:
    if (!newspaper.alternateTitle) {
      newspaper.alternateTitle = {};
    }
    newspaper.alternateTitle[fieldId] = fieldValue;
  } else {
    // Otherwise this is a single-value field, store it in the newspaper record:
    if (newspaper[fieldName]) {
      if (fieldValue != newspaper[fieldName]) {
        console.log("Field duplicated " + fieldName + " record " + newspaperId);
        console.log("Field duplicated " + newspaper[fieldName]);
        console.log("Field duplicated " + fieldValue);
      }
    }
    newspaper[fieldName] = fieldValue;
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

  var oldIdtoNewId = nznImportShared.readOldIdtoNewId();

  // Read and re-write the newspaper Json:
  var count = 0;
  var skipped = 0;

  records.forEach(function (arrayItem) {
    count += 1;

    var oldId = arrayItem["Newspaper Id"];

    if (oldIdtoNewId[oldId]) {
      updateNewspaperRecord(oldIdtoNewId[oldId], arrayItem);
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
