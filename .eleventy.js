const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  // Pass through the assets folder directly to the output
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  eleventyConfig.addFilter("prettyYear", function(year) {
      if (!year) return "";
      year = year.toString();
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
  });

  return {
    dir: {
      input: "src",
      output: "docs", // Output to docs for GitHub Pages
    },
  };
};
