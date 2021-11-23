console.log("Whateverly ever after");

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
 * Fill in the Newspaper Title and summary information.
 * @param {*} newspaper Data describing this newspaper.
 */
function contentBox(newspaper) {
  var box = document.querySelector("#titlebox");

  var heading2 = document.querySelector("#newspaper-title");
  heading2.innerHTML = newspaper.title;

  var para = document.createElement("p");
  var genre = document.createElement("em");
  genre.textContent = newspaper.genre;
  para.appendChild(genre);

  if (newspaper.urlCurrent) {
    appendText(para, " - ");
    appendLink(para, newspaper.urlCurrent, newspaper.title + " Website");
  }

  if (newspaper.urlDigitized) {
    appendText(para, " - ");
    appendLink(para, newspaper.urlDigitized, "Digitized Paper");
  }

  box.appendChild(para);
}

async function render() {
  const newspaper = await getPaper();
  console.log("AAA newspaper");
  console.log(newspaper);

  document.title = newspaper.title + " - Newspapers of New Zealand";
  contentBox(newspaper);
}

render();
