// nzn-import-newspapers.js
// Reads newspaper data from a tab-seperated archived data file and writes to JSON files.

var fs = require("fs");
var parse = require("csv-parse");
var nznImportShared = require("./nzn-import-shared");

var newspaperFilename = nznImportShared.inputDirectory + "/newspapers.txt";
if (!fs.existsSync(newspaperFilename)) {
  console.error("Missing input file: " + newspaperFilename);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log("Input dir: " + nznImportShared.inputDirectory);
console.log("Input file: " + newspaperFilename);
console.log("Output dir: " + nznImportShared.jsonDirectory);
console.log("Id file: " + nznImportShared.oldIdtoNewIdFilename);

/**
 * Read (or create) a newspaper JSON file and update it with new data.
 * @param  {string} newspaperId Runnig newspaper index (id number)
 * @param  {string} record Newspaper info in JSON format
 */
function updateNewspaperRecord(newspaperId, record) {
  var id = newspaperId;

  // Read any existing record:
  var filename = nznImportShared.jsonDirectory + "/" + id + ".json";
  var newspaper = nznImportShared.readJsonDictSync(filename);

  // Update with new data:
  newspaper["id"] = newspaperId;
  for (var key in record) {
    // console.log(key);
    if (key == "Id") {
      newspaper["id-nzn-v1"] = record[key];
    } else if (key == "MARC Control Number") {
      newspaper["id-marc-control-number"] = record[key];
    } else if (key == "Current?") {
      newspaper["is-current"] = record[key];
    } else if (key == "Placecode") {
      newspaper["nzn-placecode"] = record[key];
    } else if (key == "Modified At" || key == "Modified By") {
      // Ignore
    } else {
      if (record[key] != "") {
        newKey = key.toLowerCase().replaceAll(" ", "-");
        newspaper[newKey] = record[key];
      }
    }
  }

  if (newspaper.revision) {
    newspaper.revision += 1;
  } else {
    newspaper.revision = 1;
  }

  // Write an individual JSON record:
  nznImportShared.writeJsonDict(newspaper, filename);
}

function parseNewspaperRows(err, records) {
  console.log("Start parseNewspaperRows()");

  if (err) {
    //handle error
    console.log("Error parsing newspaper records.");
    console.log(err);
    return;
  }

  var oldIdtoNewId = nznImportShared.readOrCreateOldIdtoNewId(records);

  // Read and re-write the newspaper Json:
  var count = 0;
  var countGenre = {};

  records.forEach(function (arrayItem, arrayIndex) {
    count += 1;

    var genre = arrayItem.Genre;
    var id = oldIdtoNewId[arrayItem.Id];
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
fs.createReadStream(newspaperFilename).pipe(newspaperParser);
