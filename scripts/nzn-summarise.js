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

  // The summary data we will create:
  titleMap = {};
  titlePath = path.join(nznShared.jsonDir, "titleInfo.json");

  // Read and re-write the newspaper Json:
  var count = 0;
  var skipped = 0;

  idList.forEach(function (newspaperId) {
    const newspaper = nznShared.readNewspaper(newspaperId);

    if (newspaper && newspaper.genre == "Newspaper") {
      count += 1;
      titleMap[newspaper.title] = newspaperId;
    } else {
      skipped += 1;
    }
  });

  var titleData = {
    stats: {},
    lists: {},
  };
  titleData.stats.count = count;
  var keys = Object.keys(titleMap).sort();
  keys.forEach(function (key) {
    listId = key[0].toUpperCase() + key[0].toLowerCase();
    if (!titleData.lists[listId]) {
      titleData.lists[listId] = {};
    }
    titleData.lists[listId][key] = titleMap[key];
  });
  nznShared.writeJsonDict(titleData, titlePath);

  console.log("End summarise(): " + count + " records");
  console.log("End summarise(): " + skipped + " records.");
}

console.log("Starting Read");
const oldIdtoNewId = nznShared.readOldIdtoNewId();

summarise(Object.values(oldIdtoNewId));

console.log("Ending");
