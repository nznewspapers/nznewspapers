const fs = require("fs");
const path = require("path");

const PAPERS_DIR = path.join(__dirname, "..", "data", "papers");

function run() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith(".json"));
  const papersMap = new Map();

  files.forEach((f) => {
    const paper = JSON.parse(fs.readFileSync(path.join(PAPERS_DIR, f), "utf8"));
    papersMap.set(String(paper.id), paper);
  });

  const redundantLinks = [];

  papersMap.forEach((paperA, idA) => {
    if (!paperA.links) return;

    Object.entries(paperA.links).forEach(([idB, linkAB]) => {
      if (idA === idB) return;
      const paperB = papersMap.get(idB);
      if (!paperB || !paperB.links) return;

      // Check if A and B share a common successor paper C
      const successorsA = Object.keys(paperA.links).filter((targetId) => {
        const l = paperA.links[targetId];
        return (
          l.direction === "Succeeding" ||
          l.relationship === "Merged into" ||
          l.relationship === "Merged"
        );
      });

      const successorsB = Object.keys(paperB.links).filter((targetId) => {
        const l = paperB.links[targetId];
        return (
          l.direction === "Succeeding" ||
          l.relationship === "Merged into" ||
          l.relationship === "Merged"
        );
      });

      const commonSuccessors = successorsA.filter(
        (idC) => idC !== idB && successorsB.includes(idC)
      );

      if (commonSuccessors.length > 0) {
        // A and B share a common successor C!
        // Check if A links directly to B as Succeeding/Merged
        const isDirSucceeding =
          linkAB.direction === "Succeeding" ||
          linkAB.relationship === "Merged";

        if (isDirSucceeding) {
          redundantLinks.push({
            idA,
            titleA: paperA.title,
            idB,
            titleB: paperB.title,
            commonSuccessors: commonSuccessors.map(
              (idC) => `${idC} (${papersMap.get(idC)?.title || "Unknown"})`
            ),
          });
        }
      }
    });
  });

  console.log(
    `================================================================================`
  );
  console.log(`REDUNDANT CO-PREDECESSOR MERGER LINK DETECTOR`);
  console.log(
    `================================================================================\n`
  );

  console.log(
    `Found ${redundantLinks.length} redundant co-predecessor horizontal links across ${redundantLinks.length} papers:\n`
  );

  redundantLinks.forEach(({ idA, titleA, idB, titleB, commonSuccessors }) => {
    console.log(
      `• Paper #${idA} ["${titleA}"] has redundant link to co-predecessor #${idB} ["${titleB}"]`
    );
    console.log(`    Common Successor Paper(s): ${commonSuccessors.join(", ")}`);
    console.log(
      `    http://localhost:8080/newspapers/${idA}/ <-> http://localhost:8080/newspapers/${idB}/\n`
    );
  });
}

run();
