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

  console.log(`================================================================================`);
  console.log(`GRAPH TRAVERSAL LOOP / CYCLE DETECTOR (${papersMap.size} PAPERS)`);
  console.log(`================================================================================\n`);

  // Build directed graph for "Succeeding" links
  const forwardGraph = new Map(); // id -> array of targetIds

  papersMap.forEach((paper, id) => {
    const targets = [];
    if (paper.links) {
      Object.entries(paper.links).forEach(([targetId, link]) => {
        if (
          link.direction === "Succeeding" ||
          link.relationship === "Continued by" ||
          link.relationship === "Merged into"
        ) {
          targets.push(targetId);
        }
      });
    }
    forwardGraph.set(id, targets);
  });

  // Cycle detection via Depth First Search (DFS)
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(currId, pathStack) {
    visited.add(currId);
    recursionStack.add(currId);
    pathStack.push(currId);

    const neighbors = forwardGraph.get(currId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        dfs(neighborId, pathStack);
      } else if (recursionStack.has(neighborId)) {
        // Cycle found!
        const cycleStartIndex = pathStack.indexOf(neighborId);
        const cyclePath = pathStack.slice(cycleStartIndex).concat(neighborId);
        cycles.push(cyclePath);
      }
    }

    pathStack.pop();
    recursionStack.delete(currId);
  }

  papersMap.forEach((_, id) => {
    if (!visited.has(id)) {
      dfs(id, []);
    }
  });

  if (cycles.length === 0) {
    console.log("🎉 SUCCESS: NO LOOPS OR CYCLES DETECTED ANYWHERE IN THE ENTIRE GRAPH!");
  } else {
    console.log(`⚠️ FOUND ${cycles.length} CYCLE(S) IN THE GRAPH:\n`);
    cycles.forEach((cycle, index) => {
      const cycleNames = cycle.map(
        (id) => `${id} ("${papersMap.get(id)?.title || "Unknown"}")`
      );
      console.log(`Cycle #${index + 1}: ${cycleNames.join(" -> ")}`);
    });
  }
}

run();
