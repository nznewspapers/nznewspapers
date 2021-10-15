// nzn-import-shared.js
// Common functions and paths for importing data.

const fs = require("fs");
const path = require("path");

exports.inputDirectory = path.join(
  process.cwd(),
  "data-import",
  "2015-02-01-nznewspapers"
);
exports.jsonDirectory = path.join(process.cwd(), "docs", "data", "json");

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
  fs.writeFile(filename, jsonString, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
};
