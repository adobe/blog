/* eslint-disable import/no-absolute-path, import/no-unresolved */

const isArticle = (path) => path.includes('/publish/') || path.includes('/drafts/');

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

const toggleCardPreview = async (sk) => {
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
    $modal.append(buildArticleCard(await getBlogArticle(sk.location.pathname)));

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

const copyArticleData = async (sk) => {
  const {
    getBlogArticle,
  } = await import(`${window.location.origin}/scripts/scripts.js`);
  const { location, status } = sk;
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
  sk.notify('Article data copied to clipboard');
};

const generateFeed = (
  feedTitle = 'Adobe Blog',
  feedAuthor = 'Adobe',
  feedData = window.blogIndex?.data || [],
  baseURL = `https://${window.hlx.sidekick.config.host}`,
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

const updateFeed = async (sk) => {
  /* eslint-disable no-console */
  const feedUrl = document.querySelector('link[type="application/xml+atom"]')?.href;
  if (feedUrl && window.blogIndex) {
    const {
      connect,
      saveFile,
    } = await import(`${window.location.origin}/tools/sidekick/sharepoint.js`);
    const { owner, repo, ref } = sk.config;
    const feedPath = new URL(feedUrl).pathname;
    console.log(`Updating feed ${feedPath}`);
    await connect(async () => {
      try {
        sk.showModal('Please wait …', true);
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
        sk.notify(`Feed ${feedUrl} updated`);
      } catch (e) {
        console.error(e);
        sk.showModal('Failed to update feed, please try again later', false, 0);
      }
    });
  }
  /* eslint-enable no-console */
};

window.hlx.initSidekick({
  project: 'Blog',
  hlx3: true,
  host: 'blog.adobe.com',
  pushDownSelector: 'header',
  plugins: [
    // TOOLS DROPDOWN -----------------------------------------------------------------
    {
      id: 'tools',
      condition: (sk) => !sk.isEditor(),
      button: {
        text: 'Tools',
        isDropdown: true,
      },
    },
    // TAGGER -------------------------------------------------------------------------
    {
      id: 'tagger',
      condition: (sk) => sk.isEditor() && (sk.location.search.includes('.docx&') || sk.location.search.includes('.md&')),
      button: {
        text: 'Tagger',
        action: (_, sk) => {
          const { config } = sk;
          window.open(`https://${config.innerHost}/tools/tagger/index.html`, 'hlx-sidekick-tagger');
        },
      },
    },
    // CARD PREVIEW -------------------------------------------------------------------
    {
      id: 'card-preview',
      condition: (sidekick) => sidekick.isHelix() && isArticle(sidekick.location.pathname),
      container: 'tools',
      button: {
        text: 'Card Preview',
        action: async (_, sk) => toggleCardPreview(sk),
      },
    },
    // PREDICTED URL ------------------------------------------------------------------
    {
      id: 'predicted-url',
      condition: (sidekick) => {
        const { config, location } = sidekick;
        return sidekick.isHelix()
          && isArticle(location.pathname)
          && config.host
          && location.host !== config.host;
      },
      container: 'tools',
      button: {
        text: 'Copy Predicted URL',
        action: async (_, sk) => {
          const { config, location } = sk;
          const url = await predictUrl(config.host, location.pathname);
          navigator.clipboard.writeText(url);
          sk.notify([
            'Predicted URL copied to clipboard:',
            url,
          ]);
        },
      },
    },
    // ARTICLE DATA -------------------------------------------------------------------
    {
      id: 'article-data',
      condition: (sidekick) => sidekick.isHelix() && isArticle(sidekick.location.pathname),
      container: 'tools',
      button: {
        text: 'Copy Article Data',
        action: async (_, sk) => copyArticleData(sk),
      },
    },
    // PUBLISH ------------------------------------------------------------------------
    // do not show publish button for drafts
    {
      id: 'publish',
      condition: (sidekick) => sidekick.isHelix() && !sidekick.location.pathname.includes('/drafts/'),
    },
    // UPDATE FEED --------------------------------------------------------------------
    {
      id: 'feed',
      condition: () => hasFeed(),
      container: 'tools',
      button: {
        text: 'Update Feed',
        action: async (_, sk) => updateFeed(sk),
      },
    },
  ],
});
