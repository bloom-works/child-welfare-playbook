 window.addEventListener('DOMContentLoaded', async (e) => {

  // Initialize Pagefind
  const pagefind = await import("/pagefind/pagefind.js");
  const filters = await pagefind.filters();
  await pagefind.init();

  const activeFilters = {};

  const searchButton = document.querySelector("#search-button");
  const resultsWrapper = document.querySelector("#search-results");
  const searchTabs = document.querySelectorAll(".search-tab");
  const topicFilterWrapper = document.querySelector("#search-topic-filters");
  const topicFilters = topicFilterWrapper.querySelectorAll("input");
  const loadMoreButton = document.querySelector("#search-load-more");

  // Handle the search

  const updateSearch = async (searchType) => {

    const noResultsTemplate = document.querySelector("#search-no-results");
    const resultTemplate = document.querySelector("#search-result");

    const resultPane = document.createElement("div");

    const currentQuery = document.querySelector("#search-input").value;

    const search = await pagefind.search(
      currentQuery, {
        filters: activeFilters
      }
    );

    const resultCount = search.results.length;

    if (resultCount < 1) {
      resultPane.innerHTML = noResultsTemplate.innerHTML;
    } else {
      // Populate the search page with markup

      for (const i in search.results) {
        const thisResult = await search.results[i].data();

        const resultClone = resultTemplate.content.cloneNode(true);
        const resultLink = resultClone.querySelector("a");
        const resultTitle = resultClone.querySelector("h3");
        const resultExcerpt = resultClone.querySelector("p");

        resultLink.href = thisResult.url;
        resultTitle.innerHTML = thisResult.meta.title;
        resultExcerpt.innerHTML = thisResult.excerpt;

        resultPane.appendChild(resultClone);
      }
    }

    if (searchType === "query") {
      searchTabs.forEach(tab => {
        const counter = tab.querySelector("span");
        const type = tab.querySelector("input").dataset.typeFilter;
        if (type === "all") {
          counter.innerHTML = resultCount;
        } else {
          counter.innerHTML = search.filters["Page type"][type] || "0";
        }
      })
    }

    if (searchType !== "topic") {
      for (const topic in search.filters.topics) {
        const button = topicFilterWrapper.querySelector(`[data-topic-filter="${topic}"]`);
        const parentLabel = button.parentElement;
        const counter = button.nextElementSibling.nextElementSibling;

        if (search.filters.topics[topic] === 0) {
          parentLabel.hidden = true;
        } else {
          parentLabel.hidden = false;
          counter.innerHTML = search.filters.topics[topic];
        }
      };
    }

    resultsWrapper.innerHTML = resultPane.innerHTML;
  }

  searchButton.addEventListener('click', async (e) => {
    e.preventDefault();
    updateSearch("query");
  });

  topicFilters.forEach(input => {

    const inputTopic = input.dataset.topicFilter;

    input.addEventListener("input", (e) => {
      if (!input.checked) {
        if (activeFilters.topics.any.length === 1) {
          delete activeFilters.topics;
        } else {
          const index = activeFilters.topics.any.indexOf(inputTopic);
          activeFilters.topics.any.splice(index,1);
        }
      } else {
        if (!activeFilters.topics) {
          activeFilters.topics = new Object();
          activeFilters.topics.any = new Array();
        }
        activeFilters.topics.any.push(inputTopic);
      }
      updateSearch("topic");
    })
  });

  searchTabs.forEach(tab => {
    tab.addEventListener('input', async (e) => {
      const currentType = e.target.dataset.typeFilter;

      if (currentType === "all") {
        delete activeFilters["Page type"];
      } else {
        activeFilters["Page type"] = currentType;
      }

      updateSearch("type");
    });

  });

});