const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  
  // Sort by sortPlace (North to South)
  papers.sort((a, b) => a.sortPlace.localeCompare(b.sortPlace));

  // 1. Total Count
  const count = papers.length;
  const digitisedCount = papers.filter(p => p.urlDigitized).length;
  const currentCount = papers.filter(p => p.finalYear === "9999").length;

  // 2. Places Count (Unique placenames)
  const places = new Set(papers.map(p => p.placename)).size;

  // 3. Regions breakdown (Ordered Array)
  const regionMap = new Map();

  papers.forEach(p => {
    if (!regionMap.has(p.region)) {
      regionMap.set(p.region, new Map());
    }
    const placeMap = regionMap.get(p.region);
    if (!placeMap.has(p.placename)) {
      placeMap.set(p.placename, 0);
    }
    placeMap.set(p.placename, placeMap.get(p.placename) + 1);
  });

  const regionsList = [];
  for (const [regionName, placeMap] of regionMap) {
    const placesInRegion = [];
    for (const [placename, paperCount] of placeMap) {
        placesInRegion.push({
            name: placename,
            count: paperCount
        });
    }
    // Sort places within region alphabetically (standard for the homepage lists)
    placesInRegion.sort((a, b) => a.name.localeCompare(b.name));
    
    regionsList.push({
      name: regionName,
      places: placesInRegion
    });
  }

  const regions = regionsList.length;
  // Calculate districts count
  const districtsSet = new Set(papers.map(p => p.district));
  const districts = districtsSet.size;

  return {
    count,
    digitisedCount,
    currentCount,
    places,
    regions,
    districts,
    lists: regionsList
  };
};
