module.exports = function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");

  // Tree children JSON (produced by Django export_frontend_data command)
  eleventyConfig.addPassthroughCopy({ "data/children": "data/children" });

  // Watch for changes in CSS/JS during dev
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  // Custom filters
  eleventyConfig.addFilter("limit", function(arr, limit) {
    return arr.slice(0, limit);
  });

  eleventyConfig.addFilter("formatDate", function(dateStr) {
    if (!dateStr) return "";
    return dateStr;
  });

  eleventyConfig.addFilter("numberFormat", function(num) {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  });

  eleventyConfig.addFilter("sortByOrder", function(arr, orderArray) {
    if (!arr || !orderArray) return arr;
    return orderArray
      .map(code => arr.find(item => item.code === code))
      .filter(item => item !== undefined);
  });

  eleventyConfig.addFilter("filterByRepo", function(arr, repoCode) {
    if (!arr || !repoCode) return [];
    return arr.filter(item => item.repository_code === repoCode);
  });

  eleventyConfig.addFilter("filterByLevel", function(arr, level) {
    if (!arr || !level) return [];
    return arr.filter(item => item.description_level === level);
  });

  // Filter to get children of a description by parent_id (cached for performance)
  let childrenMap = null;
  eleventyConfig.addFilter("childrenOf", function(arr, parentId) {
    if (!arr || !parentId) return [];
    if (!childrenMap) {
      childrenMap = new Map();
      for (const item of arr) {
        if (item.parent_id) {
          if (!childrenMap.has(item.parent_id)) {
            childrenMap.set(item.parent_id, []);
          }
          childrenMap.get(item.parent_id).push(item);
        }
      }
    }
    return childrenMap.get(parentId) || [];
  });

  // Clear children cache on rebuild (watch mode)
  eleventyConfig.on("eleventy.before", function() {
    childrenMap = null;
  });

  // Find repository by code string
  eleventyConfig.addFilter("findRepoByCode", function(repos, code) {
    if (!repos || !code) return null;
    return repos.find(r => r.code === code);
  });

  // Filter to find description by reference_code
  eleventyConfig.addFilter("findByRef", function(arr, refCode) {
    if (!arr || !refCode) return null;
    return arr.find(item => item.reference_code === refCode);
  });

  // Build breadcrumb array from parent chain
  eleventyConfig.addFilter("buildBreadcrumb", function(descriptions, desc) {
    if (!descriptions || !desc) return [];
    const breadcrumb = [];
    let current = desc;

    // Walk up the parent chain
    while (current && current.parent_reference_code) {
      const parent = descriptions.find(d => d.reference_code === current.parent_reference_code);
      if (parent) {
        breadcrumb.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return breadcrumb;
  });

  // Get siblings (other children of same parent)
  eleventyConfig.addFilter("siblingsOf", function(arr, desc) {
    if (!arr || !desc) return [];
    return arr.filter(item =>
      item.parent_id === desc.parent_id &&
      item.id !== desc.id
    );
  });

  // Extract year from a date string ("YYYY-MM-DD" → "YYYY")
  eleventyConfig.addFilter("extractYear", function(dateStr) {
    if (!dateStr) return null;
    const year = String(dateStr).substring(0, 4);
    return /^\d{4}$/.test(year) ? year : null;
  });

  // Truncate text with ellipsis
  eleventyConfig.addFilter("truncate", function(str, length) {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  });

  // Build progress logging
  let pageCount = 0;
  const buildStart = Date.now();
  eleventyConfig.addTransform("progress", function(content) {
    pageCount++;
    if (pageCount % 5000 === 0) {
      const elapsed = ((Date.now() - buildStart) / 1000).toFixed(0);
      console.log(`[build] ${pageCount.toLocaleString()} pages generated (${elapsed}s)`);
    }
    return content;
  });

  eleventyConfig.on("eleventy.after", function() {
    const elapsed = ((Date.now() - buildStart) / 1000).toFixed(1);
    console.log(`[build] Complete: ${pageCount.toLocaleString()} pages in ${elapsed}s`);
  });

  // Shortcodes for common patterns
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
