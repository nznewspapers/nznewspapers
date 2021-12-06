console.log("Call it a title");

async function getHomeInfo() {
  const url = "data/homeInfo.json";

  try {
    let res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log("Error in getHomeInfo");
    console.log(error);
  }
}

/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function titleBox(data) {
  var box = document.querySelector(".bannerbox");
  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML =
    data.stats.count +
    " New Zealand Newspapers from " +
    data.stats.places +
    " places";
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");

  const columnCount = 4;
  var itemCount = data.stats.places + data.stats.regions;
  var columnSize = Math.ceil(itemCount / columnCount);

  var currentColumn = appendDiv(box, "columnbox");

  appendDiv(currentColumn, "columnheading", "Welcome!");
  introDiv = appendDiv(currentColumn, "columnitem");
  appendText(
    introDiv,
    "This website tries to list every newspaper ever published in New Zealand. "
  );
  appendText(introDiv, "It's a work in progress. ");
  appendLink(introDiv, "about.html", "Find out more.");

  var currentColumnCount = 0;

  for (var heading in data.lists) {
    appendDiv(currentColumn, "columnheading", heading);
    currentColumnCount += 1;

    for (var placename in data.lists[heading]) {
      div = appendDiv(currentColumn, "columnitem");
      url = "place.html?place=" + placename;

      appendLink(div, url, placename);
      appendText(div, " (" + data.lists[heading][placename] + ")");
      currentColumnCount += 1;
    }

    if (currentColumnCount >= columnSize) {
      currentColumn = appendDiv(box, "columnbox");
      currentColumnCount = 0;
    }
  }
}

async function render() {
  const data = await getHomeInfo();
  console.log(data.stats.count);

  document.title =
    "Newspapers of New Zealand: " +
    data.stats.count +
    " New Zealand Newspapers";

  titleBox(data);
  contentBox(data);
}

render();
