import {
  fetchBlogArticleIndex,
  buildArticleCard,
  getLocale, readBlockConfig,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  const locale = getLocale();
  const key = `blog-${locale}-history`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  const tags = new Set();
  const paths = [];

  const blockConfig = readBlockConfig(block);
  const limit = blockConfig.limit || 3;
  block.textContent = '';

  history.forEach((item) => {
    paths.push(item.path);
    item.tags.split(',').forEach((e) => tags.add(e.trim()));
  });

  if (block.classList.contains('small')) {
    block.parentNode.querySelectorAll('a').forEach((a) => {
      a.classList.add('button', 'primary', 'small', 'light');
    });
    block.parentNode.classList.add('recommended-articles-small-content-wrapper');
  }
  if (paths.length >= 2) {
    const index = await fetchBlogArticleIndex();
    const articleCardsContainer = document.createElement('div');
    articleCardsContainer.className = 'article-cards';
    const matchedArticles = [];
    for (let i = 0; i < index.data.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const article = index.data[i];
      const articleTags = JSON.parse(article.tags);

      const tagMatches = articleTags.filter((t) => tags.has(t)).length;
      const pathMatch = paths.includes(article.path);

      if (article && tagMatches && !pathMatch) {
        matchedArticles.push({ tagMatches, article });
      }
    }
    matchedArticles.sort((a, b) => b.tagMatches - a.tagMatches);

    if (matchedArticles.length >= 3) {
      for (let i = 0; i < limit && i < matchedArticles.length; i += 1) {
        const { article } = matchedArticles[i];
        const card = buildArticleCard(article);
        articleCardsContainer.append(card);
      }
      block.closest('.section-wrapper').classList.add('appear');
    }
    block.append(articleCardsContainer);
  }
}
