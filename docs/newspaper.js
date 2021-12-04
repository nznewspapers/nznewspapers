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

function prettyYear(year) {
  if (year.endsWith("uuuu")) {
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
 * Fill in the page title information.
 * @param {*} data Data describing the page comtent.
 */
function bannerBox(newspaper) {
  var box = document.querySelector(".bannerbox");
  var heading2 = document.querySelector("#pagetitle");
  heading2.innerHTML = newspaper.title;
}

/**
 * Fill in the Newspaper Title and summary information.
 * @param {*} newspaper Data describing this newspaper.
 */
function contentBox(newspaper) {
  var box = document.querySelector(".contentbox");

  var genreDiv = appendDiv(box, "genre");
  var para = document.createElement("p");
  var aboutText = document.createElement("em");
  aboutText.textContent = newspaper.genre;
  para.appendChild(aboutText);

  if (newspaper.urlCurrent) {
    appendText(para, " - ");
    appendLink(para, newspaper.urlCurrent, newspaper.title + " Website");
  }

  if (newspaper.urlDigitized) {
    appendText(para, " - ");
    appendLink(para, newspaper.urlDigitized, "Digitized Paper");
  }
  genreDiv.appendChild(para);

  // About this title
  var aboutDiv = appendDiv(box, "about");
  var aboutText = document.createElement("h3");
  aboutText.textContent = "About this Title";

  // Title has been published since 1938 in Opotiki (Opotiki District, Bay of Plenty). View online.
  aboutDiv.appendChild(aboutText);
  appendText(aboutDiv, newspaper.title);
  if (newspaper.finalYear == 9999) {
    appendText(
      aboutDiv,
      " has been published since " + prettyYear(newspaper.firstYear)
    );
  } else {
    appendText(
      aboutDiv,
      " was published from " +
        prettyYear(newspaper.firstYear) +
        " to " +
        prettyYear(newspaper.finalYear)
    );
  }
  appendText(
    aboutDiv,
    " in " +
      newspaper.placename +
      " (" +
      newspaper.district +
      ", " +
      newspaper.region +
      ")."
  );

  if (newspaper.urlCurrent) {
    appendLink(aboutDiv, newspaper.urlCurrent, " View Online");
  }

  var tableDiv = appendDiv(box, "Key Elements");
  var tableText = document.createElement("h3");
  tableText.textContent = "Key Elements";
  tableDiv.appendChild(tableText);

  /* );<h3>About this title</h3>

      <p>
        <em><span id="newspaper-title">Title</span></em>
        has been published since <span class="first-year">1938</span> in
        <a href="place?place=Opotiki">Opotiki</a>
        (<a href="place?district=Opotiki District">Opotiki District</a>,
        <a href="place?region=Bay of Plenty">Bay of Plenty</a>).

        <a href="http://www.opotikinews.co.nz/">View online</a>.
      </p> */
}

async function render() {
  const data = await getPaper();
  console.log("AAA newspaper");
  console.log(data);

  document.title = data.title + " - Newspapers of New Zealand";
  bannerBox(data);
  contentBox(data);
}

render();
