const fs = require("fs");
const path = require("path");

module.exports = function () {
  // Path to the existing data in the project
  // We are in src/_data, so we go up two levels to get to root, then into data/papers
  const papersDir = path.join(__dirname, "../../data/papers");
  const papers = [];

  try {
    const files = fs.readdirSync(papersDir);

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const content = fs.readFileSync(path.join(papersDir, file), "utf8");
        const data = JSON.parse(content);

        // Mimic the filtering logic: Only keep "Newspaper" genre
        if (data.genre === "Newspaper") {
            // Add a computed "url" property for convenience
            data.url = `/newspapers/${data.id}/`;
            
            // Generate sort keys (ported from nzn-summarise.js)
            const sortKey = data.title
                .toLowerCase()
                .replace(/\W+/g, "")
                .replace("the", "");
            
            data.sortKey = sortKey + "-" + data.firstYear;
            data.sortPlace = data.placecode + "-" + data.placename + data.firstYear;
            data.titleSection = sortKey[0].toUpperCase() + sortKey[0].toLowerCase();

            // Read MARC record if it exists
            const marcPath = path.join(__dirname, "../../data/marc", `${data.id}.text`);
            if (fs.existsSync(marcPath)) {
                data.marcText = fs.readFileSync(marcPath, "utf8");
            }

            papers.push(data);
        }
      }
    });
  } catch (err) {
    console.error("Error reading newspaper files:", err);
  }

  return papers;
};
