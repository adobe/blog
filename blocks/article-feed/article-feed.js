import {
  readBlockConfig,
  buildArticleCard,
  fetchBlogArticleIndex,
  fetchPlaceholders,
  getArticleTaxonomy,
  getLanguage,
} from '../../scripts/scripts.js';

function isCardOnPage(article) {
  const path = article.path.split('.')[0];
  /* using recommended and featured articles */
  return !!document.querySelector(`.featured-article a.featured-article-card[href="${path}"], .recommended-articles a.article-card[href="${path}"]`);
}

async function loadTaxonomy() {
  const mod = await import('../../scripts/taxonomy.js');
  const taxonomy = await mod.default(getLanguage());
  return taxonomy;
}

function closeMenu(el) {
  el.setAttribute('aria-expanded', false);
}

function openMenu(el) {
  const expandedMenu = document.querySelector('.filter-button[aria-expanded=true]');
  if (expandedMenu) { closeMenu(expandedMenu); }
  el.setAttribute('aria-expanded', true);
}

function filterSearch(e) {
  const { target } = e;
  const { value } = target;
  const parent = target.parentElement.parentElement;
  parent.querySelectorAll('.filter-option').forEach((option) => {
    if (!value.length || option.textContent.toLowerCase().includes(value)) {
      option.classList.remove('hide');
    } else {
      option.classList.add('hide');
    }
  });
}

function enableSearch(id) {
  const menu = document.querySelector(`[aria-labelledby='${id}']`);
  const input = menu.querySelector('input');
  input.addEventListener('keyup', filterSearch);
}

function disableSearch(id) {
  const menu = document.querySelector(`[aria-labelledby='${id}']`);
  const input = menu.querySelector('input');
  input.value = '';
  const parent = input.parentElement.parentElement;
  parent.querySelectorAll('.filter-option').forEach((option) => {
    option.classList.remove('hide');
  });
  input.removeEventListener('keyup', filterSearch);
}

function closeOnDocClick(e) {
  const { target } = e;
  const curtain = document.querySelector('.filter-curtain');
  if (target === curtain) {
    const open = document.querySelector('.filter-button[aria-expanded=true]');
    closeMenu(open);
    disableSearch(open.id);
    curtain.classList.add('hide');
  }
}

function closeCurtain() {
  const curtain = document.querySelector('.filter-curtain');
  curtain.classList.add('hide');
  window.removeEventListener('click', closeOnDocClick);
}

function openCurtain() {
  const curtain = document.querySelector('.filter-curtain');
  curtain.classList.remove('hide');
  window.addEventListener('click', closeOnDocClick);
}

function toggleMenu(e) {
  const button = e.target.closest('[role=button]');
  const expanded = button.getAttribute('aria-expanded');
  if (expanded === 'true') {
    closeMenu(button);
    disableSearch(button.id);
    closeCurtain();
  } else {
    openMenu(button);
    enableSearch(button.id);
    openCurtain();
  }
}

function buildSelectedFilter(name) {
  const a = document.createElement('a');
  a.classList.add('selected-filter');
  a.setAttribute('tabindex', 0);
  a.textContent = name;
  return a;
}

function clearFilter(e, block, config) {
  const { target } = e;
  const checked = document
    .querySelector(`input[name='${target.textContent}']`);
  if (checked) { checked.checked = false; }
  delete config.selectedproducts;
  delete config.selectedindustries;
  // eslint-disable-next-line no-use-before-define
  applyCurrentFilters(block, config);
}

function applyCurrentFilters(block, config, close) {
  const filters = {};
  document.querySelectorAll('.filter-options').forEach((filter) => {
    const type = filter.getAttribute('data-type');
    const subfilters = [];
    filter.querySelectorAll('input[type=checkbox]').forEach((box) => {
      if (box.checked) {
        const boxType = box.parentElement.parentElement.getAttribute('data-type');
        subfilters.push(box.name);
        if (config[`selected${boxType}`]) {
          config[`selected${boxType}`] += `, ${box.name}`;
        } else {
          config[`selected${boxType}`] = box.name;
        }
      }
    });
    if (subfilters.length) {
      filters[type] = subfilters;
    }
    if (close) {
      const id = filter.parentElement.getAttribute('aria-labelledby');
      const dropdown = document.getElementById(id);
      closeMenu(dropdown);
    }
  });
  const selectedContainer = document.querySelector('.selected-container');
  const selectedFilters = selectedContainer.querySelector('.selected-filters');
  selectedFilters.innerHTML = '';

  if (Object.keys(filters).length > 0) {
    Object.keys(filters).forEach((filter) => {
      filters[filter].forEach((f) => {
        const selectedFilter = buildSelectedFilter(f);
        selectedFilter.addEventListener('click', (e) => {
          clearFilter(e, block, config);
        });
        selectedFilters.append(selectedFilter);
      });
    });
    selectedContainer.classList.remove('hide');
  } else {
    selectedContainer.classList.add('hide');
  }
  if (block) {
    block.innerHTML = '';
    // eslint-disable-next-line no-use-before-define
    decorateArticleFeed(block, config);
  }
}

function clearFilters(e, block, config) {
  const type = e.target.classList[e.target.classList.length - 1];
  let target = document;
  if (type === 'reset') {
    target = e.target.parentNode.parentNode;
  }
  const dropdowns = target.querySelectorAll('.filter-options');
  dropdowns.forEach((dropdown) => {
    const checked = dropdown.querySelectorAll('input:checked');
    checked.forEach((box) => { box.checked = false; });
  });
  delete config.selectedproducts;
  delete config.selectedindustries;
  applyCurrentFilters(block, config);
}

function buildFilterOption(itemName, type) {
  const name = itemName.replace(/\*/gm, '');

  const option = document.createElement('li');
  option.classList
    .add('filter-option', `filter-option-${type}`);

  const checkbox = document.createElement('input');
  checkbox.id = name;
  checkbox.setAttribute('name', name);
  checkbox.setAttribute('type', 'checkbox');

  const label = document.createElement('label');
  label.setAttribute('for', name);
  label.textContent = name;

  option.append(checkbox, label);
  return option;
}

function buildFilter(type, tax, ph, block, config) {
  const container = document.createElement('div');
  container.classList.add('filter');

  const button = document.createElement('a');
  button.classList.add('filter-button');
  button.id = `${type}-filter-button`;
  button.setAttribute('aria-haspopup', true);
  button.setAttribute('aria-expanded', false);
  button.setAttribute('role', 'button');
  button.textContent = tax.getCategoryTitle(type);
  button.addEventListener('click', toggleMenu);

  const dropdown = document.createElement('div');
  dropdown.classList.add('filter-dropdown');
  dropdown.setAttribute('aria-labelledby', `${type}-filter-button`);
  dropdown.setAttribute('role', 'menu');

  const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false">
    <path d="M14 2A8 8 0 0 0 7.4 14.5L2.4 19.4a1.5 1.5 0 0 0 2.1 2.1L9.5 16.6A8 8 0 1 0 14 2Zm0 14.1A6.1 6.1 0 1 1 20.1 10 6.1 6.1 0 0 1 14 16.1Z"></path>
  </svg>`;
  const searchBar = document.createElement('div');
  searchBar.classList.add('filter-search');
  searchBar.insertAdjacentHTML('afterbegin', SEARCH_ICON);
  const searchField = document.createElement('input');
  searchField.setAttribute('id', `${type}-filter-search`);
  searchField.setAttribute('aria-label', ph.search);
  searchField.setAttribute('placeholder', ph.search);
  searchBar.append(searchField);

  const options = document.createElement('ul');
  options.classList.add('filter-options');
  options.setAttribute('data-type', type);
  const category = tax.getCategory(tax[`${type.toUpperCase()}`]);
  category.forEach((topic) => {
    const item = tax.get(topic, tax[`${type.toUpperCase()}`]);
    if (item.level === 1) {
      const option = buildFilterOption(item.name, 'primary');
      options.append(option);
      item.children.forEach((child) => {
        const nestedOption = buildFilterOption(child, 'nested');
        options.append(nestedOption);
      });
    }
  });

  const footer = document.createElement('div');
  footer.classList.add('filter-dropdown-footer');

  const resetBtn = document.createElement('a');
  resetBtn.classList.add('button', 'small', 'reset');
  resetBtn.textContent = ph.reset;
  resetBtn.addEventListener('click', clearFilters);

  const applyBtn = document.createElement('a');
  applyBtn.classList.add('button', 'small', 'apply');
  applyBtn.textContent = ph.apply;
  applyBtn.addEventListener('click', () => {
    delete config.selectedproducts;
    delete config.selectedindustries;
    closeCurtain();
    disableSearch(`${type}-filter-button`);
    applyCurrentFilters(block, config, 'close');
  });

  footer.append(resetBtn, applyBtn);

  dropdown.append(searchBar, options, footer);
  container.append(button, dropdown);
  return container;
}

async function filterArticles(config) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogArticleIndex();
  }
  const index = window.blogIndex;

  const result = [];

  /* filter posts by category, tag and author */
  const filters = {};
  Object.keys(config).forEach((key) => {
    const filterNames = ['tags', 'topics', 'selectedproducts', 'selectedindustries', 'author', 'category', 'exclude'];
    if (filterNames.includes(key)) {
      const vals = config[key];
      const v = vals.split(',');
      filters[key] = v.map((e) => e.toLowerCase().trim());
    }
  });

  /* filter and ignore if already in result */
  const feed = index.data.filter((article) => {
    const matchedAll = Object.keys(filters).every((key) => {
      if (key === 'exclude' || key === 'tags' || key === 'topics') {
        const tax = getArticleTaxonomy(article);
        const matchedFilter = filters[key].some((val) => (tax.allTopics
          && tax.allTopics.map((t) => t.toLowerCase()).includes(val)));
        return key === 'exclude' ? !matchedFilter : matchedFilter;
      }
      if (key === 'selectedproducts' || key === 'selectedindustries') {
        const tax = getArticleTaxonomy(article);
        if (filters.selectedproducts && filters.selectedindustries) {
          // match product && industry
          const matchProduct = filters.selectedproducts.some((val) => (tax.allTopics
            && tax.allTopics.map((t) => t.toLowerCase()).includes(val)));
          const matchIndustry = filters.selectedindustries.some((val) => (tax.allTopics
            && tax.allTopics.map((t) => t.toLowerCase()).includes(val)));
          return matchProduct && matchIndustry;
        }
        const matchedFilter = filters[key].some((val) => (tax.allTopics
          && tax.allTopics.map((t) => t.toLowerCase()).includes(val)));
        return matchedFilter;
      }
      const matchedFilter = filters[key].some((val) => (article[key]
        && article[key].toLowerCase().includes(val)));
      return matchedFilter;
    });
    return (matchedAll && !result.includes(article) && !isCardOnPage(article));
  });
  return (feed);
}

async function decorateArticleFeed(articleFeedEl, config, offset = 0) {
  const articles = await filterArticles(config);

  let articleCards = articleFeedEl.querySelector('.article-cards');
  if (!articleCards) {
    articleCards = document.createElement('div');
    articleCards.className = 'article-cards';
    articleFeedEl.appendChild(articleCards);
  }
  const limit = 12;
  const pageEnd = offset + limit;
  const max = pageEnd > articles.length ? articles.length : pageEnd;

  for (let i = offset; i < max; i += 1) {
    const article = articles[i];
    const card = buildArticleCard(article);

    articleCards.append(card);
  }
  if (max <= 0) {
    const placeholders = await fetchPlaceholders();
    const emptyResults = document.createElement('div');
    const noResults = document.createElement('p');
    noResults.classList.add('article-cards-no-results');
    noResults.textContent = placeholders['no-results'];
    const userHelp = document.createElement('p');
    userHelp.classList.add('article-cards-help');
    userHelp.textContent = placeholders['user-help'];
    emptyResults.append(noResults, userHelp);
    articleCards.classList.add('article-cards-empty');
    articleCards.append(emptyResults);
  } else if (articles.length > pageEnd) {
    const loadMore = document.createElement('a');
    loadMore.className = 'load-more button small primary light';
    loadMore.href = '#';
    const placeholders = await fetchPlaceholders();
    loadMore.textContent = placeholders['load-more'];
    articleFeedEl.append(loadMore);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      // eslint-disable-next-line no-use-before-define
      decorateArticleFeed(articleFeedEl, config, pageEnd);
    });
  }
  articleFeedEl.classList.add('appear');
}

async function decorateFeedFilter(articleFeedEl, config) {
  const placeholders = await fetchPlaceholders();
  const taxonomy = await loadTaxonomy();
  const parent = document.querySelector('.article-feed-container');

  const curtain = document.createElement('div');
  curtain.classList.add('filter-curtain', 'hide');
  document.querySelector('main').append(curtain);

  // FILTER CONTAINER
  const filterContainer = document.createElement('div');
  filterContainer.classList.add('filter-container');
  const filterWrapper = document.createElement('div');

  const filterText = document.createElement('p');
  filterText.classList.add('filter-text');
  filterText.textContent = placeholders.filters;

  const productsDropdown = buildFilter('products', taxonomy, placeholders, articleFeedEl, config);
  const industriesDropdown = buildFilter('industries', taxonomy, placeholders, articleFeedEl, config);

  filterWrapper.append(filterText, productsDropdown, industriesDropdown);
  filterContainer.append(filterWrapper);

  parent.parentElement.insertBefore(filterContainer, parent);

  // SELECTED CONTAINER
  const selectedContainer = document.createElement('div');
  selectedContainer.classList.add('selected-container', 'hide');
  const selectedWrapper = document.createElement('div');

  const selectedText = document.createElement('p');
  selectedText.classList.add('selected-text');
  selectedText.textContent = placeholders['showing-articles-for'];

  const selectedCategories = document.createElement('span');
  selectedCategories.classList.add('selected-filters');

  const clearBtn = document.createElement('a');
  clearBtn.classList.add('button', 'small', 'clear');
  clearBtn.textContent = placeholders['clear-all'];
  clearBtn.addEventListener('click',
    (e) => clearFilters(e, articleFeedEl, config));

  selectedWrapper.append(selectedText, selectedCategories, clearBtn);
  selectedContainer.append(selectedWrapper);
  parent.parentElement.insertBefore(selectedContainer, parent);
}

export default function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = '';
  if (config.filters) {
    decorateFeedFilter(block, config);
  }
  decorateArticleFeed(block, config);
}
