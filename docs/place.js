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

  const columnCount = 4;
  var itemCount = data.stats.count + 10;
  var columnSize = Math.ceil(itemCount / columnCount);

  var currentColumn = appendDiv(box, "columnbox");
  var currentDecade = null;
  var currentColumnCount = 0;

  for (var id in data.papers) {
    currentColumnCount += 1;

    title = data.papers[id].title;
    url = "newspaper.html?id=" + id;
    firstYear = data.papers[id].firstYear;
    decade = firstYear.substring(0, 3) + "0s";

    // Decade heading:
    if (decade != currentDecade) {
      appendDiv(currentColumn, "columnheading", decade);
      currentDecade = decade;
    }

    // Newspapers:
    div = appendDiv(currentColumn, "columnitem");
    appendLink(div, url, title);
    appendText(div, ", " + firstYear + "-" + data.papers[id].finalYear + ".");
    currentColumnCount += 1;

    if (currentColumnCount >= columnSize) {
      currentColumn = appendDiv(box, "columnbox");
      currentColumnCount = 0;
    }
  }
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
