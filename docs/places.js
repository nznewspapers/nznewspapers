/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function setPageTitle(mode, data) {
  // Set the web page title:
  document.title = "Newspapers of New Zealand";
  if (mode == "current") {
    document.title += ": " + data.stats.countCurrent + " current Newspapers";
  } else if (mode == "digitised") {
    document.title +=
      ": " + data.stats.countDigitized + " digitised Newspapers";
  } else {
    document.title += ": " + data.stats.count + " Newspapers";
  }

  // Set the "banner" displayed onscreen:
  var titleText = "";
  if (mode == "current") {
    titleText = data.stats.countCurrent + " current Newspapers";
  } else if (mode == "digitised") {
    titleText = data.stats.countDigitized + " digitised Newspapers";
  } else {
    titleText =
      data.stats.count +
      " Newspapers from " +
      data.stats.districts +
      " districts in " +
      data.stats.regions +
      " regions";
  }

  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML = titleText;
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(mode, data) {
  var box = document.querySelector(".contentbox");

  // Figure out how many columns, and howmany items in each column:
  const columnCount = 4;
  var itemCount = data.stats.districts + data.stats.regions;
  if (mode == "digitised") {
    itemCount += data.stats.countDigitized;
  } else if (mode == "current") {
    itemCount += data.stats.countCurrent;
  } else {
    itemCount += data.stats.count;
  }
  var columnSize = Math.ceil(itemCount / columnCount);

  // Start the first column:
  var currentColumn = appendDiv(box, "columnbox");
  var currentColumnCount = 0;

  for (var i = 0; i < data.lists.regionList.length; i++) {
    region = data.lists.regionList[i];

    appendDiv(currentColumn, "columnheading", region);
    currentColumnCount += 1;

    districtList = data.lists[region]["districtList"];

    for (var j = 0; j < districtList.length; j++) {
      district = districtList[j];

      appendDiv(currentColumn, "columnsubheading", district);
      currentColumnCount += 1;

      newspaperList = data.lists[region][district];

      newspaperList.forEach(function (newspaper) {
        if (
          mode == "all" ||
          (mode == "digitised" && newspaper.urlDigitized) ||
          (mode == "current" && newspaper.finalYear == "9999")
        ) {
          div = appendDiv(currentColumn, "columnitem");
          currentColumnCount += 1;
          appendNewspaperInfo(div, newspaper);
        }

        // Start a new column:
        if (currentColumnCount >= columnSize) {
          currentColumn = appendDiv(box, "columnbox");
          currentColumnCount = 0;
        }
      });
    }
  }
}

async function render() {
  // The "mode" parameter tells us if we are only showing digitised or current titles:
  const urlParams = new URLSearchParams(window.location.search);
  mode = "all";
  if (urlParams.get("mode")) {
    mode = urlParams.get("mode");
    if (mode != "current" && mode != "digitised") {
      mode = "all";
    }
  }

  // The placeInfo file holds all the papers, organized by place:
  const data = await readJsonUrl("data/placeInfo.json");

  // Finally, render the page:
  setPageTitle(mode, data);
  contentBox(mode, data);
}

render();
