const fs = require('fs');
const path = require("path");
const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItOptions = {
  html: true,
  breaks: true,
  linkify: true
};

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addDataExtension("yml", (contents) => yaml.load(contents));

  const blogPosts = require('glob').sync('./src/_posts/blog/*.md');
  const matter = require('gray-matter');
  const markdownIt = require('markdown-it');
  const md = new markdownIt();

  eleventyConfig.addCollection("blog", function(collectionApi) {
    return blogPosts.map(file => {
      const content = fs.readFileSync(file, 'utf8');
      const { data, content: markdownContent } = matter(content);
      const htmlContent = md.render(markdownContent);
      return {
        ...data,
        content: htmlContent,
        fileSlug: path.basename(file, path.extname(file))
      };
    });
  });

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/cdn.min.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css":
      "./static/css/prism-tomorrow.css",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/assets");
  eleventyConfig.addPassthroughCopy("./src/static/img");
  eleventyConfig.addPassthroughCopy("./src/images");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  eleventyConfig.addPassthroughCopy("./src/favicon-180.png");
  eleventyConfig.addPassthroughCopy("./src/favicon-192.png");
  eleventyConfig.addPassthroughCopy("./src/favicon-512.png");
  eleventyConfig.addPassthroughCopy("./src/favicon.svg");
  eleventyConfig.addPassthroughCopy("./src/manifest.webmanifest");


  eleventyConfig.addNunjucksFilter("markdown", function(markdownString) {
    const md = new markdownIt(markdownItOptions).use(markdownItAttrs);
    return md.render(markdownString);
  });

  eleventyConfig.addShortcode("svg", function(iconPath) {
    iconPath = String(iconPath);
    return fs.readFileSync(path.join(__dirname, iconPath));
  });

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
  };
};