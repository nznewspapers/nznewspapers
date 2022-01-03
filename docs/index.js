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
 * Fill in the page banner (title information).
 * @param {*} data Data describing the page comtent.
 */
function bannerBox(data) {
  var box = document.querySelector(".bannerbox");
  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML =
    data.stats.count +
    " New Zealand Newspapers from " +
    data.stats.places +
    " places";
}

/**
 * Fill in the page content.
 * @param {*} data Data describing this newspaper.
 */
function contentBox(data) {
  var box = document.querySelector(".contentbox");
  var multicolumnDiv = appendDiv(box, "multicolumnbox");

  appendDiv(multicolumnDiv, "columnheading", "Welcome!");
  introDiv = appendDiv(multicolumnDiv, "columnitem");
  appendText(
    introDiv,
    "This website tries to list every newspaper ever published in New Zealand. "
  );
  appendText(introDiv, "It's a work in progress. ");
  appendLink(introDiv, "about.html", "Find out more.");

  for (var heading in data.lists) {
    appendDiv(multicolumnDiv, "columnheading", heading);

    var regionList = Object.keys(data.lists[heading]).sort();
    regionList.forEach(function (placename) {
      div = appendDiv(multicolumnDiv, "columnitem");

      url = "place.html?place=" + placename;
      appendLink(div, url, placename);
      appendText(div, " (" + data.lists[heading][placename] + ")");
    });
  }
}

async function render() {
  const data = await getHomeInfo();
  console.log("NzNewspapers: " + data.stats.count);

  document.title =
    "Newspapers of New Zealand: " +
    data.stats.count +
    " New Zealand Newspapers";

  bannerBox(data);
  contentBox(data);
}

render();
