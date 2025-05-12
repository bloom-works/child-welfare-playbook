import yaml from "js-yaml";
import markdownIt from "markdown-it";
import markdownLibrary from "./markdown.js";
import svgSprite from "eleventy-plugin-svg-sprite";
import eleventyAutoCacheBuster from "eleventy-auto-cache-buster";
import dateFilters from './filters/dateFilters.js'


const alphaSort = (a, b) => {
  if (a.data.title < b.data.title) {
    return -1;
  } else if (a.data.title > b.data.title) {
    return 1;
  } else {
    return 0;
  }
};

const topicList = [
  "background-checks",
  "emergency-placements",
  "extended-foster-care",
  "finding-kin",
  "inquiry management",
  "licensing",
  "prevention",
  "recruitment",
  "relative-licensing-exceptions",
  "retention",
  "sibling-connections",
  "social-media",
  "supportive-adult-connections"
];

export default async function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyAutoCacheBuster);

  eleventyConfig.addPassthroughCopy("./images/");
  eleventyConfig.addPassthroughCopy("./js/");

  eleventyConfig.addDataExtension("yml", (contents) => yaml.load(contents));

  const md = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
  });

  eleventyConfig.setLibrary('md', markdownLibrary);

  eleventyConfig.addNunjucksFilter("md", (markdownString) =>
    md.render(markdownString),
    );

  eleventyConfig.addPlugin(svgSprite, {
    path: "./icons", // relative path to SVG directory
    svgShortcode: "icon"
  });

  // Human-readable dates

  Object.keys(dateFilters).forEach(filterName => {
      eleventyConfig.addFilter(filterName, dateFilters[filterName])
  })

  // All plays sorted alphabetically

  eleventyConfig.addCollection("playsAlpha", (collection) =>
    collection.getFilteredByGlob("plays/*.md").sort(alphaSort)
  );

  for (let topic in topicList) {
    eleventyConfig.addCollection(`${topicList[topic]}-plays`, function (collectionsApi) {
      return collectionsApi.getFilteredByTags('play', `${topicList[topic]}`).sort(alphaSort);
    });
  }


  // Stories

  eleventyConfig.addCollection("stories", (collection) =>
    collection.getFilteredByGlob("stories/*.md")
  );
}