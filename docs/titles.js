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

function appendDiv(parent, className, divInnerHtml) {
  var div = document.createElement("div");
  var classAttr = document.createAttribute("class");
  classAttr.value = className;
  div.setAttributeNode(classAttr);
  if (divInnerHtml) div.innerHTML = divInnerHtml;
  parent.appendChild(div);
  return div;
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text));
}

function appendLink(parent, url, text) {
  var link = document.createElement("a");
  var href = document.createAttribute("href");
  href.value = url;
  link.setAttributeNode(href);
  link.textContent = text;
  parent.appendChild(link);
}

/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function titleBox(data) {
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
      text = data.lists[heading][i].title;
      text += " / " + currentColumnCount;
      appendDiv(currentColumn, "columnitem", text);
      currentColumnCount += 1;
    }

    if (currentColumnCount >= columnSize) {
      currentColumn = appendDiv(box, "columnbox");
      currentColumnCount = 0;
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

  titleBox(data);
  contentBox(data);
}

render();
