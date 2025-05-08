 window.addEventListener('DOMContentLoaded', async (e) => {
  const pagefind = await import("/pagefind/pagefind.js");

  const filters = await pagefind.filters();

  const searchResult = (title, excerpt, url) => {
    return `
      <li class="search-result">
        <a href="${url}" class="l-stack-basic">
          <h3>${title}</h3>
          <p>${excerpt}</p>
        </a>
      </li>
    `
  };

  await pagefind.init();

  let activeFilters = {

  };

  const searchButton = document.querySelector("#search-button");
  const resultsWrapper = document.querySelector("#search-results");
  const searchTabs = document.querySelectorAll(".search-tab");
  const topicFilterWrapper = document.querySelector("#search-topic-filters");
  const topicFilters = topicFilterWrapper.querySelectorAll("input");
  const loadMoreButton = document.querySelector("#search-load-more");

  const noResultsTemplate = document.querySelector("#search-no-results");


  const pluralizeResults = length => length === 1 ? "result" : "results";


  // Tabs let users filter by category

  // Handle the search

  const updateSearch = async (searchType) => {

    let resultPane = '';

    const currentQuery = document.querySelector("#search-input").value;

    const search = await pagefind.search(
      currentQuery, {
        filters: activeFilters
      }
    );

    if (search.results.length < 1) {
      resultPane = noResultsTemplate.innerHTML;
    } else {
      // Populate the search page with markup

      const resultCount = search.results.length;

      resultPane += `<h4>${resultCount} ${pluralizeResults(resultCount)}</h4>`

      for (const i in search.results) {
        const thisResult = await search.results[i].data();

        resultPane += (searchResult(thisResult.meta.title, thisResult.excerpt, thisResult.url));
      }
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

    resultsWrapper.innerHTML = resultPane;
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