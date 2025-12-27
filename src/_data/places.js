const getPapers = require("./papers");

module.exports = function () {
  const papers = getPapers();
  
  // Sort by sortPlace (Placecode + Placename + Year)
  // This effectively groups by Region (North to South), then District, then Place.
  papers.sort((a, b) => a.sortPlace.localeCompare(b.sortPlace));

  const organize = (filterFn) => {
    const regionMap = new Map(); // Map<RegionName, DistrictMap>
    const districtMap = new Map(); // Map<RegionName+DistrictName, Paper[]>

    const filteredPapers = filterFn ? papers.filter(filterFn) : papers;

    filteredPapers.forEach(p => {
        // 1. Ensure Region exists in Map (preserves insertion order)
        if (!regionMap.has(p.region)) {
            regionMap.set(p.region, new Map());
        }

        // 2. Ensure District exists in that Region (preserves insertion order)
        const districtsInRegion = regionMap.get(p.region);
        if (!districtsInRegion.has(p.district)) {
            districtsInRegion.set(p.district, []);
        }

        // 3. Add paper
        districtsInRegion.get(p.district).push(p);
    });

    // Convert to Array structure for templates
    const result = [];
    for (const [regionName, districtsInRegion] of regionMap) {
        const districtsArray = [];
        for (const [districtName, paperList] of districtsInRegion) {
            districtsArray.push({
                name: districtName,
                papers: paperList
            });
        }
        result.push({
            name: regionName,
            districts: districtsArray
        });
    }
    return result;
  };

  return {
    all: organize(null),
    digitised: organize(p => p.urlDigitized),
    current: organize(p => p.finalYear === "9999")
  };
};
