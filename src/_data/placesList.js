const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  const placesMap = {};

  papers.forEach(p => {
    const pname = p.placename;
    if (!placesMap[pname]) {
      placesMap[pname] = {
        name: pname,
        region: p.region,
        district: p.district,
        papers: []
      };
    }
    placesMap[pname].papers.push(p);
  });

  // Convert map to array
  const placesList = Object.values(placesMap);

  // Sort places alphabetically
  placesList.sort((a, b) => a.name.localeCompare(b.name));

  // Sort papers within each place
  placesList.forEach(place => {
    place.papers.sort((a, b) => {
        // Sort by first year, then title
        if (a.firstYear !== b.firstYear) {
            return a.firstYear - b.firstYear;
        }
        return a.title.localeCompare(b.title);
    });
  });

  return placesList;
};
