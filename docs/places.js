/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function bannerBox(mode, data) {
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
  var multicolumnDiv = appendDiv(box, "multicolumnbox");

  for (var i = 0; i < data.lists.regionList.length; i++) {
    region = data.lists.regionList[i];
    appendDiv(multicolumnDiv, "columnheading", region);

    districtList = data.lists[region]["districtList"];
    for (var j = 0; j < districtList.length; j++) {
      district = districtList[j];
      appendDiv(multicolumnDiv, "columnsubheading", district);

      newspaperList = data.lists[region][district];
      newspaperList.forEach(function (newspaper) {
        if (
          mode == "all" ||
          (mode == "digitised" && newspaper.urlDigitized) ||
          (mode == "current" && newspaper.finalYear == "9999")
        ) {
          div = appendDiv(multicolumnDiv, "columnitem");
          appendNewspaperInfo(div, newspaper);
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
  console.log("Places: " + data.stats.count);

  // creates a canonical link tag:
  let canonicalUrl = "https://www.nznewspapers.org/newspaper.html";
  if (mode == "current" || mode == "digitised") {
    canonicalUrl += "?mode=" + mode;
  }
  let linkTag = document.createElement("link");
  linkTag.setAttribute("rel", "canonical");
  linkTag.href = canonicalUrl;
  document.head.appendChild(linkTag);

  // Finally, render the page:
  bannerBox(mode, data);
  contentBox(mode, data);
}

render();
