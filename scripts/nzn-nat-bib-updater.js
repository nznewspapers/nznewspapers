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

const marcFilePath = path.join(nznShared.scriptDir, "PubsNZ.mrc");
if (!fs.existsSync(marcFilePath)) {
  console.error("Missing MARC file: " + marcFilePath);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log(" * MARC input:    " + marcFilePath);
console.log(" * Newspaper dir: " + nznShared.paperDir);

console.log(" * MARC outputs:  " + nznShared.paperDir);
if (!fs.existsSync(nznShared.marcDir)) {
  fs.mkdirSync(nznShared.marcDir, { recursive: true });
}

// Figure out a mode of operation...
const commandArgs = process.argv.slice(2);
let mode = "add-new-records";
console.log(" * Args: ", commandArgs);
switch (commandArgs[0].toLowerCase()) {
  case "report":
    mode = "report";
    break;
  case "add-new-records":
    mode = "ADD_NEW_RECORDS";
    break;
  case "update-existing-records":
    mode = "UPDATE_EXISTING_RECORDS";
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
let placeData = {};

for (const [id, newspaper] of Object.entries(newspaperRecords)) {
  // Grab the MARC number:
  marcNumber = newspaper.idMarcControlNumber;
  if (!marcNumber) {
    // No MARC number on this record, ignore for now.
  } else if (!marcNumberToNewspaperId[marcNumber]) {
    marcNumberToNewspaperId[marcNumber] = id;
  } else {
    let message =
      "Error: Duplicate MARC number '" +
      marcNumber +
      "': " +
      id +
      " (" +
      newspaper.title +
      " / " +
      newspaper.genre +
      ")" +
      " matches " +
      marcNumberToNewspaperId[marcNumber] +
      " (" +
      newspaperRecords[marcNumberToNewspaperId[marcNumber]].title +
      ")";
    console.log(message);
    throw message;
  }

  // Log placename data for later lookups:
  var pname = newspaper.placename;
  if (!placeData[pname]) {
    placeData[pname] = {};
    placeData[pname]["placecode"] = newspaper.placecode;
    placeData[pname]["district"] = newspaper.district;
    placeData[pname]["region"] = newspaper.region;
  }
}

console.log(
  " * Read " +
    Object.keys(newspaperRecords).length +
    " records with MARC numbers"
);

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
    const sqb2 = name.indexOf("]");
    if (sqb2 > 1) name = name.substring(0, sqb2);
  }

  name = name.replace(/\?/, "");
  name = nznShared.titleCleanup(name);
  return name;
}

/**
 * Helper function for comparing two MARC dates to determine if the new date is more specific than the current.
 * @param {*} currentDate
 * @param {*} newDate
 * @returns
 */
function isNewDateMoreSpecific(currentDate, newDate) {
  // Trivial case 1 -> Current date is fully specific -> false:
  if (!currentDate.endsWith("u")) return false;

  // Trivial case 2 -> New date is not at all specific -> false:
  if (newDate == "9999" || newDate == "uuuu") return false;

  // Trivial case 3 -> Current date is not at all specific -> true:
  if (currentDate == "9999" || currentDate == "uuuu") return true;

  // Current date is a millenia:
  // "1uuu", "19uu" -> true
  // "1uuu", "1uuu" -> true
  // "1uuu", "uuuu" -> false (but caught above)
  if (currentDate.endsWith("uuu")) return true;

  // Current date is a century:
  // "19uu", "1970" -> true
  // "19uu", "197u" -> true
  // "19uu", "19uu" -> true
  // "19uu", "1uuu" -> false
  if (currentDate.endsWith("uu")) return !newDate.endsWith("uuu");

  // Current date is a decade:
  // "197u", "1970" -> true
  // "197u", "197u" -> true
  // "197u", "19uu" -> false
  // "197u", "1uuu" -> false
  if (currentDate.endsWith("u")) return !newDate.endsWith("uu");

  // Should never get here:
  return false;
}

/**
 * Read a MARC file and compare it to the existing nznewspaper records.
 *
 * @param {str} marcFileName The path of the MRC file to read.
 */
function readMarcFile(marcFileName, operatingMode) {
  // Set up a MARC reader for the NatBib records
  let reader = Marc.stream(fs.createReadStream(marcFileName), "Iso2709");

  // Every 5 seconds, a progress update:
  let tick = setInterval(() => {
    logStats();
  }, 5000);

  // At the end, a final message:
  reader.on("end", () => {
    console.log("Finished processing MARC record...");
    logStats();
    clearInterval(tick);
  });

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
        let newspaperId = null;
        let marcControlNumber = null;
        let marcControlNumberList = [];
        record.get(/035/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a" && pair[1].startsWith("(Nz)")) {
              marcControlNumber = pair[1].substring(4);
              marcControlNumberList.push(marcControlNumber);
              if (marcNumberToNewspaperId[marcControlNumber]) {
                newspaperId = marcNumberToNewspaperId[marcControlNumber];
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
              frequency = frequency.trim().replace(/[\.\,\?]+$/, "");
              infrequent = [
                "Annual",
                "Semiannual",
                "Quarterly",
                "Monthly",
              ].includes(frequency);
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

        // Links to Preceding and Succeeding entries
        let links = {};
        record.get(/780/).forEach((field) => {
          /*
            https://www.loc.gov/marc/bibliographic/bd760787.html
            0 - Continues
            1 - Continues in part
            2 - Supersedes
            3 - Supersedes in part
            4 - Formed by the union of ... and ...
            5 - Absorbed
            6 - Absorbed in part
            7 - Separated from
          */
          let direction = "Preceding";
          let relationship = "Unknown";
          switch (Number(field["ind2"])) {
            case 0:
            case 1:
              relationship = "Continues";
              break;
            case 2:
            case 3:
              relationship = "Supersedes";
              break;
            case 4:
              relationship = "Formed by the union";
              break;
            case 5:
            case 6:
              relationship = "Absorbed";
              break;
            case 7:
              relationship = "Separated from";
          }
          let title = "Unknown";
          field["subf"].forEach((pair) => {
            if (pair[0] == "t") {
              title = pair[1];
            }
          });
          const key = "unknown-" + (Object.keys(links).length + 1);
          links[key.toString()] = {
            direction: direction,
            relationship: relationship,
            "target-description": title,
          };
        });
        record.get(/785/).forEach((field) => {
          /*
            https://www.loc.gov/marc/bibliographic/bd760787.html
              785 - Type of relationship
              0 - Continued by
              1 - Continued in part by
              2 - Superseded by
              3 - Superseded in part by
              7 - Merged with ... to form ...
              4 - Absorbed by
              5 - Absorbed in part by
              6 - Split into ... and ...
              8 - Changed back to
          */
          let direction = "Succeeding";
          let relationship = "Unknown";
          switch (Number(field["ind2"])) {
            case 0:
            case 1:
              relationship = "Continued by";
              break;
            case 2:
            case 3:
              relationship = "Superseded by";
              break;
            case 4:
            case 5:
              relationship = "Absorbed by";
              break;
            case 6:
              relationship = "Split";
              break;
            case 7:
              relationship = "Merged";
              break;
            case 8:
              relationship = "Changed back to";
          }
          let title = "Unknown";
          field["subf"].forEach((pair) => {
            if (pair[0] == "t") {
              title = pair[1];
            }
          });
          const key = "unknown-" + (Object.keys(links).length + 1);
          links[key] = {
            direction: direction,
            relationship: relationship,
            "target-description": title,
          };
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
        } else if (newspaperId) {
          // We've matched an existing newspaper record to a MARC record... are there updates we can make?
          addStats("count-existing-record-found");

          newspaper = nznShared.readNewspaper(newspaperId);
          updated = false;

          let debug = false;
          if (debug) {
            console.log("Marc record:");
            console.log(" * MARC Ctrl#: " + marcControlNumber);
            console.log(" * Date added: " + dateOnFile);
            console.log(" * Title:      " + title);
            console.log(" * Date Range: " + date1 + "-" + date2);
            console.log(newspaper.firstYear + " - " + newspaper.finalYear);
            console.log(isNewDateMoreSpecific(newspaper.firstYear, date1));
            console.log(isNewDateMoreSpecific(newspaper.finalYear, date2));
            console.log("Test");
            console.log(!newspaper.finalYear.endsWith("u"));
          }

          // Update the first year:
          if (
            newspaper.firstYear != date1 &&
            isNewDateMoreSpecific(newspaper.firstYear, date1)
          ) {
            newspaper.firstYear = date1;
            updated = true;
          }

          // Update the final year:
          if (
            newspaper.finalYear != date2 &&
            isNewDateMoreSpecific(newspaper.finalYear, date2)
          ) {
            newspaper.finalYear = date2;
            updated = true;
          }

          // Update the isCurrentlyPublished to match final year:
          isCurrentlyPublished = newspaper.finalYear == "9999";
          if (newspaper.isCurrent != isCurrentlyPublished) {
            newspaper.isCurrent = isCurrentlyPublished;
            updated = true;
          }

          // We're not ging to update the links because the old metadata tends to be better

          if (updated) {
            if (mode == "UPDATE_EXISTING_RECORDS") {
              addStats("count-existing-record-updated");
              // console.log("Updating record " + id);

              nznShared.writeNewspaper(
                newspaperId,
                newspaper,
                "Date updated from the New Zealand National Bibliography " +
                  "(MARC record " +
                  marcControlNumber +
                  ") downloaded June 2022."
              );
            }
          }
        } else {
          // We've found an unrecognized MARC record, so let's add a new NZNewspapers record:
          addStats("count-new-record-found");
          newspaperId = nznShared.getNextNewspaperId();

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
            for (const [key, record] of Object.entries(links)) {
              console.log(
                " * Link " +
                  key +
                  ": " +
                  record["direction"] +
                  " / " +
                  record["relationship"] +
                  " / " +
                  record["target-description"]
              );
            }
          }

          // Add the entries we want to appear first:
          newRecord = {};
          newRecord.id = newspaperId;
          newRecord.title = nznShared.titleCleanup(title);
          newRecord.genre = "Undetermined";
          newRecord.idMarcControlNumber = marcControlNumber;
          newRecord.isCurrent = isCurrentlyPublished;
          newRecord.firstYear = date1;
          newRecord.finalYear = date2;
          if (frequency) newRecord.frequency = frequency;

          newRecord.placename = placename;
          if (placeData[placename]) {
            newRecord.placecode = placeData[placename]["placecode"];
            newRecord.district = placeData[placename]["district"];
            newRecord.region = placeData[placename]["region"];
          } else {
            newRecord.placecode = "unknown";
            newRecord.district = "Unknown District";
            newRecord.region = "Unknown Region";
          }

          if (links && Object.keys(links).length > 0) newRecord.links = links;

          // Make this an official newspaper record if the data quality checks out:
          if (newRecord.placecode != "unknown") newRecord.genre = "Newspaper";

          // Write the newspaper (sometimes):
          if (mode == "ADD_NEW_RECORDS") {
            addStats("count-new-record-added");

            nznShared.writeNewspaper(
              newspaperId,
              newRecord,
              (source =
                "Extracted from the New Zealand National Bibliography " +
                "(MARC record " +
                marcControlNumber +
                ") downloaded June 2022.")
            );
          }
        }

        // Write out the MARC record:
        if (newspaperId && marcControlNumber) {
          let filename = nznShared.getNewspaperMarcPath(newspaperId);

          let writer = Marc.stream(fs.createWriteStream(filename), "text");
          writer.write(record);
          writer.end();
        }
      }
    }
    // throw new Error("blah");
  });
}

console.log("Launching MARC Parser for " + marcFilePath);
readMarcFile(marcFilePath, mode);
