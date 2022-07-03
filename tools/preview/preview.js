/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console */

const cardPreviewEscListener = (keyEvt) => {
  if (keyEvt.key === 'Escape') {
    // eslint-disable-next-line no-use-before-define
    removeCardPreview();
  }
};

const removeCardPreview = () => {
  document.getElementById('hlx-sk-card-preview').remove();
  window.removeEventListener('keydown', cardPreviewEscListener);
};

const toggleCardPreview = async () => {
  if (document.getElementById('hlx-sk-card-preview')) {
    removeCardPreview();
  } else {
    const $modal = document.createElement('div');
    $modal.innerHTML = `
    <style>
      #hlx-sk-card-preview {
        z-index: 9999998;
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        background-color: rgba(0,0,0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #hlx-sk-card-preview .article-card {
        width: 376px;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.1), 0 10px 20px 0 rgba(0, 0, 0, 0.3);
      }
    </style>`;
    const {
      getBlogArticle,
      buildArticleCard,
    } = await import(`${window.location.origin}/scripts/scripts.js`);
    $modal.append(buildArticleCard(await getBlogArticle(window.location.pathname)));

    const $overlay = document.createElement('div');
    $overlay.id = 'hlx-sk-card-preview';
    $overlay.addEventListener('click', () => {
      removeCardPreview();
    });
    $overlay.append($modal);
    document.querySelector('main').prepend($overlay);
    window.addEventListener('keydown', cardPreviewEscListener);
  }
};

const predictUrl = async (host, path) => {
  const {
    getBlogArticle,
  } = await import(`${window.location.origin}/scripts/scripts.js`);
  const pathsplits = path.split('/');
  let publishPath = '';
  const article = await getBlogArticle(path);
  if (article.date) {
    const datesplits = article.date.split('-');
    if (datesplits.length > 2) {
      publishPath = `/publish/${datesplits[2]}/${datesplits[0]}/${datesplits[1]}`;
    }
  }
  const filename = pathsplits.pop();
  return `${host ? `https://${host}/` : ''}${pathsplits[1]}${publishPath}/${filename}`;
};

const createBanner = (id) => {
  const banner = document.createElement('div');
  banner.id = id;
  const bannerStyle = banner.appendChild(document.createElement('style'));
  bannerStyle.textContent = `
  #hlx-sk-predicted-url {
    z-index: 9999998;
    position: fixed;
    width: 100%;
    bottom: 0;
    left: 0;
    font-family: Arial, sans-serif;
    font-size: 1rem;
    background-color: red;
    color: white;
    padding: 0 20px;
  }
  #hlx-sk-predicted-url input,
  #hlx-sk-predicted-url button {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    background: transparent;
    color: white;
  }
  #hlx-sk-predicted-url input {
    outline: none;
    border: none;
    width: 400px;
    text-overflow: ellipsis;
  }
  #hlx-sk-predicted-url button {
    border: solid 1px white;
    border-radius: 8px;
    padding: 5px 8px;
    margin-left: 5px;
  }`;
  document.body.prepend(banner);
  return banner;
};

const getPredictedUrl = async () => {
  const url = await predictUrl('blog.adobe.com', window.location.pathname);
  let urlBanner = document.getElementById('hlx-sk-predicted-url');
  if (!urlBanner) {
    urlBanner = createBanner('hlx-sk-predicted-url');
    urlBanner.innerHTML += `
    <p>
      Predicted URL:
      <input value="${url}">
      <button class="copy">copy</button>
      <button class="dismiss">dismiss</button>
    </p>`;
    const copyButton = urlBanner.querySelector('button.copy');
    copyButton.focus();
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      urlBanner.remove();
    });
    const dismissButton = urlBanner.querySelector('button.dismiss');
    dismissButton.addEventListener('click', () => {
      urlBanner.remove();
    });
  } else {
    urlBanner.remove();
  }
};

function loadPlugins(sk) {
  sk.addEventListener('custom:card-preview', toggleCardPreview);
  sk.addEventListener('custom:predicted-url', getPredictedUrl);
}

function waitForSidekick(callback) {
  const { body } = document;
  const sk = body.querySelector('helix-sidekick');
  if (sk) {
    // sidekick ready
    callback(sk);
  } else {
    // wait for sidekick
    const observer = new MutationObserver((list) => {
      list.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {
          if (node.tagName === 'HELIX-SIDEKICK') {
            observer.disconnect();
            callback(node);
          }
        });
      });
    });
    observer.observe(body, { childList: true });
  }
}

waitForSidekick(loadPlugins);
