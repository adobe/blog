class BlogSidekickBanner {
  constructor(id) {
    this.banner = document.createElement('div');
    this.banner.className = 'blog-sidekick-banner';
    this.banner.id = id;
    this.banner.appendChild(document.createElement('style')).textContent = `
    .blog-sidekick-banner {
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
    .blog-sidekick-banner a:any-link {
      color: white;
    }
    .blog-sidekick-banner input,
    .blog-sidekick-banner button {
      font-family: Arial, sans-serif;
      font-size: 1rem;
      background: transparent;
      color: white;
    }
    .blog-sidekick-banner input {
      outline: none;
      border: none;
      width: 400px;
      text-overflow: ellipsis;
    }
    .blog-sidekick-banner button {
      border: solid 1px white;
      border-radius: 8px;
      padding: 5px 8px;
      margin-left: 5px;
      user-selection: none;
      cursor: pointer;
    }`;
    this.bannerContent = this.banner.appendChild(document.createElement('p'));
    this.bannerContent.className = 'content';
    document.body.prepend(this.banner);
  }

  querySelector(selector) {
    return this.bannerContent.querySelector(selector);
  }

  write(content, timeout) {
    this.bannerContent.innerHTML = content;
    if (timeout) {
      this.hide(timeout);
    }
  }

  hide(timeout = 0) {
    setTimeout(() => {
      this.banner.remove();
    }, timeout * 1000);
  }
}

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

const toggleCardPreview = async ({ detail }) => {
  const { status } = detail.data;
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
    $modal.append(buildArticleCard(await getBlogArticle(status.webPath)));

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

const getPredictedUrl = async ({ detail }) => {
  const { status } = detail.data;
  const url = await predictUrl('blog.adobe.com', status.webPath);
  const banner = new BlogSidekickBanner('hlx-sk-predicted-url');
  banner.write(`
    Predicted URL:
    <input value="${url}">
    <button class="copy">copy</button>
    <button class="dismiss">dismiss</button>
  `);
  const copyButton = banner.querySelector('button.copy');
  copyButton.focus();
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(url);
    banner.hide();
  });
  const dismissButton = banner.querySelector('button.dismiss');
  dismissButton.addEventListener('click', () => {
    banner.hide();
  });
};

const copyArticleData = async ({ detail }) => {
  const {
    getBlogArticle,
  } = await import(`${window.location.origin}/scripts/scripts.js`);
  const { location, status } = detail.data;
  const {
    date,
    image,
    imageAlt,
    title,
    description,
    author,
    topics,
  } = await getBlogArticle(location.pathname);
  const imageUrl = new URL(image);
  const articleData = [
    date,
    `${imageUrl.pathname}${imageUrl.search}`,
    location.pathname,
    title,
    author,
    description,
    `["${topics.join('", "')}"]`,
    imageAlt,
    '',
    new Date(status.preview.lastModified).valueOf(),
  ];
  navigator.clipboard.writeText(articleData.join('\t'));
  const banner = new BlogSidekickBanner('get-article-data');
  banner.write('Article data copied to clipboard', 5);
};

const generateFeed = (
  feedTitle = 'Adobe Blog',
  feedAuthor = 'Adobe',
  feedData = window.blogIndex?.data || [],
  baseURL = 'https://blog.adobe.com',
  limit = 50,
) => {
  const ns = 'http://www.w3.org/2005/Atom';
  const feedEl = document.createElementNS(ns, 'feed');
  const feedTitleEl = document.createElementNS(ns, 'title');
  const feedUpdatedEl = document.createElementNS(ns, 'updated');
  const feedAuthorEl = document.createElementNS(ns, 'author');
  const feedNameEl = document.createElementNS(ns, 'name');
  const feedIdEl = document.createElementNS(ns, 'id');

  feedTitleEl.textContent = feedTitle;
  feedUpdatedEl.textContent = new Date().toISOString();
  feedNameEl.textContent = feedAuthor;
  feedIdEl.textContent = `${baseURL}/`;

  feedEl.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:base', baseURL);
  feedEl.appendChild(feedTitleEl);
  feedEl.appendChild(feedUpdatedEl);
  feedAuthorEl.appendChild(feedNameEl);
  feedEl.appendChild(feedAuthorEl);
  feedEl.appendChild(feedIdEl);

  feedData
    .slice(0, limit - 1)
    .forEach(({
      date, path, title, author, description,
    }) => {
      const entryEl = document.createElementNS(ns, 'entry');
      const titleEl = document.createElementNS(ns, 'title');
      const linkEl = document.createElementNS(ns, 'link');
      const authorEl = document.createElementNS(ns, 'author');
      const nameEl = document.createElementNS(ns, 'name');
      const idEl = document.createElementNS(ns, 'id');
      const updatedEl = document.createElementNS(ns, 'updated');
      const summaryEl = document.createElementNS(ns, 'summary');

      titleEl.textContent = title;
      linkEl.setAttributeNS('', 'href', path);
      nameEl.textContent = author;
      idEl.textContent = baseURL + path;
      updatedEl.textContent = new Date(Math.round((date - 25569) * 86400 * 1000)).toISOString();
      summaryEl.textContent = description;

      entryEl.appendChild(titleEl);
      entryEl.appendChild(linkEl);
      authorEl.appendChild(nameEl);
      entryEl.appendChild(authorEl);
      entryEl.appendChild(idEl);
      entryEl.appendChild(updatedEl);
      entryEl.appendChild(summaryEl);
      feedEl.appendChild(entryEl);
    });

  const ser = new XMLSerializer();
  return ser.serializeToString(feedEl);
};

const hasFeed = () => !!document.querySelector('link[type="application/xml+atom"]');

const updateFeed = async ({ detail }) => {
  const feedBanner = new BlogSidekickBanner('update-feed');
  if (!hasFeed) {
    feedBanner.write('No feed defined for this page', 5);
  }
  /* eslint-disable no-console */
  const feedUrl = document.querySelector('link[type="application/xml+atom"]')?.getAttribute('href');
  if (feedUrl && window.blogIndex) {
    const {
      connect,
      saveFile,
    } = await import(`${window.location.origin}/tools/sidekick/sharepoint.js`);
    const { owner, repo, ref } = detail.data.config;
    const feedPath = new URL(feedUrl, 'https://blog.adobe.com').pathname;
    console.log(`Updating feed ${feedPath}`);
    feedBanner.write('Please wait …');
    await connect(async () => {
      try {
        const feedXml = new Blob([generateFeed()], { type: 'application/atom+xml' });
        await saveFile(feedXml, feedPath);
        let resp = await fetch(`https://admin.hlx.page/preview/${owner}/${repo}/${ref}${feedPath}`, { method: 'POST' });
        if (!resp.ok) {
          throw new Error(`Failed to update preview for ${feedPath}`);
        }
        resp = await fetch(`https://admin.hlx.page/live/${owner}/${repo}/${ref}${feedPath}`, { method: 'POST' });
        if (!resp.ok) {
          throw new Error(`Failed to publish ${feedPath}`);
        }
        feedBanner.write(`Feed <a href="${feedUrl}" target="_blank">${feedPath}</a> updated`, 5);
      } catch (e) {
        console.error(e);
        feedBanner.write(`Failed to update feed ${feedPath}, please try again later`, 5);
      }
    });
  }
};

/* register listeners for custom events */
const sk = document.querySelector('helix-sidekick');
sk.addEventListener('custom:card-preview', toggleCardPreview);
sk.addEventListener('custom:predicted-url', getPredictedUrl);
sk.addEventListener('custom:copy-article-data', copyArticleData);
sk.addEventListener('custom:update-feed', updateFeed);
