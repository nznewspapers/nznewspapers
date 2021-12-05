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
 * Create a new HTML element and append it to a parent element.
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
