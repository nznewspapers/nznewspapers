/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function titleBox(data) {
  var box = document.querySelector(".bannerbox");
  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML =
    data.stats.count +
    " Newspapers from " +
    data.stats.districts +
    " districts in " +
    data.stats.regions +
    " regions";
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");

  const columnCount = 4;
  var itemCount = data.stats.count + data.stats.districts + data.stats.regions;
  var columnSize = Math.ceil(itemCount / columnCount);
  console.log(itemCount);

  var currentColumn = appendDiv(box, "columnbox");
  var currentColumnCount = 0;

  for (var i = 0; i < data.lists.regionList.length; i++) {
    region = data.lists.regionList[i];
    console.log(region);

    appendDiv(currentColumn, "columnheading", region);
    currentColumnCount += 1;

    districtList = data.lists[region]["districtList"];

    for (var j = 0; j < districtList.length; j++) {
      district = districtList[j];
      console.log(region + " - " + district);

      appendDiv(currentColumn, "columnsubheading", district);
      currentColumnCount += 1;

      newspaperList = data.lists[region][district];

      for (var k = 0; k < newspaperList.length; k++) {
        title = newspaperList[k].title;
        url = "newspaper.html?id=" + newspaperList[k].id;

        div = appendDiv(currentColumn, "columnitem");
        currentColumnCount += 1;
        appendLink(div, url, title);
        appendText(
          div,
          ", " +
            newspaperList[k].firstYear +
            "-" +
            newspaperList[k].finalYear +
            ", of " +
            newspaperList[k].placename +
            " : " +
            currentColumnCount +
            "/" +
            columnSize +
        );
      }
    }

    if (currentColumnCount >= columnSize) {
      currentColumn = appendDiv(box, "columnbox");
      currentColumnCount = 0;
    }
  }
}

async function render() {
  const data = await readJsonUrl("data/placeInfo.json");
  console.log(data.stats.count);

  document.title =
    "Newspapers of New Zealand: " +
    data.stats.count +
    " New Zealand Newspapers";

  titleBox(data);
  contentBox(data);
}

render();
