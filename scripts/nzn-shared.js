// nzn-shared.js
// Common functions and paths for processing nespaper data.

const fs = require("fs");
const path = require("path");

exports.jsonDir = path.join(process.cwd(), "docs", "data");
exports.paperDir = path.join(exports.jsonDir, "papers");
exports.scriptDir = path.join(process.cwd(), "scripts");

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
 * @param {*} dict The Javascript object  to write.
 * @param {string} filename The path to write to.
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
 * Make a copy of an object that has its keys sorted in descending order.
 * @param {*} inputObject The object withunsorted keys.
 * @returns A new object with keys sorted as requeted.
 */
function sortObjectKeysDesc(inputObject) {
  let sortedObject = {};

  var keys = Object.keys(inputObject);
  keys.sort().reverse();
  for (var i = 0; i < keys.length; i++) {
    sortedObject[keys[i]] = inputObject[keys[i]];
  }

  return sortedObject;
}

/**
 * Write the data for one newspaper.
 */
exports.writeNewspaper = function (id, record, source = null) {
  const filename = path.join(exports.paperDir, id + ".json");

  // Add the information source if one hs been supplied:
  if (source) {
    if (!record.sources) {
      record.sources = {};
    }
    let currentdate = new Date().toISOString();
    record.sources[currentdate] = source;
  }

  // Add the entries we want to appear first:
  newRecord = {};
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

  // Re-insert the sources, and sort them too:
  if (newRecord.sources) {
    delete newRecord.sources;
    newRecord.sources = sortObjectKeysDesc(record.sources);
  }

  // Update the file revision number, just because:
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
