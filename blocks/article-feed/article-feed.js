import {
  readBlockConfig,
  buildArticleCard,
  fetchBlogArticleIndex,
  fetchPlaceholders,
  getArticleTaxonomy,
} from '../../scripts/scripts.js';

function isCardOnPage(article) {
  const path = article.path.split('.')[0];
  /* using recommended and featured articles */
  return !!document.querySelector(`.featured-article a.featured-article-card[href="${path}"], .recommended-articles a.article-card[href="${path}"]`);
}

async function filterArticles(config, offset) {
  const index = await fetchBlogArticleIndex();

  const result = [];

  /* filter posts by category, tag and author */
  const filters = {};
  Object.keys(config).forEach((key) => {
    const filterNames = ['tags', 'author', 'category', 'exclude'];
    if (filterNames.includes(key)) {
      const vals = config[key];
      const v = vals.split(', ');
      filters[key] = v.map((e) => e.toLowerCase().trim());
    }
  });

  const size = 12;
  let end = offset;
  const articles = [];
  while (articles.length < size && end < index.data.length) {
    const article = index.data[end];
    const matchedAll = Object.keys(filters).every((key) => {
      if (key === 'exclude' || key === 'tags') {
        const tax = getArticleTaxonomy(article);
        const matchedFilter = filters[key].some((val) => (tax.allTopics
          && tax.allTopics.map((t) => t.toLowerCase()).includes(val)));
        return key === 'exclude' ? !matchedFilter : matchedFilter;
      }
      const matchedFilter = filters[key].some((val) => (article[key]
        && article[key].toLowerCase().includes(val)));
      return matchedFilter;
    });

    if (matchedAll && !result.includes(article) && !isCardOnPage(article)) {
      articles.push(article);
    }
    end += 1;
  }
  const page = {
    articles,
    size,
    end,
    totalArticles: index.data.length,
  };

  return page;
}

async function decorateArticleFeed(articleFeedEl, config, offset = 0) {
  const page = await filterArticles(config, offset);

  let articleCards = articleFeedEl.querySelector('.article-cards');
  if (!articleCards) {
    articleCards = document.createElement('div');
    articleCards.className = 'article-cards';
    articleFeedEl.appendChild(articleCards);
  }

  page.articles.forEach((article) => {
    const card = buildArticleCard(article);
    articleCards.append(card);
  });

  if (page.totalArticles > page.end) {
    const loadMore = document.createElement('a');
    loadMore.className = 'load-more button small primary light';
    loadMore.href = '#';
    const placeholders = await fetchPlaceholders();
    loadMore.textContent = placeholders['load-more'];
    articleFeedEl.append(loadMore);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      decorateArticleFeed(articleFeedEl, config, page.end);
    });
  }
  articleFeedEl.classList.add('appear');
}

export default function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = '';
  decorateArticleFeed(block, config);
}
