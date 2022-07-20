// nzn-shared.js
// Common functions and paths for processing nespaper data.

const fs = require("fs");
const path = require("path");

exports.docsDir = path.join(process.cwd(), "docs");
exports.jsonDir = path.join(exports.docsDir, "data");
exports.paperDir = path.join(exports.jsonDir, "papers");
exports.marcDir = path.join(exports.jsonDir, "marc");
exports.scriptDir = path.join(process.cwd(), "scripts");

exports.oldIdtoNewIdFilename = path.join(
  exports.jsonDir,
  "old_id_to_new_id.json"
);

/**
 * Get the JSON filename for newspaper data.
 * @param {*} id The newspaper identifier
 * @returns The JSON file path
 */
exports.getNewspaperJsonPath = function (id) {
  return path.join(exports.paperDir, id + ".json");
};

/**
 * Get the MARC filename for newspaper data.
 * @param {*} id The newspaper identifier
 * @returns The MARC file path
 */
exports.getNewspaperMarcPath = function (id) {
  return path.join(exports.marcDir, id + ".text");
};

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
 * Convert a string to Title Case.
 * @param {string} String to convert.
 * @returns String In Title Case.
 */
exports.titleCase = function (str) {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(" ");
};

/**
 * Clean up a string that is being used as a title or placename and return in Title Case
 * @param {string} String The string to clean up.
 * @returns A better version of the string, hopefully.
 */
exports.titleCleanup = function (str) {
  let tidyStr = str.trim().replace(/[\.\: ]+$/, "");
  return exports.titleCase(tidyStr);
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
 * Write a set to a text file, one line at a time. Useful for sitemaps.
 * @param {*} data A set of strings.
 * @param {*} path The path of the file to write.
 */
exports.writeDataToTextFile = function (data, path) {
  let arr = Array.from(data).sort();
  let file = fs.createWriteStream(path);

  file.on("error", function (err) {
    /* error handling */
    console.log("Error writing '" + paperFilename + "': " + err);
  });
  arr.forEach(function (v) {
    file.write(v + "\n");
  });
  file.end();
};

/**
 * Read the data for one newspaper.
 */
exports.readNewspaper = function (id) {
  if (!id) throw new Error("Error: no id passed to readNewspaper.");
  const filename = exports.getNewspaperJsonPath(id);
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
  const filename = exports.getNewspaperJsonPath(id);

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
 * Read all the Newspaper JSON files on disk and generate an index file from them.
 * Call this at the end of any script that adds/removes newspaper files.
 */
exports.generateIdToGenreFile = function () {
  var genreInfo = {};

  const filenames = fs.readdirSync(exports.paperDir).sort();

  for (const filename of filenames) {
    if (filename.endsWith(".json")) {
      const filePath = path.join(exports.paperDir, filename);
      const newspaper = exports.readJsonDictSync(filePath);
      genreInfo[newspaper.id] = newspaper.genre;
    }
  }

  const filename = path.join(exports.jsonDir, "newspaperIdToGenre.json");
  exports.writeJsonDict(genreInfo, filename);
};

/**
 * Read the mapping from old ids to new ids.
 */
exports.readOldIdtoNewId = function () {
  return exports.readJsonDictSync(exports.oldIdtoNewIdFilename);
};

/**
 * Get the complete list of valid newspaper ids.
 * @returns A sorted list of newspaper ids.
 */
exports.getNewspaperIds = function () {
  let oldIdtoNewId = exports.readOldIdtoNewId();
  return Object.values(oldIdtoNewId).sort();
};

/**
 * Get the complete set of newspaper records.
 * @returns A dict that maps from newspaper Id to a newspaper record.
 */
exports.getNewspaperRecords = function () {
  let results = {};
  const newspaperIdList = exports.getNewspaperIds();
  for (const id of newspaperIdList) {
    let result = exports.readNewspaper(id);
    if (result && Object.keys(result).length > 0) {
      results[id] = result;
    }
  }
  return results;
};

/** The highest newspaper ID in the current dataset, if known. */
var maxNewspaperId = null;

/**
 * Get the next available newspaper Id so we can create a new record.
 * @returns The next available Id.
 */
exports.getNextNewspaperId = function () {
  if (!maxNewspaperId) {
    maxNewspaperId = 0;
    for (id of exports.getNewspaperIds()) {
      newspaperId = parseInt(id);
      if (newspaperId > maxNewspaperId) maxNewspaperId = newspaperId;
    }
  }
  maxNewspaperId += 1;
  return maxNewspaperId;
};
