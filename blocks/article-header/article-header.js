import {
  buildFigure,
  createOptimizedPicture,
  getMetadata,
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

/**
 * Creates an SVG tag using the specified ID.
 * @param {string} id The ID
 * @returns {element} The SVG tag
 */
function createSVG(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/icons/icons.svg#${id}`);
  svg.appendChild(use);
  return svg;
}

function copyToClipboard(button) {
  navigator.clipboard.writeText(window.location.href).then(() => {
    button.classList.add('copy-success');
  }, () => {
    button.classList.add('copy-failure');
  });
}

function buildSharing() {
  const url = encodeURIComponent(window.location.href);
  const title = document.querySelector('h1').textContent;
  const description = getMetadata('description');
  const sharing = document.createElement('div');
  sharing.classList.add('article-byline-sharing');
  sharing.innerHTML = `<span>
      <a target="_blank" href="http://twitter.com/share?&url=${url}&text=${title}">
        ${createSVG('twitter').outerHTML}
      </a>
    </span>
    <span>
      <a target="_blank" href="http://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description || ''}">
        ${createSVG('linkedin').outerHTML}
      </a>
    </span>
    <span>
      <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${url}">
        ${createSVG('facebook').outerHTML}
      </a>
    </span>
    <span>
      <a id="copy-to-clipboard" title="Copy to Clipboard">
        ${createSVG('link').outerHTML}
      </a>
    </span>`;
  const copyButton = sharing.querySelector('#copy-to-clipboard');
  copyButton.addEventListener('click', () => {
    copyToClipboard(copyButton);
  });
  return sharing;
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
  // author img
  const authorImg = document.createElement('div');
  authorImg.classList = 'article-author-image';
  authorImg.style.backgroundImage = 'url(/blocks/article-header/adobe-logo.svg)';
  bylineContainer.prepend(authorImg);
  populateAuthorInfo(authorLink, authorImg, authorURL, authorName, eager);
  // sharing
  const shareBlock = buildSharing();
  bylineContainer.append(shareBlock);
  // feature img
  const featureImgContainer = childrenEls[3];
  featureImgContainer.classList.add('article-feature-image');
  const featureFigEl = buildFigure(featureImgContainer.firstChild);
  featureFigEl.classList.add('figure-feature');
  featureImgContainer.prepend(featureFigEl);
  featureImgContainer.lastChild.remove();
}
