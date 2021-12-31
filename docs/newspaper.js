/**
 * Load the data for a single newspaper.
 * @returns
 */
async function getPaper() {
  const urlParams = new URLSearchParams(window.location.search);
  const newspaperId = urlParams.get("id");
  const url = "data/papers/" + newspaperId + ".json";

  try {
    let res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log("Error in getPaper");
    console.log(error);
  }
}

/**
 * Append a table row to a table body
 * @param {*} tbody The body of the table
 * @param {*} field The field name that we are adding
 * @param {*} value The value of said field
 */
function appendRow(tbody, field, value) {
  var row = document.createElement("tr");
  var row_data_field = document.createElement("td");
  row_data_field.innerHTML = field;
  var row_data_value = document.createElement("td");
  if (typeof value == "object") {
    row_data_value.appendChild(value);
  } else {
    row_data_value.innerHTML = value;
  }

  row.appendChild(row_data_field);
  row.appendChild(row_data_value);
  tbody.appendChild(row);
}

/**
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function bannerBox(newspaper) {
  var box = document.querySelector(".bannerbox");

  var heading2 = document.querySelector("#newspapertitle");
  heading2.innerHTML = newspaper.title;

  var infoDiv = appendDiv(box, "links");
  appendLink(
    infoDiv,
    "place.html?place=" + newspaper.placename,
    newspaper.placename + " " + newspaper.genre
  );
  appendText(infoDiv, " - ");
  if (newspaper.urlCurrent) {
    appendLink(infoDiv, newspaper.urlCurrent, "Available Online");
  } else if (newspaper.isCurrent) {
    appendText(infoDiv, "No Known Website");
  } else {
    appendText(infoDiv, "Not Current");
  }
  appendText(infoDiv, " - ");
  if (newspaper.urlDigitized) {
    appendLink(infoDiv, newspaper.urlDigitized, "Available Digitized");
  } else {
    appendText(infoDiv, "Not Digitised");
  }
  box.appendChild(infoDiv);
}

/**
 * Fill in the Newspaper Title and summary information.
 * @param {*} newspaper Data describing this newspaper.
 */
function contentBox(newspaper) {
  var box = document.querySelector(".contentbox");

  // About this title
  var aboutDiv = appendDiv(box, "about");
  var aboutThisTitleHeading = document.createElement("h3");
  aboutThisTitleHeading.textContent = "About this Title";

  // Title has been published since 1938 in Opotiki (Opotiki District, Bay of Plenty). View online.
  aboutDiv.appendChild(aboutThisTitleHeading);

  var aboutText = document.createElement("p");
  appendText(aboutText, newspaper.title);
  if (newspaper.finalYear == 9999) {
    appendText(
      aboutText,
      " has been published since " + prettyYear(newspaper.firstYear)
    );
  } else {
    appendText(
      aboutText,
      " was published from " +
        prettyYear(newspaper.firstYear) +
        " to " +
        prettyYear(newspaper.finalYear)
    );
  }
  appendText(aboutText, " in " + newspaper.placename);
  if (newspaper.placename != "Auckland") {
    appendText(
      aboutText,
      " (" + newspaper.district + ", " + newspaper.region + ")"
    );
  }
  appendText(aboutText, ".");
  aboutDiv.appendChild(aboutText);

  // Insert Key Elements table
  linkTable(box, newspaper);
  keyElements(box, newspaper);

  /* We need to add the "referencews" section here, it used to look like this:
  
      <h3>About this title</h3>
      <p>
        <em><span id="newspaper-title">Title</span></em>
        has been published since <span class="first-year">1938</span> in
        <a href="place?place=Opotiki">Opotiki</a>
        (<a href="place?district=Opotiki District">Opotiki District</a>,
        <a href="place?region=Bay of Plenty">Bay of Plenty</a>).

        <a href="http://www.opotikinews.co.nz/">View online</a>.
      </p> */
}

function linkTable(box, newspaper) {
  var linkTableDiv = appendDiv(box, "links");

  if (newspaper.links == null) {
    console.log("There are no related newspapers at this time.");
  } else {
    linkKeys = Object.keys(newspaper.links);

    // Set up table
    var linktable = appendElement(linkTableDiv, "table", "linktable");
    var linkthead = appendElement(linktable, "thead");
    var linktbody = appendElement(linktable, "tbody");

    // Adding the entire table to the body tag
    linkTableDiv.appendChild(linktable);

    // Creating and the link header row:
    var headerRow = appendElement(linkthead, "tr");
    appendElement(headerRow, "th", null, "Preceded By");
    appendElement(headerRow, "th", null, "Related To");
    appendElement(headerRow, "th", null, "Succeeded By");

    // Create and add the links:
    var infoRow = appendElement(linktbody, "tr");
    var precedeCell = appendElement(infoRow, "td", null);
    var relateCell = appendElement(infoRow, "td", null);
    var succeedCell = appendElement(infoRow, "td", null);

    linkKeys.forEach(function (key) {
      var direction = newspaper.links[key]["direction"];
      var targetDescription = newspaper.links[key]["target-description"];
      var relationship = newspaper.links[key]["relationship"];
      if (relationship == null) {
        relationship = direction;
      }

      if (direction == "Preceding" || relationship == "Continues") {
        div = appendElement(precedeCell, "div");
        appendText(div, relationship + ": ");
        appendLink(div, "newspaper.html?id=" + key, targetDescription);
      } else if (direction == "Succeeding" || relationship == "Continued By") {
        div = appendElement(succeedCell, "div");
        appendText(div, relationship + ": ");
        appendLink(div, "newspaper.html?id=" + key, targetDescription);
      } else {
        div = appendElement(relateCell, "div");
        appendText(div, relationship + ": ");
        appendLink(div, "newspaper.html?id=" + key, targetDescription);
      }
    });
  }
}

function keyElements(box, newspaper) {
  var tableDiv = appendDiv(box, "elements");
  var tableText = document.createElement("h3");
  tableText.textContent = "Key Elements";
  tableDiv.appendChild(tableText);

  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let tbody = document.createElement("tbody");

  var classAttr = document.createAttribute("class");
  classAttr.value = "simpletable";
  table.setAttributeNode(classAttr);

  table.appendChild(thead);
  table.appendChild(tbody);

  // Adding the entire table to the body tag
  tableDiv.appendChild(table);

  // Creating and adding data to first row of the table
  let row_1 = document.createElement("tr");
  let heading_1 = document.createElement("th");
  heading_1.innerHTML = "Field";
  let heading_2 = document.createElement("th");
  heading_2.innerHTML = "Value";

  row_1.appendChild(heading_1);
  row_1.appendChild(heading_2);
  thead.appendChild(row_1);

  appendRow(tbody, "Title", newspaper.title);
  appendRow(tbody, "Genre", newspaper.genre);
  appendRow(tbody, "First Year", newspaper.firstYear);
  appendRow(tbody, "Is Current", newspaper.isCurrent);
  if (!newspaper.isCurrent) {
    appendRow(tbody, "Final Year", newspaper.finalYear);
  }
  appendRow(tbody, "Frequency", newspaper.frequency);
  if (newspaper.urlCurrent) {
    appendRow(
      tbody,
      "Current URL",
      createLink(newspaper.urlCurrent, newspaper.urlCurrent)
    );
  }
  if (newspaper.urlDigitized) {
    var link = createLink(newspaper.urlDigitized, newspaper.urlDigitized);
    appendRow(tbody, "Digitised URL", link);
  }

  appendRow(tbody, "NLNZ MARC Number", newspaper.idMarcControlNumber);
  //took out the other id numbers, is this useful?

  // appendRow(tbody, "Placecode", newspaper.placecode);
  appendRow(
    tbody,
    "Place",
    createLink("place.html?place=" + placename, placename)
  );
  appendRow(tbody, "District", newspaper.district);
  appendRow(tbody, "Region", newspaper.region);
  return classAttr;
}

async function render() {
  const data = await getPaper();
  console.log("A newspaper");
  console.log(data);

  document.title = data.title + " - Newspapers of New Zealand";
  bannerBox(data);
  contentBox(data);
}

render();
