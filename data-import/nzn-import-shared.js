// nzn-import-shared.js
// Common functions and paths for importing data.

const fs = require("fs");
const path = require("path");

exports.inputDir = path.join(
  process.cwd(),
  "data-import",
  "2015-02-01-nznewspapers"
);
exports.jsonDir = path.join(process.cwd(), "docs", "data");
exports.paperDir = path.join(exports.jsonDir, "papers");

exports.oldIdtoNewIdFilename = path.join(
  exports.jsonDir,
  "old_id_to_new_id.json"
);

/**
 * Convert a string to camelCase, as per https://stackoverflow.com/a/2970667
 * @param {string} String to convert
 * @returns camelized string.
 */
exports.camelize = function (str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

/**
 * Read a JSON file to a dict or die trying.
 */
exports.readJsonDictSync = function (filename) {
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
};

/**
 * Write a dict to a JSON file or die trying (async).
 */
exports.writeJsonDict = function (dict, filename) {
  const jsonString = JSON.stringify(dict, null, 2);

  // Make sure the folder exists:
  var dirName = path.dirname(filename);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  // Write the file:
  fs.writeFileSync(filename, jsonString, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
};

/**
 * Read the data for one newspaper.
 */
exports.readNewspaper = function (id) {
  const filename = path.join(exports.paperDir, id + ".json");
  return exports.readJsonDictSync(filename);
};

/**
 * Write the data for one newspaper.
 */
exports.writeNewspaper = function (id, record) {
  const filename = path.join(exports.paperDir, id + ".json");

  newRecord = {};

  // Add the entries we want to appear first:
  newRecord.id = record.id;
  newRecord.title = record.title;
  newRecord.genre = record.genre;
  newRecord.firstYear = record.firstYear;
  newRecord.finalYear = record.finalYear;

  // Add all the entries in alphabeticl order:
  var keys = Object.keys(record).sort();
  keys.forEach(function (key) {
    if (typeof record[key] != "string" || record[key] != "") {
      newRecord[key] = record[key];
    }
  });

  // Re-insert the entries that we want to appear last:
  if (newRecord.notes) {
    delete newRecord.notes;
    newRecord.notes = record.notes;
  }

  if (newRecord.links) {
    delete newRecord.links;
    newRecord.links = record.links;
  }

  if (newRecord.sources) {
    delete newRecord.sources;
    newRecord.sources = record.sources;
  }

  if (newRecord.revision) {
    delete newRecord.revision;
    newRecord.revision = record.revision + 1;
  } else {
    newRecord.revision = 1;
  }

  exports.writeJsonDict(newRecord, filename);
};

/**
 * Read the mapping from old ids to new ids.
 */
exports.readOldIdtoNewId = function () {
  return exports.readJsonDictSync(exports.oldIdtoNewIdFilename);
};

var compareFunction = function (a, b) {
  // sort by genre, nzn-placecode, then by first-year, then by final-year, then by title
  placeA = a["Placecode"] || "unspecified";
  placeB = b["Placecode"] || "unspecified";

  genrePriority = {
    Newspaper: 1,
    Masthead: 1,
    "Weekly Edition": 1,
    "Alternate Edition": 1,
    "Weekend Edition": 1,
    "Minor Edition": 1,
    Periodical: 2,
    Other: 3,
    Unknown: 3,
    Duplicate: 3,
  };
  genreA = genrePriority[a["Genre"]];
  genreB = genrePriority[b["Genre"]];

  if (genreA === genreB) {
    if (placeA === placeB) {
      if (a["First year"] === b["First year"]) {
        if (a["Final year"] === b["Final year"]) {
          return a["Title"].localeCompare(b["Title"]);
        }
        return a["Final year"].localeCompare(b["Final year"]);
      }
      return a["First year"].localeCompare(b["First year"]);
    }
    return placeA.localeCompare(placeB);
  }
  return genreA < genreB ? -1 : 1;
};

/**
 * Read the mapping from old ids to new ids, or create it if it doesn't exist.
 */
exports.readOrCreateOldIdtoNewId = function (records) {
  var oldIdtoNewId = exports.readJsonDictSync(exports.oldIdtoNewIdFilename);

  if (oldIdtoNewId && Object.keys(oldIdtoNewId).length > 0) {
    return oldIdtoNewId;
  }

  console.log("Sorting " + records.length + " records");
  records.sort(compareFunction);

  console.log("Creating " + exports.oldIdtoNewIdFilename);
  count = 1000;
  records.forEach(function (arrayItem) {
    count++;
    oldIdtoNewId[arrayItem.Id] = count;
  });

  exports.writeJsonDict(oldIdtoNewId, exports.oldIdtoNewIdFilename);
  return oldIdtoNewId;
};
