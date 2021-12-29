console.log("Call it a title");

async function getTitleInfo() {
  const url = "data/titleInfo.json";

  try {
    let res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log("Error in getTitleInfo");
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
  heading2.innerHTML = data.stats.count + " New Zealand Newspapers";
}

/**
 * Fill in the page title and content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");

  const columnCount = 4;
  var itemCount = data.stats.count + data.stats.headings;
  var columnSize = Math.ceil(itemCount / columnCount);

  var currentColumn = appendDiv(box, "columnbox");
  var currentColumnCount = 0;

  for (var heading in data.lists) {
    appendDiv(currentColumn, "columnheading", heading);
    currentColumnCount += 1;

    for (var i = 0; i < data.lists[heading].length; i++) {
      newspaper = data.lists[heading][i];

      div = appendDiv(currentColumn, "columnitem");
      appendNewspaperInfo(div, newspaper);

      currentColumnCount += 1;
      if (currentColumnCount >= columnSize) {
        currentColumn = appendDiv(box, "columnbox");
        currentColumnCount = 0;
      }
    }
  }
}
async function render() {
  const data = await getTitleInfo();
  console.log(data.stats.count);

  document.title =
    "Newspapers of New Zealand: " +
    data.stats.count +
    " New Zealand Newspapers";

  bannerBox(data);
  contentBox(data);
}

render();
