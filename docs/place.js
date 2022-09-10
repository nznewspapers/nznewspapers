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

  var multicolumnDiv = null;
  if (data.stats.count < 6) {
    multicolumnDiv = appendDiv(box, "columnbox");
  } else {
    multicolumnDiv = appendDiv(box, "multicolumnbox");
  }

  var currentDecade = null;
  data.papers.forEach(function (newspaper) {
    firstYear = newspaper.firstYear;
    decade = firstYear.substring(0, 3) + "0s";

    // Decade heading:
    if (decade != currentDecade) {
      appendDiv(multicolumnDiv, "columnheading", decade);
      currentDecade = decade;
    }

    // Newspapers:
    div = appendDiv(multicolumnDiv, "columnitem");
    appendNewspaperInfo(div, newspaper);
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

  // creates a canonical link tag:
  let linkTag = document.createElement("link");
  linkTag.setAttribute("rel", "canonical");
  linkTag.href =
    "https://www.nznewspapers.org/place.html?place=" + data.stats.placename;
  document.head.appendChild(linkTag);

  // Finally, render the page:
  bannerBox(data);
  contentBox(data);
}

render();
