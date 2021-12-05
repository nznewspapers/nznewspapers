// nzn-summarise.js

// This script reads the individual newspaper JSON files, filters them down the Newspaper files only,
// pulls out information required by the site navigation pages, then creates a set of JSON files that
// are used to generate the website. These are stored in the ouput directory.

const fs = require("fs");
const path = require("path");
const nznShared = require("./nzn-shared");

// Confirm the required paths and input files:
if (!fs.existsSync(nznShared.oldIdtoNewIdFilename)) {
  console.error("Missing identifier map: " + nznShared.oldIdtoNewIdFilename);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log("Id file: " + nznShared.oldIdtoNewIdFilename);
console.log("Paper dir: " + nznShared.paperDir);
console.log("Output dir: " + nznShared.jsonDir);

/**
 * Generate the homeInfo.json file from the newpaper data
 * @param {*} newspaperList A list records, each describihg one newspaper.
 * @param {*} placenames A list of placenames.
 * @param {*} newspaperCount
 */
function generateHomeInfo(newspaperList, placenames, newspaperCount) {
  var homeInfo = {
    stats: {},
    lists: {},
  };
  homeInfo.stats.count = newspaperCount;
  homeInfo.stats.places = placenames.size;

  newspaperList.sort(function (a, b) {
    return a.placecode.localeCompare(b.placecode);
  });

  newspaperList.forEach(function (newspaper) {
    if (!homeInfo.lists[newspaper.region]) {
      homeInfo.lists[newspaper.region] = {};
    }
    if (!homeInfo.lists[newspaper.region][newspaper.placename]) {
      homeInfo.lists[newspaper.region][newspaper.placename] = 1;
    } else {
      homeInfo.lists[newspaper.region][newspaper.placename] += 1;
    }
  });
  homeInfo.stats.regions = Object.keys(homeInfo.lists).length;

  const homeInfoPath = path.join(nznShared.jsonDir, "homeInfo.json");
  nznShared.writeJsonDict(homeInfo, homeInfoPath);
}

/**
 * Generate the titleInfo.json file from the newpaper data
 * @param {*} newspaperList A list records, each describihg one newspaper.
 * @param {*} placenames A list of placenames.
 * @param {*} newspaperCount
 */
function generateTitleInfo(newspaperList, placenames, newspaperCount) {
  var titleInfo = {
    stats: {},
    lists: {},
  };
  titleInfo.stats.count = newspaperCount;
  titleInfo.stats.places = placenames.size;

  newspaperList.sort(function (a, b) {
    return a.sortKey.localeCompare(b.sortKey);
  });

  newspaperList.forEach(function (newspaper) {
    if (!titleInfo.lists[newspaper.titleSection]) {
      titleInfo.lists[newspaper.titleSection] = [];
    }
    var record = {
      id: newspaper.id,
      title: newspaper.title,
      firstYear: newspaper.firstYear,
      finalYear: newspaper.finalYear,
      region: newspaper.region,
      district: newspaper.district,
      placename: newspaper.placename,
      urlCurrent: newspaper.urlCurrent,
      urlDigitized: newspaper.urlDigitized,
    };
    titleInfo.lists[newspaper.titleSection].push(record);
  });

  titleInfo.stats.headings = Object.keys(titleInfo.lists).length;

  const titleInfoPath = path.join(nznShared.jsonDir, "titleInfo.json");
  nznShared.writeJsonDict(titleInfo, titleInfoPath);
}

/**
 * Read the newspaper data and create summary JSON files.
 * @param {*} idList A list of the newspaper identifier that we're going to summarise.
 */
function summarise(idList) {
  console.log("Start summarise()");

  // Read and re-write the newspaper Json:
  newspaperList = [];
  placenames = new Set();
  var newspaperCount = 0;
  var skipped = 0;

  // Extract the newspaper records we're interested in:
  idList.forEach(function (newspaperId) {
    var newspaper = nznShared.readNewspaper(newspaperId);

    if (newspaper && newspaper.genre == "Newspaper") {
      newspaperCount += 1;
      const sortKey = newspaper.title
        .toLowerCase()
        .replace(/\W+/g, "")
        .replace("the", "");
      newspaper.sortKey = sortKey;
      newspaper.titleSection =
        sortKey[0].toUpperCase() + sortKey[0].toLowerCase();
      newspaperList.push(newspaper);
      placenames.add(newspaper.placename);
    } else {
      skipped += 1;
    }
  });

  console.log("  Kept by summarise(): " + newspaperCount + " records");
  console.log("  Skipped in summarise(): " + skipped + " records.");

  // Generate data for the "Home" page:
  generateHomeInfo(newspaperList, placenames, newspaperCount);

  // Generate data for the "By Title" page:
  generateTitleInfo(newspaperList, placenames, newspaperCount);

  console.log("End summarise(): " + newspaperCount + " records");
  console.log("End summarise(): " + skipped + " records.");
}

console.log("Starting Read");
const oldIdtoNewId = nznShared.readOldIdtoNewId();

summarise(Object.values(oldIdtoNewId));

console.log("Ending");
