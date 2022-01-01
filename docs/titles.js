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
  var multicolumnDiv = appendDiv(box, "multicolumnbox");

  for (var heading in data.lists) {
    appendDiv(multicolumnDiv, "columnheading", heading);

    for (var i = 0; i < data.lists[heading].length; i++) {
      div = appendDiv(multicolumnDiv, "columnitem");
      newspaper = data.lists[heading][i];
      appendNewspaperInfo(div, newspaper);
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
