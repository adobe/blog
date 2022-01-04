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
    } = await import('/scripts/scripts.js');
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
  } = await import('/scripts/scripts.js');
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
  } = await import('/scripts/scripts.js');
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

window.hlx.initSidekick({
  project: 'Blog',
  hlx3: true,
  host: 'blog.adobe.com',
  pushDownSelector: 'header',
  specialViews: [
    {
      path: '/de/**.json',
      js: (container, json) => {
        const { limit, total, data } = JSON.parse(json);
        container.innerHTML = `Custom data view - Showing ${limit} of ${total} records<ol>
          ${data.map(({ title, path }) => `<li><a href="${path}>${title}</a>`).join('')}
          </ol>`;
      },
      css: '.hlx-sk-special-view, .hlx-sk-special-view a:any-link { color: orangered }',
    },
  ],
  plugins: [
    // TAGGER -----------------------------------------------------------------------
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
      button: {
        text: 'Card Preview',
        action: async (_, sk) => toggleCardPreview(sk),
      },
    },
    // PREDICTED URL ----------------------------------------------------------------
    {
      id: 'predicted-url',
      condition: (sidekick) => {
        const { config, location } = sidekick;
        return sidekick.isHelix()
          && isArticle(location.pathname)
          && config.host
          && location.host !== config.host;
      },
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
      button: {
        text: 'Copy Article Data',
        action: async (_, sk) => copyArticleData(sk),
      },
    },
    // PUBLISH ----------------------------------------------------------------------
    // do not show publish button for drafts
    {
      id: 'publish',
      condition: (sidekick) => sidekick.isHelix() && !sidekick.location.pathname.includes('/drafts/'),
    },
  ],
});
