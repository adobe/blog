import {
  buildFigure,
  createOptimizedPicture,
} from '../../scripts/scripts.js';

async function populateAuthorInfo(authorLink, imgContainer, url, name, eager = false) {
  const resp = await fetch(`${url}.plain.html`);
  if (resp.ok) {
    const text = await resp.text();
    const placeholder = document.createElement('div');
    placeholder.innerHTML = text;
    const placeholderImg = placeholder.querySelector('img');
    if (placeholderImg) {
      const src = new URL(placeholderImg.getAttribute('src'), new URL(url));
      const picture = createOptimizedPicture(src, name, eager, [{ width: 200 }]);
      imgContainer.append(picture);

      const img = picture.querySelector('img');
      if (!img.complete) {
        img.addEventListener('load', () => {
          // remove default background image to avoid halo
          imgContainer.style.backgroundImage = 'none';
        });

        img.addEventListener('error', () => {
          // removing 404 img will reveal fallback background img
          img.remove();
        });
      } else {
        // remove default background image to avoid halo
        imgContainer.style.backgroundImage = 'none';
      }
    }
  } else {
    const p = document.createElement('p');
    p.innerHTML = authorLink.innerHTML;
    authorLink.replaceWith(p);
  }
}

function validateDate(date) {
  if (date
    && !window.location.hostname.includes('adobe.com')
    && window.location.pathname.includes('/publish/')) {
    // match publication date to date in pathname
    const [mm, dd, yyyy] = date.textContent.split('-');
    if (!window.location.pathname.includes(`/${yyyy}/${mm}/${dd}/`)) {
      date.classList.add('article-date-invalid');
    }
  }
}

export default async function decorateArticleHeader(blockEl, blockName, document, eager) {
  const childrenEls = Array.from(blockEl.children);
  // category
  const categoryContainer = childrenEls[0];
  categoryContainer.classList.add('article-category');
  // title
  const titleContainer = childrenEls[1];
  titleContainer.classList.add('article-title');
  // byline
  const bylineContainer = childrenEls[2];
  bylineContainer.classList.add('article-byline');
  bylineContainer.firstChild.classList.add('article-byline-info');
  // author
  const author = bylineContainer.firstChild.firstChild;
  const authorLink = author.querySelector('a');
  const authorURL = authorLink.href;
  const authorName = author.textContent;
  author.classList.add('article-author');
  // publication date
  const date = bylineContainer.firstChild.lastChild;
  date.classList.add('article-date');
  validateDate(date);
  // author img
  const authorImg = document.createElement('div');
  authorImg.classList = 'article-author-image';
  authorImg.style.backgroundImage = 'url(/blocks/article-header/adobe-logo.svg)';
  bylineContainer.prepend(authorImg);

  populateAuthorInfo(authorLink, authorImg, authorURL, authorName, eager);
  // feature img
  const featureImgContainer = childrenEls[3];
  featureImgContainer.classList.add('article-feature-image');
  const featureFigEl = buildFigure(featureImgContainer.firstChild);
  featureFigEl.classList.add('figure-feature');
  featureImgContainer.prepend(featureFigEl);
  featureImgContainer.lastChild.remove();
}
