// nzn-summarise.js

// This script reads a New Zealand National Bibliography MARC file
// and updates the website data for any newspapers it finds.

const fs = require("fs");
const path = require("path");
const nznShared = require("./nzn-shared");
const { Marc } = require("marcjs");
//const { Console } = require("console");

// Confirm the required paths and input files:
if (!fs.existsSync(nznShared.oldIdtoNewIdFilename)) {
  console.error("Missing identifier map: " + nznShared.oldIdtoNewIdFilename);
  process.exit(1);
}

const marcFilePath = path.join(nznShared.scriptDir, "Pubsnzapril2022.mrc");
if (!fs.existsSync(marcFilePath)) {
  console.error("Missing MARC file: " + marcFilePath);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log(" * MARC file: " + marcFilePath);
console.log(" * Data dir:  " + nznShared.paperDir);

// Figure out a mode of operation...
const commandArgs = process.argv.slice(2);
let mode = "report";
console.log(" * Args: ", commandArgs);
switch (commandArgs[0].toLowerCase()) {
  case "report":
    mode = "report";
    break;
  case "add-new-records":
    mode = "add-new-records";
    break;
  case "update-existing-records":
    mode = "update-existing-records";
    break;
  case "update-marc-files":
    mode = "update-marc-files";
    break;
  default:
    console.log("Warning: mode not specified, defaulting to 'report'");
    mode = "report";
}
console.log(" * Mode: ", mode);

// Find the records that newspaper data now...
console.log("Scanning existing nznewspapers.org records");

let newspaperRecords = nznShared.getNewspaperRecords();
let marcNumberToNewspaperId = {};
for (const [key, value] of Object.entries(newspaperRecords)) {
  // Save the title:
  marcNumber = newspaperRecords[key].idMarcControlNumber;

  if (!marcNumber) {
    // No MARC number, ignore for now.
    // Often the MARC Control Number refers to a Masthead or related record.
  } else if (!marcNumberToNewspaperId[marcNumber]) {
    marcNumberToNewspaperId[marcNumber] = key;
  } else {
    let message =
      "Error: Duplicate MARC number '" +
      marcNumber +
      "': " +
      key +
      " (" +
      newspaperRecords[key].title +
      " / " +
      newspaperRecords[key].genre +
      ")" +
      " matches " +
      marcNumberToNewspaperId[marcNumber] +
      " (" +
      newspaperRecords[marcNumberToNewspaperId[marcNumber]].title +
      ")";
    console.log(message);
    throw message;
  }
}

console.log(
  " * Read " +
    Object.keys(newspaperRecords).length +
    " records with MARC numbers"
);

// Assign nre record numbers...
var nextRecordId = 5000;
function getNextRecordId() {
  nextRecordId += 1;
  return nextRecordId;
}

// Gather some stats as we go...
let stats = {};
let recordCounter = 0;
let serialCounter = 0;
let newspaperCounter = 0;

function addStats(label) {
  if (stats[label]) {
    stats[label] += 1;
  } else {
    stats[label] = 1;
  }
}

function statsToString() {
  let str = "Stats\n";
  for (const key of Object.keys(stats).slice().sort()) {
    str += " * " + key + " -> " + stats[key] + "\n";
  }

  return str;
}

function logStats() {
  console.log(
    "Parser mode: '" +
      mode +
      "': " +
      newspaperCounter +
      " papers / " +
      serialCounter +
      " serials / " +
      recordCounter +
      " records"
  );
  console.log(statsToString());
}

/**
 * Given a placename from a MARC record, return a tidier version of a placename of interest.
 *
 * @param {*} rawName The unprocessed place name read from the MARC file.
 * @returns A cleaner version of the name, or null if it not a location we are intereted in.
 */
function placeCleanUp(rawName) {
  if (!rawName) return null;

  let name = rawName;
  if (
    name.includes("Apia") ||
    name.includes("Egypt") ||
    name.includes("London") ||
    name.includes("Sydney")
  )
    return null;

  if (name.charAt(0) == "[") name = name.substring(1);
  if (name.search("N.Z") != -1) {
    const comma = name.indexOf(",");
    if (comma > 1) name = name.substring(0, comma);
    const nz = name.search("N.Z");
    if (nz > 1) name = name.substring(0, nz);
    const sqb = name.indexOf("[");
    if (sqb > 1) name = name.substring(0, sqb);
  }

  name = name.replace(/\?/, "");
  name = name.replace(/ +$/, "");
  return name;
}

/**
 * Read a MARC file and compare it to the existing nznewspaper records.
 *
 * @param {str} marcFileName The path of the MRC file to read.
 */
function readMarcFile(marcFileName, operatingMode) {
  // Set up a MARC reader for the NatBib records
  let reader = Marc.stream(fs.createReadStream(marcFileName), "Iso2709");

  let countNoNatLibMarc = 0;
  let countMatch = 0;
  let countNoMatch = 0;

  // Every 5 seconds, a progress update:
  let tick = setInterval(() => {
    logStats();
  }, 5000);

  // At the end, a final message:
  reader.on("end", () => {
    writers.forEach((writer) => writer.end());
    console.log("Finished processing MARC records...");
    logStats();
    clearInterval(tick);
  });

  // Set up a bunch of writers (we don't need):
  //let writers = ["marcxml", "iso2709", "json", "text"].map((type) =>
  //  Marc.stream(fs.createWriteStream("bib-edited." + type), type)
  //);
  let writers = ["text"].map((type) =>
    Marc.stream(fs.createWriteStream("bib-edited." + type), type)
  );

  // Read each MARC record, and write it:
  reader.on("data", (record) => {
    recordCounter += 1;
    const recordType = record.leader.charAt(6);
    const recordBibLevel = record.leader.charAt(7);

    if (recordType == "a" && recordBibLevel == "s") {
      serialCounter += 1;

      // General Inormation Record
      let generalInfoValue = null;
      let dateOnFile = null;
      let typeOfDate = null;
      let date1 = null;
      let date2 = null;
      let continuingResourceType = null;
      let ff = record.match(/008/, (field) => {
        generalInfoValue = field.value;
        dateOnFile = field.value.substring(0, 6);
        typeOfDate = field.value.charAt(6);
        date1 = field.value.substring(7, 11);
        date2 = field.value.substring(11, 15);
        continuingResourceType = field.value.charAt(21);
      });
      let isCurrentlyPublished = typeOfDate == "c";

      if (continuingResourceType == "n") {
        newspaperCounter += 1;

        // MARC Control Number:
        // TODO: Check for duplicate MARC Control Numbers (e.g. 8000996)
        let marcControlNumber = null;
        let marcControlNumberList = [];
        let newspaperIdMatch = null;
        record.get(/035/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a" && pair[1].startsWith("(Nz)")) {
              marcControlNumber = pair[1].substring(4);
              marcControlNumberList.push(marcControlNumber);
              if (marcNumberToNewspaperId[marcControlNumber]) {
                newspaperIdMatch = marcNumberToNewspaperId[marcControlNumber];
              }
            }
          });
        });

        // Track format:
        let isElectronicResource = false;
        let isMicroformResource = false;

        // Title & Medium:
        let title = null;
        let medium = null;
        record.get(/245/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              title = pair[1];
            } else if (pair[0] == "h") {
              medium = pair[1];
              if (medium.startsWith("[electronic resource]")) {
                isElectronicResource = true;
              } else if (medium.startsWith("[microform]")) {
                isMicroformResource = true;
              }
            }
          });
        });

        // Uniform Title:
        let uniformTitle = null;
        record.get(/130/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              uniformTitle = pair[1];
            }
          });
        });

        // Edition:
        let edition = null;
        record.get(/250/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              edition = pair[1];
            }
          });
        });

        // Physical Description / Extent:
        let physicalExtent = null;
        record.get(/300/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              physicalExtent = pair[1];
              if (physicalExtent.includes("microf")) {
                isMicroformResource = true;
              } else if (physicalExtent.includes("online resource")) {
                isElectronicResource = true;
              } else if (physicalExtent.includes("electronic documents")) {
                isElectronicResource = true;
              }
            }
          });
        });

        // Edition:
        let infrequent = false;
        let frequency = null;
        record.get(/310/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              frequency = pair[1];
              infrequent = ["Annual", "Semiannual", "Quarterly"].includes(
                frequency
              );
            }
          });
        });

        // Genre:
        let genre = null;
        record.get(/655/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              if (pair[1].startsWith("New Zealand newspapers")) {
                genre = pair[1];
              }
            }
          });
        });

        // Placename:
        let placename = null;
        record.get(/260/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              placename = placeCleanUp(pair[1]);
            }
          });
        });

        if (newspaperCounter < 0) {
          console.log("Sample Newspaper Record (" + marcControlNumber + "):");
          console.log(" * Leader:     " + record.leader);
          console.log(" * Title:      " + title);
          console.log(" * Date Range: " + date1 + "-" + date2);
          console.log(" * Genre:      " + genre);
          console.log(" * Placename:  " + placename);
          console.log("");
        }

        // Does this Marc Control Number match a known record?
        if (!marcControlNumber) {
          addStats("count-skipped-no-nz-control-number");
        } else if (isMicroformResource) {
          // Ignore records for micrfilm and mocroform materials:
          addStats("count-skipped-micoform");
        } else if (isElectronicResource) {
          // Ignore records for digitised and born-digital materials:
          addStats("count-skipped-electronic");
        } else if (infrequent) {
          // Ignore records that are published too infrequently:
          addStats("count-skipped-infrequent");
        } else if (!placename) {
          // Ignore records for overseas and unknown places:
          addStats("count-skipped-placename");
        } else if (newspaperIdMatch) {
          // console.log("Match " + marcControlNumber + " -> " + newspaperIdMatch);
          addStats("count-match-existing-record");
          countMatch += 1;
        } else {
          addStats("count-new-record");

          // A new record? Last load was: 2013-04-02
          const newRecordSinceLastLoad = dateOnFile > "130402";
          if (newRecordSinceLastLoad)
            addStats("count-new-record-since-last-load");

          // Debug mode: dump out a record
          var verbose = false;
          if (verbose) {
            console.log("Marc record:");
            console.log(" * MARC Ctrl#: " + marcControlNumber);
            console.log(" * Date added: " + dateOnFile);
            if (newRecordSinceLastLoad) console.log("   * NEW RECORD!!!");
            console.log(" * Title:      " + title);
            if (edition) console.log("   * Edition: " + edition);
            if (uniformTitle)
              console.log("   * Uniform Title: " + uniformTitle);
            console.log(" * Date Range: " + date1 + "-" + date2);
            console.log("   * Current?: " + isCurrentlyPublished);
            console.log(" * Frequency:  " + frequency);
            if (infrequent) console.log("   * INFREQUENT");
            console.log(" * Genre:      " + genre);
            console.log(" * Placename:  " + placename);
          }

          // Add the entries we want to appear first:
          newRecord = {};
          newRecord.id = getNextRecordId();
          newRecord.title = title;
          newRecord.genre = "Automatic";
          newRecord.idMarcControlNumber = marcControlNumber;
          newRecord.isCurrent = isCurrentlyPublished;
          newRecord.firstYear = date1;
          newRecord.finalYear = date2;
          newRecord.placecode = "unknown";
          newRecord.placename = placename;
          newRecord.frequency = frequency;

          nznShared.writeNewspaper(
            newRecord.id,
            newRecord,
            (source =
              "Extracted from the New Zealand National Bibliography " +
              "(MARC record " +
              marcControlNumber +
              ") downloaded June 2022.")
          );
        }

        writers.forEach((writer) => writer.write(record));
      }
    }
    // throw new Error("blah");
  });
}

console.log("Launching MARC Parser for " + marcFilePath);
readMarcFile(marcFilePath, mode);
