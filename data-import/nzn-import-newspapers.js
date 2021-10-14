// nznimport-newspapers.js
// Reads newspaper data from a tab-seperated archived data file and writes to JSON files.

var fs = require("fs");
var parse = require("csv-parse");

var inputDirectory = process.cwd() + "/data-import/2015-02-01-nznewspapers";
var jsonDirectory = process.cwd() + "/docs/data/json";

if (process.argv[2]) {
  inputDirectory = process.argv[2];
  if (process.argv[3]) {
    jsonDirectory = process.argv[3];
  }
}

var newspaperFilename = inputDirectory + "/newspapers.txt";
if (!fs.existsSync(newspaperFilename)) {
  console.error("Missing input file: " + newspaperFilename);
  process.exit(1);
}

var oldIdtoNewIdFilename = jsonDirectory + "/old_id_to_new_id.txt";

console.log("Running: " + process.argv[1]);
console.log("Input dir: " + inputDirectory);
console.log("Input file: " + newspaperFilename);
console.log("Output dir: " + jsonDirectory);

if (!fs.existsSync(jsonDirectory)) {
  fs.mkdirSync(jsonDirectory, { recursive: true });
}

/**
 * Read a JSON file to a dict or die trying.
 */
function readJsonDictSync(filename) {
  var result = {};
  try {
    if (fs.existsSync(filename)) {
      result = JSON.parse(fs.readFileSync(filename));
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  return result;
}

/**
 * Write a dict to a JSON file or die trying (async).
 */
function writeJsonDict(dict, filename) {
  const jsonString = JSON.stringify(dict, null, 2);

  fs.writeFile(filename, jsonString, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

/**
 * Read (or create) a newspaper JSON file and update it with new data.
 * @param  {string} index Runnig newspaper index (id number)
 * @param  {string} record Newspaper info in JSON format
 */
function updateNewspaperRecord(index, record) {
  var id = index;

  // Read any existing record:
  var filename = jsonDirectory + "/" + id + ".json";
  var newspaper = readJsonDictSync(filename);

  // Update with new data:
  newspaper["id"] = index;
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
  writeJsonDict(newspaper, filename);
}

function parseNewspaperRows(err, records) {
  console.log("Start parseNewspaperRows()");

  if (err) {
    //handle error
    console.log("Error parsing newspaper records.");
    console.log(err);
    return;
  }

  // Read the mapping from old Id to new Id:
  var oldIdtoNewId = readJsonDictSync(oldIdtoNewIdFilename);
  if (oldIdtoNewId && Object.keys(oldIdtoNewId).length > 0) {
    console.log("Read " + oldIdtoNewIdFilename);
  } else {
    console.log("Creating " + oldIdtoNewIdFilename);
    count = 1000;
    records.forEach(function (arrayItem) {
      count++;
      oldIdtoNewId[arrayItem.Id] = count;
    });
    writeJsonDict(oldIdtoNewId, oldIdtoNewIdFilename);
  }

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
