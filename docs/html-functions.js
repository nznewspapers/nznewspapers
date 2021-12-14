console.log("Call it functional");

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
