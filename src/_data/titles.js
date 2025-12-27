const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  
  // Sort by sortKey
  papers.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Group by section (A, B, C...)
  const sections = {};
  
  papers.forEach(p => {
    if (!sections[p.titleSection]) {
      sections[p.titleSection] = [];
    }
    sections[p.titleSection].push(p);
  });

  return sections;
};
