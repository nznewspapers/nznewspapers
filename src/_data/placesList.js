const getPapers = require("./papers");

function classifyLink(linkObj) {
  const dir = (linkObj.direction || "").toLowerCase();
  const rel = (linkObj.relationship || "").toLowerCase();

  if (dir.includes("edition") || rel.includes("edition")) {
    return "edition";
  }
  if (dir.includes("masthead") || rel.includes("masthead")) {
    return "masthead";
  }
  if (
    dir === "succeeding" ||
    dir === "continued by" ||
    dir.includes("succeed") ||
    rel.includes("continued by") ||
    rel.includes("merged into") ||
    rel.includes("absorbed by")
  ) {
    return "succeeding";
  }
  if (
    dir === "preceding" ||
    dir === "continues" ||
    dir.includes("preced") ||
    rel.includes("continues") ||
    rel.includes("formed by") ||
    rel.includes("absorbed")
  ) {
    return "preceding";
  }

  return "other";
}

module.exports = function () {
  const papers = getPapers();
  const placesMap = {};

  papers.forEach((p) => {
    const pname = p.placename;
    if (!placesMap[pname]) {
      placesMap[pname] = {
        name: pname,
        region: p.region,
        district: p.district,
        papers: [],
      };
    }
    placesMap[pname].papers.push(p);
  });

  const placesList = Object.values(placesMap);
  placesList.sort((a, b) => a.name.localeCompare(b.name));

  placesList.forEach((place) => {
    place.papers.sort((a, b) => {
      if (a.firstYear !== b.firstYear) {
        return Number(a.firstYear) - Number(b.firstYear);
      }
      return a.title.localeCompare(b.title);
    });

    const placePaperMap = new Map();
    place.papers.forEach((p) => placePaperMap.set(String(p.id), p));

    const undirAdj = new Map();
    const directedEdges = [];

    place.papers.forEach((p) => undirAdj.set(String(p.id), new Set()));

    place.papers.forEach((p) => {
      const pId = String(p.id);
      if (p.links) {
        Object.entries(p.links).forEach(([targetId, linkObj]) => {
          const targetStr = String(targetId);
          if (placePaperMap.has(targetStr)) {
            const linkCategory = classifyLink(linkObj);

            if (linkCategory !== "masthead") {
              undirAdj.get(pId).add(targetStr);
              if (!undirAdj.has(targetStr)) undirAdj.set(targetStr, new Set());
              undirAdj.get(targetStr).add(pId);

              if (linkCategory === "succeeding") {
                directedEdges.push({
                  source: pId,
                  target: targetStr,
                  type: "continuation",
                });
              } else if (linkCategory === "preceding") {
                directedEdges.push({
                  source: targetStr,
                  target: pId,
                  type: "continuation",
                });
              } else if (linkCategory === "edition") {
                directedEdges.push({
                  source: pId,
                  target: targetStr,
                  type: "edition",
                });
              }
            }
          }
        });
      }
    });

    const uniqueEdgesMap = new Map();
    directedEdges.forEach((edge) => {
      const key = `${edge.source}->${edge.target}:${edge.type}`;
      if (!uniqueEdgesMap.has(key)) {
        uniqueEdgesMap.set(key, edge);
      }
    });
    const uniqueEdges = Array.from(uniqueEdgesMap.values());

    const visited = new Set();
    const mermaidGraphs = [];
    const lineagePaperIds = new Set();

    place.papers.forEach((p) => {
      const pId = String(p.id);
      if (!visited.has(pId)) {
        const componentIds = [];
        const queue = [pId];
        visited.add(pId);

        while (queue.length > 0) {
          const curr = queue.shift();
          componentIds.push(curr);
          if (undirAdj.has(curr)) {
            undirAdj.get(curr).forEach((neighbor) => {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            });
          }
        }

        if (componentIds.length > 1) {
          componentIds.forEach((id) => lineagePaperIds.add(String(id)));
          const compSet = new Set(componentIds);
          let lines = ["graph LR"];

          componentIds.forEach((id) => {
            const paper = placePaperMap.get(id);
            const titleEsc = paper.title.replace(/"/g, "'");
            const dates =
              paper.finalYear === "9999"
                ? `since ${paper.firstYear}`
                : `${paper.firstYear}–${paper.finalYear}`;

            let icons = "";
            if (paper.urlDigitized) icons += " 📜";
            if (paper.urlCurrent) icons += " 🌐";

            lines.push(`  node_${id}["${titleEsc}${icons}<br/>(${dates})"]`);
            lines.push(
              `  click node_${id} "/newspapers/${id}/" "View ${titleEsc}"`
            );
          });

          uniqueEdges.forEach((edge) => {
            if (compSet.has(edge.source) && compSet.has(edge.target)) {
              if (edge.type === "edition") {
                lines.push(
                  `  node_${edge.source} -.->|Edition| node_${edge.target}`
                );
              } else {
                lines.push(`  node_${edge.source} --> node_${edge.target}`);
              }
            }
          });

          const compPapers = componentIds.map((id) => placePaperMap.get(id));
          compPapers.sort((a, b) => Number(a.firstYear) - Number(b.firstYear));

          mermaidGraphs.push({
            definition: lines.join("\n"),
            earliestYear: Number(compPapers[0].firstYear),
          });
        }
      }
    });

    mermaidGraphs.sort((a, b) => a.earliestYear - b.earliestYear);
    place.mermaidGraphs = mermaidGraphs;
    place.lineagePaperIds = Array.from(lineagePaperIds);
  });

  return placesList;
};
