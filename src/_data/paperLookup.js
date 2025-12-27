const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  const lookup = {};
  
  papers.forEach(p => {
    lookup[p.id] = p;
  });

  return lookup;
};
