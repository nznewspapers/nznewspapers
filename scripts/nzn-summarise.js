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
    return a.sortPlace.localeCompare(b.sortPlace);
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
 * Generate the placeInfo.json file from the newpaper data, which is to display the places, digitised, and current pages.
 * @param {*} newspaperList A list records, each describihg one newspaper.
 * @param {*} placenames A list of placenames.
 */
function generatePlaceInfo(newspaperList, placenames) {
  var placeInfo = {
    stats: {},
    lists: {},
  };
  placeInfo.stats.count = newspaperList.length;
  placeInfo.stats.countCurrent = 0;
  placeInfo.stats.countDigitized = 0;
  placeInfo.stats.places = placenames.size;
  placeInfo.lists.regionList = [];
  fullDistrictList = new Set();

  newspaperList.sort(function (a, b) {
    return a.sortPlace.localeCompare(b.sortPlace);
  });

  newspaperList.forEach(function (newspaper) {
    if (!placeInfo.lists[newspaper.region]) {
      placeInfo.lists[newspaper.region] = {};
      placeInfo.lists[newspaper.region]["districtList"] = [];
      placeInfo.lists.regionList.push(newspaper.region);
    }
    if (!placeInfo.lists[newspaper.region][newspaper.district]) {
      placeInfo.lists[newspaper.region][newspaper.district] = [];
      placeInfo.lists[newspaper.region]["districtList"].push(
        newspaper.district
      );
      fullDistrictList.add(newspaper.district);
    }
    var record = {
      id: newspaper.id,
      title: newspaper.title,
      firstYear: newspaper.firstYear,
      finalYear: newspaper.finalYear,
      placename: newspaper.placename,
      urlCurrent: newspaper.urlCurrent,
      urlDigitized: newspaper.urlDigitized,
    };
    if (newspaper.finalYear == "9999") {
      placeInfo.stats.countCurrent += 1;
    }
    if (newspaper.urlDigitized) {
      placeInfo.stats.countDigitized += 1;
    }
    placeInfo.lists[newspaper.region][newspaper.district].push(record);
  });

  placeInfo.stats.regions = placeInfo.lists.regionList.length;
  placeInfo.stats.districts = fullDistrictList.size;
  const placeInfoPath = path.join(nznShared.jsonDir, "placeInfo.json");
  nznShared.writeJsonDict(placeInfo, placeInfoPath);
}

/**
 * Generate one JSON file for each place in the dataset.
 * @param {*} newspaperList A list records, each describihg one newspaper.
 */
function generatePlaceData(newspaperList) {
  var placeData = {};
  var placenameList = [];

  newspaperList.forEach(function (newspaper) {
    var pname = newspaper.placename;
    if (!placeData[pname]) {
      placeData[pname] = {};
      placenameList.push(pname);
    }
    placeData[pname][newspaper.id] = {};
    placeData[pname][newspaper.id]["title"] = newspaper.title;
    placeData[pname][newspaper.id]["firstYear"] = newspaper.firstYear;
    placeData[pname][newspaper.id]["finalYear"] = newspaper.finalYear;
    placeData[pname][newspaper.id]["urlCurrent"] = newspaper.urlCurrent;
    placeData[pname][newspaper.id]["urlDigitized"] = newspaper.urlDigitized;
  });

  placenameList.forEach(function (pname) {
    var data = {
      stats: {},
      papers: [],
    };
    data.stats.placename = pname;

    var decades = new Set();
    for (var id in placeData[pname]) {
      var record = {
        id: id,
        title: placeData[pname][id]["title"],
        firstYear: placeData[pname][id]["firstYear"],
        finalYear: placeData[pname][id]["finalYear"],
        urlCurrent: placeData[pname][id]["urlCurrent"],
        urlDigitized: placeData[pname][id]["urlDigitized"],
      };
      data.papers.push(record);
      decades.add(placeData[pname][id]["firstYear"].substring(0, 3) + "0s");
    }
    data.stats.count = data.papers.length;
    data.stats.decades = decades.size;

    data.papers.sort(function (a, b) {
      return a.firstYear.localeCompare(b.firstYear);
    });

    const filename = path.join(nznShared.jsonDir, "places", pname + ".json");
    nznShared.writeJsonDict(data, filename);
  });
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
      newspaper.sortKey = sortKey + "-" + newspaper.firstYear;
      newspaper.sortPlace =
        newspaper.placecode + "-" + newspaper.placename + newspaper.firstYear;
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

  // Generate data for the "By Title" and "By Place" pages:
  generateTitleInfo(newspaperList, placenames, newspaperCount);
  generatePlaceInfo(newspaperList, placenames, newspaperCount);

  // Generate data about each place:
  generatePlaceData(newspaperList);

  console.log("End summarise(): " + newspaperCount + " newspaper records");
  console.log("End summarise(): " + skipped + " skipped records");
}

console.log("Starting Summarise");
const newspaperIds = nznShared.getNewspaperIds();
summarise(newspaperIds);

console.log("Rewriting Genre Index");
nznShared.generateIdToGenreFile();

console.log("Ending");
