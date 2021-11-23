// nzn-summarise.js
// Reads individual newspaper JSON files and cretes summary documents.

const fs = require("fs");
const path = require("path");
const nznShared = require("./nzn-shared");

if (!fs.existsSync(nznShared.oldIdtoNewIdFilename)) {
  console.error("Missing identifier map: " + nznShared.oldIdtoNewIdFilename);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log("Id file: " + nznShared.oldIdtoNewIdFilename);
console.log("Paper dir: " + nznShared.paperDir);
console.log("Output dir: " + nznShared.jsonDir);

function summarise(idList) {
  console.log("Start summarise()");

  // Read and re-write the newspaper Json:
  newspaperList = [];
  placenames = new Set();
  var count = 0;
  var skipped = 0;

  // Extract the newspaper records we're interested in:
  idList.forEach(function (newspaperId) {
    var newspaper = nznShared.readNewspaper(newspaperId);

    if (newspaper && newspaper.genre == "Newspaper") {
      count += 1;
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

  console.log("  Kept summarise(): " + count + " records");
  console.log("  Skipped summarise(): " + skipped + " records.");

  // Generate data for the "Home" page:
  var homeInfo = {
    stats: {},
    lists: {},
  };
  homeInfo.stats.count = count;
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

  const homeInfoPath = path.join(nznShared.jsonDir, "homeInfo.json");
  nznShared.writeJsonDict(homeInfo, homeInfoPath);

  // Generate data for the "By Title" page:
  var titleInfo = {
    stats: {},
    lists: {},
  };
  titleInfo.stats.count = count;
  titleInfo.stats.places = placenames.size;

  newspaperList.sort(function (a, b) {
    return a.sortKey.localeCompare(b.sortKey);
  });

  newspaperList.forEach(function (newspaper) {
    if (!titleInfo.lists[newspaper.titleSection]) {
      titleInfo.lists[newspaper.titleSection] = [];
    }
    var record = {
      title: newspaper.title,
      firstYear: newspaper.firstYear,
      finalYear: newspaper.finalYear,
      placename: newspaper.region,
      placename: newspaper.placename,
      urlCurrent: newspaper.urlCurrent,
      urlDigitized: newspaper.urlDigitized,
    };
    titleInfo.lists[newspaper.titleSection].push(record);
  });

  titleInfo.stats.headings = Object.keys(titleInfo.lists).length;

  const titleInfoPath = path.join(nznShared.jsonDir, "titleInfo.json");
  nznShared.writeJsonDict(titleInfo, titleInfoPath);

  console.log("End summarise(): " + count + " records");
  console.log("End summarise(): " + skipped + " records.");
}

console.log("Starting Read");
const oldIdtoNewId = nznShared.readOldIdtoNewId();

summarise(Object.values(oldIdtoNewId));

console.log("Ending");
