// console.log("Call it functional");

function createLink(url, text) {
  var link = document.createElement("a");
  var href = document.createAttribute("href");
  href.value = url;
  link.setAttributeNode(href);
  link.textContent = text;
  return link;
}

/**
 * Helper function that adds an attribute to an HTMLelement.
 * @param {*} parent Where we will add the new attribute.
 * @param {string} attrbuteName The name of the new atttribute.
 * @param {string} attributeValue The value to assign.
 */
function addAttribute(parent, attrbuteName, attributeValue) {
  var newAttribute = document.createAttribute(attrbuteName);
  newAttribute.value = attributeValue;
  parent.setAttributeNode(newAttribute);
}

/**
 * Helper function that creates a new HTML element and appends it to a parent element.
 * @param {*} parent Where we will add the new element.
 * @param {*} newElementName A required element name (e.g. "div" or "th" or "td")
 * @param {*} newClassName An optional class attribute for the element.
 * @param {*} newInnerHtml An Optional HTML fragment to put in the element.
 * @returns The new element.
 */
function appendElement(parent, newElementName, newClassName, newInnerHtml) {
  var newElement = document.createElement(newElementName);

  if (newClassName) {
    var classAttr = document.createAttribute("class");
    classAttr.value = newClassName;
    newElement.setAttributeNode(classAttr);
  }

  if (newInnerHtml) newElement.innerHTML = newInnerHtml;
  parent.appendChild(newElement);

  return newElement;
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
  const link = createLink(url, text);
  parent.appendChild(link);
  return link;
}

/**
 * Translate a MARC "year" into a short phrase, allowing for unknowns like 19uu.
 * @param {*} year The concise form of the year (may be partially unknown).
 * @returns A prettier form of the year.
 */
function prettyYear(year) {
  if (year.endsWith("uuu")) {
    return "an unknown date";
  } else if (year.endsWith("uu")) {
    var century = year.substring(0, 2);
    return "sometime in the " + century + "00's";
  } else if (year.endsWith("u")) {
    var decade = year.substring(0, 3);
    return "sometime in the " + decade + "0's";
  } else {
    return year;
  }
}

/**
 * Append an HTML sentence that describes a newspaper to an HTML element.
 * @param {} div An element that we're going to add the description too.
 * @param {*} newspaper An object that holds the newspaper info, including, id, title, placename, etc.
 */
function appendNewspaperInfo(div, newspaper) {
  url = "newspaper.html?id=" + newspaper.id;
  appendLink(div, url, newspaper.title);

  appendText(div, ", ");
  if (newspaper.finalYear == 9999) {
    appendText(div, " since " + prettyYear(newspaper.firstYear));
  } else {
    appendText(
      div,
      " from " +
        prettyYear(newspaper.firstYear) +
        " to " +
        prettyYear(newspaper.finalYear)
    );
  }

  if (newspaper.placename) {
    appendText(div, ", of ");
    url = "place.html?place=" + newspaper.placename;
    appendLink(div, url, newspaper.placename);
  }

  if (newspaper.urlDigitized || newspaper.urlCurrent) {
    appendText(div, ", is ");
  }
  if (newspaper.urlDigitized) {
    appendLink(div, newspaper.urlDigitized, "digitised");
  }
  if (newspaper.urlDigitized && newspaper.urlCurrent) {
    appendText(div, " and ");
  }
  if (newspaper.urlCurrent) {
    appendLink(div, newspaper.urlCurrent, "online");
  }

  appendText(div, ". ");
}

/*
 * Read a local JSON file to an object and return it.
 * @param {*} url The URL of the JSON file (usually relative to the curren tpage).
 * @returns
 */
async function readJsonUrl(url) {
  try {
    let res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log("Error reading JSON URL: " + url);
    console.log(error);
  }
}
