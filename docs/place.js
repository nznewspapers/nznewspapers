console.log("Call it a place");

/**
 * Load the data for a single place.
 */
async function getPlaceInfo() {
  const urlParams = new URLSearchParams(window.location.search);
  const placeName = urlParams.get("place");
  const url = "data/places/" + placeName + ".json";

  try {
    let res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log("Error in getPaper");
    console.log(error);
  }
}

/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function bannerBox(data) {
  var box = document.querySelector(".bannerbox");
  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML =
    data.stats.count + " " + data.stats.placename + " newspapers";
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");

  const numberOfColumns = 4;
  const itemCount = data.stats.count + data.stats.decades;
  const itemsPerColumn = Math.ceil(itemCount / numberOfColumns);

  var currentColumn = appendDiv(box, "columnbox");
  var currentDecade = null;
  var currentColumnItems = 0;

  data.papers.forEach(function (newspaper) {
    // for (var id in data.papers) {
    title = newspaper.title;
    url = "newspaper.html?id=" + newspaper.id;
    firstYear = newspaper.firstYear;
    decade = firstYear.substring(0, 3) + "0s";

    // Decade heading:
    if (decade != currentDecade) {
      currentColumnItems += 1;
      appendDiv(currentColumn, "columnheading", decade);
      currentDecade = decade;
    }

    // Newspapers:
    currentColumnItems += 1;
    div = appendDiv(currentColumn, "columnitem");
    appendLink(div, url, title);
    appendText(div, ", " + firstYear + "-" + newspaper.finalYear + ".");

    // Start new column:
    if (currentColumnItems >= itemsPerColumn) {
      currentColumn = appendDiv(box, "columnbox");
      currentColumnItems = 0;
    }
  });
}

async function render() {
  const data = await getPlaceInfo();
  console.log(data.stats.count);

  document.title =
    "Newspapers of New Zealand: " +
    data.stats.count +
    " " +
    data.stats.placename;
  (" Newspapers");

  bannerBox(data);
  contentBox(data);
}

render();
