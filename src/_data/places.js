const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  
  // Sort by place
  papers.sort((a, b) => a.sortPlace.localeCompare(b.sortPlace));

  const organize = (filterFn) => {
    const hierarchy = {};
    const filteredPapers = filterFn ? papers.filter(filterFn) : papers;

    filteredPapers.forEach(p => {
      if (!hierarchy[p.region]) hierarchy[p.region] = {};
      if (!hierarchy[p.region][p.district]) hierarchy[p.region][p.district] = [];
      hierarchy[p.region][p.district].push(p);
    });
    return hierarchy;
  };

  return {
    all: organize(null),
    digitised: organize(p => p.urlDigitized),
    current: organize(p => p.finalYear === "9999")
  };
};
