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
    " places.";
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");

  const columnCount = 4;
  var itemCount = data.stats.count + data.stats.regions;
  var columnSize = Math.ceil(itemCount / columnCount);

  var currentColumn = appendDiv(box, "columnbox");
  var currentColumnCount = 0;

  for (var heading in data.lists) {
    appendDiv(currentColumn, "columnheading", heading);
    currentColumnCount += 1;

    for (var i = 0; i < data.lists[heading].length; i++) {
      title = data.lists[heading][i].title;
      url = "newspaper.html?id=" + data.lists[heading][i].id;

      div = appendDiv(currentColumn, "columnitem");
      appendLink(div, url, title);
      appendText(
        div,
        ", " +
          data.lists[heading][i].firstYear +
          "-" +
          data.lists[heading][i].finalYear +
          ", of " +
          data.lists[heading][i].placename
      );
      currentColumnCount += 1;

      if (currentColumnCount >= columnSize) {
        currentColumn = appendDiv(box, "columnbox");
        currentColumnCount = 0;
      }
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
