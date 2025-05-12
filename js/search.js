window.addEventListener('DOMContentLoaded', async (e) => {

  // Initialize Pagefind
  const pagefind = await import("/pagefind/pagefind.js");
  const filters = await pagefind.filters();
  await pagefind.init();

  const activeFilters = {};

  // Select elements
  const searchButton = document.querySelector("#search-button");
  const resultsWrapper = document.querySelector("#search-results");
  const searchTabs = document.querySelectorAll(".search-tab");
  const topicFilterWrapper = document.querySelector("#search-topic-filters");
  const topicFilters = topicFilterWrapper.querySelectorAll("input");
  const loadMoreButton = document.querySelector("#search-load-more");

  // Handle each search
  const updateSearch = async (searchType) => {
    // Get markup templates
    const noResultsTemplate = document.querySelector("#search-no-results");
    const resultTemplate = document.querySelector("#search-result");

    const currentQuery = document.querySelector("#search-input").value;

    // If the user has already filtered their search,
    // store the filters so we can re-apply them once the
    // search is done

    const currentTopicFilter = activeFilters.topics;
    const currentTypeFilter = activeFilters["Page type"];


    // For accurate result count numbers,
    // always retrieve unfiltered results for new search terms
    if (searchType === "query") {
      activeFilters.topics = undefined;
      activeFilters["Page type"] = undefined;
    }

    // Conduct search
    const search = await pagefind.search(
      currentQuery, {
        filters: activeFilters
      }
    );


    // Populate the search page with markup
    const resultPane = document.createElement("div");
    const resultCount = search.results.length;

    if (resultCount < 1) {
      resultPane.innerHTML = noResultsTemplate.innerHTML;
    } else {

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
      // Populate the number of results next to each
      // type filter (e.g. "Stories," "Resources," etc.)
      for (const tab of searchTabs) {
        const counter = tab.querySelector("span");
        const type = tab.querySelector("input").dataset.typeFilter;
        if (type === "all") {
          counter.innerHTML = resultCount;
        } else {
          counter.innerHTML = search.filters["Page type"][type] || "0";
        }
      }

      if (currentTopicFilter) {
        activeFilters.topics = currentTopicFilter;
      }

      if (currentTypeFilter) {
        activeFilters["Page type"] = currentTypeFilter;
      }

      // Bug to fix
      updateSearch("type");
    }

    // Populate the number of results next to each topic filter
    if (searchType !== "topic") {
      for (const topic in search.filters.topics) {
        const button = topicFilterWrapper.querySelector(`[data-topic-filter="${topic}"]`);
        const parentLabel = button.parentElement;
        const counter = button.nextElementSibling.nextElementSibling;

        // Hide topics if they have 0 search results
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

  // Handle new search queries
  searchButton.addEventListener('click', async (e) => {
    e.preventDefault();
    updateSearch("query");
  });

  // Handle updates to topic filters
  for (const input of topicFilters) {

    const inputTopic = input.dataset.topicFilter;

    input.addEventListener("input", (e) => {
      if (!input.checked) {
        if (activeFilters.topics.any.length === 1) {
          activeFilters.topics = undefined;
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
  };

  // Handle updates to type filter
  for (const tab of searchTabs) {
    tab.addEventListener('input', async (e) => {
      const currentType = e.target.dataset.typeFilter;

      if (currentType === "all") {
        activeFilters["Page type"] = undefined;
      } else {
        activeFilters["Page type"] = currentType;
      }

      updateSearch("type");
    });

  };

});