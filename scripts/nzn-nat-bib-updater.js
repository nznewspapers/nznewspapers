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

const marcFile = path.join(nznShared.scriptDir, "Pubsnzapril2022.mrc");
if (!fs.existsSync(marcFile)) {
  console.error("Missing MARC file: " + marcFile);
  process.exit(1);
}

console.log("Running: " + process.argv[1]);
console.log(" * MARC file: " + marcFile);
console.log(" * Data dir:  " + nznShared.paperDir);

// Find the records that newspaper data now
console.log("Scanning existing records");

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
  "Read " + Object.keys(newspaperRecords).length + " newspaper records"
);

// Gather some stats as we go...
let stats = {};

function addStats(label) {
  if (stats[label]) {
    stats[label] += 1;
  } else {
    stats[label] = 1;
  }
}

function statsToString() {
  let str = "Stats\n";
  for (const [key, value] of Object.entries(stats)) {
    str += " * " + key + " -> " + value + "\n";
  }
  return str;
}

function readMarcFile(marcFile) {
  // Set up a MARC reader for the NatBib records
  let reader = Marc.stream(fs.createReadStream(marcFile), "Iso2709");
  let serialCounter = 0;
  let newspaperCounter = 0;

  let countNoNatLibMarc = 0;
  let countMatch = 0;
  let countNoMatch = 0;

  // Every 5 seconds, a progress update:
  let tick = setInterval(() => {
    console.log(
      "papers / serials / total: " +
        newspaperCounter +
        " / " +
        serialCounter +
        " / " +
        reader.count
    );
  }, 5000);

  // Set up a bunch of writers (we don't need):
  //let writers = ["marcxml", "iso2709", "json", "text"].map((type) =>
  //  Marc.stream(fs.createWriteStream("bib-edited." + type), type)
  //);
  let writers = ["text"].map((type) =>
    Marc.stream(fs.createWriteStream("bib-edited." + type), type)
  );

  // Read each MARC record, and write it:
  reader.on("data", (record) => {
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

        // Genre:
        let genre = null;
        record.get(/655/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              genre = pair[1];
            }
          });
        });

        // Placename:
        let placename = null;
        record.get(/651/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              placename = pair[1];
            }
          });
        });

        if (newspaperCounter < 2) {
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
          addStats("count-skpped-no-nz-control-number");
        } else if (isMicroformResource) {
          // Ignore records for micrfilm and mocroform materials:
          addStats("count-skpped-micoform");
        } else if (isElectronicResource) {
          // Ignore records for digitised and born-digital materials:
          addStats("count-skipped-electronic");
        } else if (newspaperIdMatch) {
          // console.log("Match " + marcControlNumber + " -> " + newspaperIdMatch);
          addStats("count-match-yay");
          countMatch += 1;
        } else {
          addStats("count-no-match");

          console.log("Marc has no match (" + stats["count-no-match"] + "):");
          console.log(" * MARC Ctrl#: " + marcControlNumber);
          console.log(" * Date added: " + dateOnFile);

          // Last load was: 2013-04-02
          if (dateOnFile > "130402") {
            console.log("   * NEW RECORD!!!");
            addStats("count-no-match-and-new-record");
          }

          console.log(" * Title:      " + title);
          if (edition) {
            console.log("   * Edition: " + edition);
          }
          if (uniformTitle) {
            console.log("   * Uniform Title: " + uniformTitle);
          }

          console.log(" * Date Range: " + date1 + "-" + date2);
          console.log("   * Current?: " + isCurrentlyPublished);
          console.log(" * Genre:      " + genre);
          console.log(" * Placename:  " + placename);
          console.log(statsToString());
        }

        writers.forEach((writer) => writer.write(record));
      }
    }
    // throw new Error("blah");
  });

  // What happens at the end:
  reader.on("end", () => {
    writers.forEach((writer) => writer.end());
    console.log("Number of processed biblio records: " + reader.count);
    console.log(statsToString());

    clearInterval(tick);
  });
}

console.log("Launching MARC Parser for " + marcFile);
readMarcFile(marcFile);
console.log("Launched MARC Parser");
