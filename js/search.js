window.addEventListener('DOMContentLoaded', async (e) => {

  // Initialize Pagefind
  const pagefind = await import("/pagefind/pagefind.js");
  const filters = await pagefind.filters();
  await pagefind.init();

  const activeFilters = {};

  // Select elements
  const searchButton = document.querySelector("#search-button");
  const searchContent = document.querySelector(".search-content");
  const resultsWrapper = document.querySelector("#search-results");
  const allResultsCounter = document.querySelector(`label[for="type-all"] .search-counter`);

  const allFilters = document.querySelectorAll("#search-filters label");
  const typeFilters = document.querySelectorAll ("#search-type-filters label");
  const topicFilters = document.querySelectorAll("#search-topic-filters label");
  const resultCountText = document.querySelector("#search-result-count");
  let allResultsCount = 0;
  let visibleResultsCount;

  const pluralizeResultCount = resultCount => {
    return (resultCount === 1) ? `${resultCount} result` : `${resultCount} results`;
  };

  // Handle each search
  const updateSearch = async (searchType) => {
    // Get markup templates
    const noResultsTemplate = document.querySelector("#search-no-results");
    const noMatchesTemplate = document.querySelector("#search-no-matches");
    const resultTemplate = document.querySelector("#search-result");

    const currentQuery = document.querySelector("#search-input").value;

    // If the user has already filtered their search,
    // store the filters so we can re-apply them once the
    // search is done

    const currentTopicFilter = activeFilters.topics;
    const currentTypeFilter = activeFilters.pageType;


    // For accurate result count numbers,
    // always retrieve unfiltered results for new search terms
    if (searchType === "query") {
      activeFilters.topics = undefined;
      activeFilters.pageType = undefined;
    }

    // Conduct search
    const search = await pagefind.search(
      currentQuery, {
        filters: activeFilters
      }
    );


    // Populate the search page with markup
    const resultPane = document.createElement("div");

    if (searchType === "query") {
      allResultsCount = search.results.length;
      visibleResultsCount = allResultsCount;
      allResultsCounter.innerHTML = allResultsCount;
    } else {
      visibleResultsCount = search.results.length;
    }


    // Populate result count
    if (allResultsCount < 1) {
      resultPane.innerHTML = noResultsTemplate.innerHTML;
    } else if (visibleResultsCount < 1) {
      resultPane.innerHTML = noMatchesTemplate.innerHTML;
    } else if (visibleResultsCount !== allResultsCount) {
      resultCountText.innerHTML = `Showing ${visibleResultsCount} of ${pluralizeResultCount(allResultsCount)}`;
    } else {
      resultCountText.innerHTML = pluralizeResultCount(allResultsCount);
    }

    // Populate search results
    if (visibleResultsCount >= 1) {
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

    // Show the search content area
    searchContent.hidden = false;

    // Populate the number of results next to each
    // type filter (e.g. "Stories," "Resources," etc.)
    for (const filter of allFilters) {
      const input = filter.querySelector("input");
      const filterType = input.dataset.typeFilter ? "pageType" : "topics";
      const counter = filter.querySelector(".search-counter");
      const criteria = input.dataset.typeFilter || input.dataset.topicFilter;
      const count = search.filters[filterType][criteria];
      if (count && searchType === "query") {
        counter.innerHTML = count;
        filter.hidden = false;
      }
    }

    if (currentTopicFilter) {
      activeFilters.topics = currentTopicFilter;
    }

    if (currentTypeFilter) {
      activeFilters.pageType = currentTypeFilter;
    }

    resultsWrapper.innerHTML = resultPane.innerHTML;
  }

  // Handle new search queries
  searchButton.addEventListener('click', async (e) => {
    e.preventDefault();
    updateSearch("query");
  });

  // Handle updates to topic filters
  for (const filter of topicFilters) {

    const input = filter.querySelector("input");
    const criteria = input.dataset.topicFilter;

    input.addEventListener("change", (e) => {
      if (!activeFilters.topics) {
        activeFilters.topics = new Object();
        activeFilters.topics.any = new Array();
      }
      if (!input.checked) {
        if (activeFilters.topics.any.length === 1) {
          activeFilters.topics = undefined;
        } else {
          const index = activeFilters.topics.any.indexOf(criteria);
          activeFilters.topics.any.splice(index,1);
        }
      } else {

        activeFilters.topics.any.push(criteria);
      }
      updateSearch("topic");
    })
  };

  // Handle updates to type filter
  for (const tab of typeFilters) {
    tab.addEventListener('change', async (e) => {
      const currentType = e.target.dataset.typeFilter;

      if (currentType === "all") {
        activeFilters.pageType = undefined;
      } else {
        activeFilters.pageType = currentType;
      }

      updateSearch("type");
    });

  };

});