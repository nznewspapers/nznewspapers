const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  
  // 1. Total Count
  const count = papers.length;

  // 2. Places Count (Unique placenames)
  const places = new Set(papers.map(p => p.placename)).size;

  // 3. Regions breakdown
  // Structure: { "Auckland": { "City": 5, "Suburb": 2 }, ... }
  const lists = {};

  papers.forEach(p => {
    if (!lists[p.region]) {
      lists[p.region] = {};
    }
    if (!lists[p.region][p.placename]) {
      lists[p.region][p.placename] = 0;
    }
    lists[p.region][p.placename]++;
  });

  return {
    count,
    places,
    lists
  };
};
