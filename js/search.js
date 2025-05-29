window.addEventListener('DOMContentLoaded', async (e) => {

  // Initialize Pagefind
  const pagefind = await import("/pagefind/pagefind.js");
  const filters = await pagefind.filters();
  await pagefind.init();

  const pageTypes = ["Play", "Story", "Resource", "Meeting", "Page"]

  const activeFilters = {};

  // Select elements
  const searchButton = document.querySelector("#search-button");
  const searchContent = document.querySelector(".search-content");
  const resultsWrapper = document.querySelector("#search-results");

  const allResultsInput = document.querySelector(`label[for="type-all"] input`);
  const allResultsCounter = document.querySelector(`label[for="type-all"] .search-counter`);

  const filterWrapper = document.querySelector("#search-filters");
  const allFilters = document.querySelectorAll("#search-filters label");
  const typeFilters = document.querySelectorAll ("#search-type-filters label");
  const topicFilters = document.querySelectorAll("#search-topic-filters label");
  const resultCountText = document.querySelector("#search-result-count");
  let allResultsCount = 0;
  let visibleResultsCount;

  let otherSearchCounts = {};

  const pluralizeResultCount = resultCount => {
    return (resultCount === 1) ? `${resultCount} result` : `${resultCount} results`;
  };

  // Handle each search
  const updateSearch = async (searchType, target) => {
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

    if (searchType === "query") {
      otherSearchCounts.all = search.filters.topics;

      otherSearchCounts.Play = await pagefind.search(
        currentQuery, {
          filters: {
            pageType: "Play"
          }
        }
      );

      otherSearchCounts.Story = await pagefind.search(
        currentQuery, {
          filters: {
            pageType: "Story"
          }
        }
      );

      otherSearchCounts.Resource = await pagefind.search(
        currentQuery, {
          filters: {
            pageType: "Resource"
          }
        }
      );

      otherSearchCounts.Meeting = await pagefind.search(
        currentQuery, {
          filters: {
            pageType: "Meeting"
          }
        }
      );

      otherSearchCounts.Page = await pagefind.search(
        currentQuery, {
          filters: {
            pageType: "Page"
          }
        }
      );
    }

    // Populate the search page with markup
    const resultPane = document.createElement("div");

    if (searchType === "query") {
      allResultsCount = search.results.length;
      visibleResultsCount = allResultsCount;
    } else {
      visibleResultsCount = search.results.length;
    }

    if (allResultsCount < 1) {
      resultCountText.hidden = true;
      filterWrapper.hidden = true;
      resultPane.innerHTML = noResultsTemplate.innerHTML;
    } else {
      filterWrapper.hidden = false;
      if (visibleResultsCount < 1) {
        resultCountText.hidden = true;
        resultPane.innerHTML = noMatchesTemplate.innerHTML;
      } else if (visibleResultsCount !== allResultsCount) {
        resultCountText.hidden = false;
        resultCountText.innerHTML = `Showing ${visibleResultsCount} of ${pluralizeResultCount(allResultsCount)}`;
      } else {
        resultCountText.hidden = false;
        resultCountText.innerHTML = pluralizeResultCount(allResultsCount);
      }
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

    // Populate the result counts next to each filter
    for (const filter of allFilters) {
      const input = filter.querySelector("input");
      const filterType = input.dataset.typeFilter ? "pageType" : "topics";
      const counter = filter.querySelector(".search-counter");
      const isAllResults = filter.dataset.allResults;
      const criteria = input.dataset.typeFilter || input.dataset.topicFilter;
      const currentCount = search.filters[filterType][criteria];
      let count;

      if (searchType === "type" && input.dataset.topicFilter) {
        if (target === "all") {
          count = otherSearchCounts.all[criteria];
        } else {
          count = otherSearchCounts[target].filters.topics[criteria];
        }
      } else {
        count = currentCount;
      }

      if (searchType === "query" || (searchType === "type" && input.dataset.topicFilter)) {
        if (isAllResults) {
          counter.innerHTML = allResultsCount;
        } else {
          counter.innerHTML = count;
        }
        if (count || isAllResults) {
          filter.hidden = false;
        } else if (!count && input.checked) {
          filter.hidden = false;
        } else {
          filter.hidden = true;
        }
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
    allResultsInput.checked = true;

    for (const filter of topicFilters) {
      filter.querySelector("input").checked = false;
    }

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

      updateSearch("type", currentType);
    });

  };

});