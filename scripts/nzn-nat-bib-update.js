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
    // TODO: Report on newspapers with no NatLib MARC Control Number (many such have an OCLC MARC Control Number).
  } else if (!marcNumberToNewspaperId[marcNumber]) {
    marcNumberToNewspaperId[marcNumber] = key;
  } else {
    let message =
      "Duplicate MARC number '" +
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
    // throw message;
  }
}

console.log(
  "Read " + Object.keys(newspaperRecords).length + " newspaper records"
);

function readMarcFile(marcFile) {
  // Set up a MARC reader for the NatBib records
  let reader = Marc.stream(fs.createReadStream(marcFile), "Iso2709");
  let serialCounter = 0;
  let newspaperCounter = 0;

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
      let continuingResourceType = null;
      let date1 = null;
      let date2 = null;
      let ff = record.match(/008/, (field) => {
        generalInfoValue = field.value;
        continuingResourceType = field.value.charAt(21);
        date1 = field.value.substring(7, 11);
        date2 = field.value.substring(11, 15);
      });

      if (continuingResourceType == "n") {
        newspaperCounter += 1;

        // MARC Control Number:
        let marcControlNumber = null;
        record.get(/035/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a" && pair[1].startsWith("(Nz)")) {
              marcControlNumber = pair[1].substring(4);
            }
          });
        });

        // Title:
        let title = null;
        record.get(/245/).forEach((field) => {
          field["subf"].forEach((pair) => {
            if (pair[0] == "a") {
              title = pair[1];
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

        if (newspaperCounter < 5) {
          console.log("Newspaper Record (" + marcControlNumber + "):");

          console.log(" * Leader:     " + record.leader);
          // console.log(" * Record Type:  " + recordType);
          // console.log(" * Record Level: " + recordBibLevel);
          // console.log(" * 008 General Info: " + generalInfoValue);
          // console.log(" * Resource Type: " + continuingResourceType);
          // console.log(" * MARC Ctrl:  " + marcControlNumber);
          console.log(" * Title:      " + title);
          console.log(" * Date Range: " + date1 + "-" + date2);
          console.log(" * Genre:      " + genre);
          console.log(" * Placename:  " + placename);
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
    console.log(
      "papers / serials / total: " +
        newspaperCounter +
        " / " +
        serialCounter +
        " / " +
        reader.count
    );
    clearInterval(tick);
  });
}

console.log("Launching MARC Parser for " + marcFile);
readMarcFile(marcFile);
console.log("Launched MARC Parser");
