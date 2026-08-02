const fs = require("fs");
const path = require("path");

module.exports = function () {
  const papersDir = path.join(__dirname, "../../data/papers");
  const lookup = {};

  try {
    const files = fs.readdirSync(papersDir);
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const content = fs.readFileSync(path.join(papersDir, file), "utf8");
        const data = JSON.parse(content);
        lookup[data.id] = data;
      }
    });
  } catch (err) {
    console.error("Error reading all papers files:", err);
  }

  return lookup;
};
