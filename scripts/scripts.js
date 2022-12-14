/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */

window.RUM_GENERATION = 'blog-gen-8-adaptiverate';
window.RUM_LOW_SAMPLE_RATE = 10;
window.RUM_HIGH_SAMPLE_RATE = 10;

const PRODUCTION_DOMAINS = ['blog.adobe.com'];

export function sampleRUM(checkpoint, data = {}) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname]
      || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
    || ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  defer('stash');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = (usp.get('rum') === 'on') ? 1 : window.RUM_LOW_SAMPLE_RATE;
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
      const random = Math.random();
      const isSelected = (random * weight < 1);
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected, sampleRUM };
    }
    const { id } = window.hlx.rum;
    if ((window.hlx && window.hlx.rum && window.hlx.rum.isSelected) || checkpoint === 'experiment') {
      const sendPing = (pdata = data) => {
        if (!window.hlx.rum.isSelected) {
          return;
        }
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify({ weight: window.hlx.rum.weight, id, referer: window.location.href, generation: window.RUM_GENERATION, checkpoint, ...data });
        const url = `https://rum.hlx.page/.rum/${window.hlx.rum.weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}:${window.hlx.rum.weight}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          sendPing(data);
          return true;
        },
        experiment: () => {
          // track experiments with higher sampling rate
          window.hlx.rum.weight = Math.min(window.hlx.rum.weight, window.RUM_HIGH_SAMPLE_RATE);
          window.hlx.rum.isSelected = (window.hlx.rum.random * window.hlx.rum.weight < 1);

          sampleRUM.drain('stash', sampleRUM);
          sendPing(data);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    } else {
      sampleRUM.stash(checkpoint, data); // save the event for later
    }
  } catch (error) {
    // something went wrong
  }
}

sampleRUM('top');
window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}

/**
 * Turns absolute links within the domain into relative links.
 * @param {Element} main The container element
 */
export function makeLinksRelative(main) {
  main.querySelectorAll('a').forEach((a) => {
    // eslint-disable-next-line no-use-before-define
    const hosts = ['hlx3.page', 'hlx.page', 'hlx.live', ...PRODUCTION_DOMAINS];
    if (a.href) {
      try {
        const url = new URL(a.href);
        const relative = hosts.some((host) => url.hostname.includes(host));
        if (relative) {
          a.href = `${url.pathname.replace(/\.html$/, '')}${url.search}${url.hash}`;
        }
      } catch (e) {
        // something went wrong
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  });
}

const LANG = {
  EN: 'en',
  DE: 'de',
  FR: 'fr',
  KO: 'ko',
  ES: 'es',
  IT: 'it',
  JP: 'jp',
  BR: 'br',
};

const LANG_LOCALE = {
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  ko: 'ko_KR',
  es: 'es_ES',
  it: 'it_IT',
  jp: 'ja_JP',
  br: 'pt_BR',
};

let language;

export function getLanguage() {
  if (language) return language;
  language = LANG.EN;
  const segs = window.location.pathname.split('/');
  if (segs && segs.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, value] of Object.entries(LANG)) {
      if (value === segs[1]) {
        language = value;
        break;
      }
    }
  }
  return language;
}

export function getLocale() {
  const lang = getLanguage();
  return LANG_LOCALE[lang];
}

function getDateLocale() {
  let dateLocale = getLanguage();
  if (dateLocale === LANG.EN) {
    dateLocale = 'en-US'; // default to US date format
  }
  if (dateLocale === LANG.BR) {
    dateLocale = 'pt-BR';
  }
  if (dateLocale === LANG.JP) {
    dateLocale = 'ja-JP';
  }
  const pageName = window.location.pathname.split('/').pop().split('.')[0];
  if (pageName === 'uk' || pageName === 'apac') {
    dateLocale = 'en-UK'; // special handling for UK and APAC landing pages
  }
  return dateLocale;
}

/**
 * Returns the language dependent root path
 * @returns {string} The computed root path
 */
export function getRootPath() {
  const loc = getLanguage();
  return `/${loc}`;
}

/**
 * Retrieves the content of a metadata tag. Multivalued metadata are returned
 * as a comma-separated list (or as an array of string if asArray is true).
 * @param {string} name The metadata name (or property)
 * @param {boolean} asArray Return an array instead of a comma-separated string
 * @returns {string|Array} The metadata value
 */
export function getMetadata(name, asArray = false) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((el) => el.content);

  return asArray ? meta : meta.join(', ');
}

/**
 * Get the current Helix environment
 * @returns {Object} the env object
 */
export function getHelixEnv() {
  let envName = sessionStorage.getItem('helix-env');
  if (!envName) envName = 'prod';
  const envs = {
    dev: {
      ims: 'stg1',
      subdomain: 'dev02.',
      adobeIO: 'cc-collab-stage.adobe.io',
      adminconsole: 'stage.adminconsole.adobe.com',
      account: 'stage.account.adobe.com',
      target: false,
    },
    stage: {
      ims: 'stg1',
      subdomain: 'stage.',
      adobeIO: 'cc-collab-stage.adobe.io',
      adminconsole: 'stage.adminconsole.adobe.com',
      account: 'stage.account.adobe.com',
      target: false,
    },
    prod: {
      ims: 'prod',
      subdomain: '',
      adobeIO: 'cc-collab.adobe.io',
      adminconsole: 'adminconsole.adobe.com',
      account: 'account.adobe.com',
      target: true,
    },
  };
  const env = envs[envName];

  const overrideItem = sessionStorage.getItem('helix-env-overrides');
  if (overrideItem) {
    const overrides = JSON.parse(overrideItem);
    const keys = Object.keys(overrides);
    env.overrides = keys;

    keys.forEach((value) => {
      env[value] = overrides[value];
    });
  }

  if (env) {
    env.name = envName;
  }
  return env;
}

export function debug(message, ...args) {
  const { hostname } = window.location;
  const env = getHelixEnv();
  if (env.name !== 'prod' || hostname === 'localhost') {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
}

/**
 * forward looking *.metadata.json experiment
 * fetches metadata.json of page
 * @param {path} path to *.metadata.json
 * @returns {Object} containing sanitized meta data
 */
async function getMetadataJson(path) {
  let resp;
  try {
    resp = await fetch(`${path.split('.')[0]}?noredirect`);
  } catch {
    debug(`Could not retrieve metadata for ${path}`);
  }

  if (resp && resp.ok) {
    const text = await resp.text();
    const headStr = text.split('<head>')[1].split('</head>')[0];
    const head = document.createElement('head');
    head.innerHTML = headStr;
    const metaTags = head.querySelectorAll(':scope > meta');
    const meta = {};
    metaTags.forEach((metaTag) => {
      const name = metaTag.getAttribute('name') || metaTag.getAttribute('property');
      const value = metaTag.getAttribute('content');
      if (meta[name]) {
        meta[name] += `, ${value}`;
      } else {
        meta[name] = value;
      }
    });
    return meta;
  }
  return null;
}

let taxonomy;

/**
 * For the given list of topics, returns the corresponding computed taxonomy:
 * - category: main topic
 * - topics: tags as an array
 * - visibleTopics: list of visible topics, including parents
 * - allTopics: list of all topics, including parents
 * @param {Array} topics List of topics
 * @returns {Object} Taxonomy object
 */
function computeTaxonomyFromTopics(topics, path) {
  // no topics: default to a randomly choosen category
  const category = topics?.length > 0 ? topics[0] : 'news';

  if (taxonomy) {
    const allTopics = [];
    const visibleTopics = [];
    // if taxonomy loaded, we can compute more
    topics.forEach((tag) => {
      const tax = taxonomy.get(tag);
      if (tax) {
        if (!allTopics.includes(tag) && !tax.skipMeta) {
          allTopics.push(tag);
          if (tax.isUFT) visibleTopics.push(tag);
          const parents = taxonomy.getParents(tag);
          if (parents) {
            parents.forEach((parent) => {
              const ptax = taxonomy.get(parent);
              if (!allTopics.includes(parent)) {
                allTopics.push(parent);
                if (ptax.isUFT) visibleTopics.push(parent);
              }
            });
          }
        }
      } else {
        debug(`Unknown topic in tags list: ${tag} ${path ? `on page ${path}` : '(current page)'}`);
      }
    });
    return {
      category, topics, visibleTopics, allTopics,
    };
  }
  return {
    category, topics,
  };
}

// eslint-disable-next-line no-unused-vars
async function loadTaxonomy() {
  const mod = await import('./taxonomy.js');
  taxonomy = await mod.default(getLanguage());
  if (taxonomy) {
    // taxonomy loaded, post loading adjustments
    // fix the links which have been created before the taxonomy has been loaded
    // (pre lcp or in lcp block).
    document.querySelectorAll('[data-topic-link]').forEach((a) => {
      const topic = a.dataset.topicLink;
      const tax = taxonomy.get(topic);
      if (tax) {
        a.href = tax.link;
      } else {
        // eslint-disable-next-line no-console
        debug(`Trying to get a link for an unknown topic: ${topic} (current page)`);
        a.href = '#';
      }
      delete a.dataset.topicLink;
    });

    // adjust meta article:tag

    const currentTags = getMetadata('article:tag', true);
    const articleTax = computeTaxonomyFromTopics(currentTags);

    const allTopics = articleTax.allTopics || [];
    allTopics.forEach((topic) => {
      if (!currentTags.includes(topic)) {
        // computed topic (parent...) is not in meta -> add it
        const newMetaTag = document.createElement('meta');
        newMetaTag.setAttribute('property', 'article:tag');
        newMetaTag.setAttribute('content', topic);
        document.head.append(newMetaTag);
      }
    });

    currentTags.forEach((tag) => {
      const tax = taxonomy.get(tag);
      if (tax && tax.skipMeta) {
        // if skipMeta, remove from meta "article:tag"
        const meta = document.querySelector(`[property="article:tag"][content="${tag}"]`);
        if (meta) {
          meta.remove();
        }
        // but add as meta with name
        const newMetaTag = document.createElement('meta');
        newMetaTag.setAttribute('name', tag);
        newMetaTag.setAttribute('content', 'true');
        document.head.append(newMetaTag);
      }
    });
  }
}

export function getTaxonomy() {
  return taxonomy;
}

/**
 * Returns a link tag with the proper href for the given topic.
 * If the taxonomy is not yet available, the tag is decorated with the topicLink
 * data attribute so that the link can be fixed later.
 * @param {string} topic The topic name
 * @returns {string} A link tag as a string
 */
export function getLinkForTopic(topic, path) {
  // temporary title substitutions
  const titleSubs = {
    'Transformation digitale': 'Transformation numérique',
  };
  let catLink;
  if (taxonomy) {
    const tax = taxonomy.get(topic);
    if (tax) {
      catLink = tax.link;
    } else {
      // eslint-disable-next-line no-console
      debug(`Trying to get a link for an unknown topic: ${topic} ${path ? `on page ${path}` : '(current page)'}`);
      catLink = '#';
    }
  }

  return `<a href="${catLink || ''}" ${!catLink ? `data-topic-link="${topic}"` : ''}>${titleSubs[topic] || topic}</a>`;
}

/**
 * Loads (i.e. sets on object) the taxonmoy properties for the given article.
 * @param {Object} article The article to enhance with the taxonomy data
 */
function loadArticleTaxonomy(article) {
  if (!article.allTopics) {
    // for now, we can only compute the category
    const { tags, path } = article;

    if (tags) {
      const topics = tags
        .replace(/[["\]]/gm, '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t && t !== '');

      const articleTax = computeTaxonomyFromTopics(topics, path);

      article.category = articleTax.category;

      // topics = tags as an array
      article.topics = topics;

      // visibleTopics = visible topics including parents
      article.visibleTopics = articleTax.allVisibleTopics;

      // allTopics = all topics including parents
      article.allTopics = articleTax.allTopics;
    } else {
      article.category = 'News';
      article.topics = [];
      article.visibleTopics = [];
      article.allTopics = [];
    }
  }
}

/**
 * Get the taxonomy of the given article. Object can be composed of:
 * - category: main topic
 * - topics: tags as an array
 * - visibleTopics: list of visible topics, including parents
 * - allTopics: list of all topics, including parents
 * Note: to get the full object, taxonomy must be loaded
 * @param {Object} article The article
 * @returns The taxonomy object
 */
export function getArticleTaxonomy(article) {
  if (!article.allTopics) {
    loadArticleTaxonomy(article);
  }

  const {
    category,
    topics,
    visibleTopics,
    allTopics,
  } = article;

  return {
    category, topics, visibleTopics, allTopics,
  };
}

/**
 * Adds one or more URLs to the dependencies for publishing.
 * @param {string|[string]} url The URL(s) to add as dependencies
 */
export function addPublishDependencies(url) {
  const urls = Array.isArray(url) ? url : [url];
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies = window.hlx.dependencies.concat(urls);
  } else {
    window.hlx.dependencies = urls;
  }
}

/**
 * Sanitizes a name for use as class name.
 * @param {*} name The unsanitized name
 * @returns {string} The class name
 */
export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

/**
 * Wraps each section in an additional {@code div}.
 * @param {[Element]} sections The sections
 */
function wrapSections(sections) {
  sections.forEach((div) => {
    if (!div.id) {
      const wrapper = document.createElement('div');
      wrapper.className = 'section-wrapper';
      div.parentNode.appendChild(wrapper);
      wrapper.appendChild(div);
    }
  });
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const classes = Array.from(block.classList.values());
  const blockName = classes[0];
  if (!blockName) return;
  const section = block.closest('.section-wrapper');
  if (section) {
    section.classList.add(`${classes.join('-')}-container`);
  }
  const trimDashes = (str) => str.replace(/(^\s*-)|(-\s*$)/g, '');
  const blockWithVariants = blockName.split('--');
  const shortBlockName = trimDashes(blockWithVariants.shift());
  const variants = blockWithVariants.map((v) => trimDashes(v));
  block.classList.add(shortBlockName);
  block.classList.add(...variants);

  block.classList.add('block');
  block.setAttribute('data-block-name', shortBlockName);
  block.setAttribute('data-block-status', 'initialized');

  const blockWrapper = block.parentElement;
  blockWrapper.classList.add(`${shortBlockName}-wrapper`);
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * removes formatting from images.
 * @param {Element} mainEl The container element
 */
function removeStylingFromImages(mainEl) {
  // remove styling from images, if any
  const styledImgEls = [...mainEl.querySelectorAll('strong picture'), ...mainEl.querySelectorAll('em picture')];
  styledImgEls.forEach((imgEl) => {
    const parentEl = imgEl.closest('p');
    parentEl.prepend(imgEl);
    parentEl.lastElementChild.remove();
  });
}

/**
 * returns an image caption of a picture elements
 * @param {Element} picture picture element
 */
function getImageCaption(picture) {
  const parentEl = picture.parentNode;
  const parentSiblingEl = parentEl.nextElementSibling;
  return (parentSiblingEl && parentSiblingEl.firstChild.nodeName === 'EM' ? parentSiblingEl : undefined);
}

/**
 * builds images blocks from default content.
 * @param {Element} mainEl The container element
 */
function buildImageBlocks(mainEl) {
  // select all non-featured, default (non-images block) images
  const imgEls = [...mainEl.querySelectorAll(':scope > div > p > picture')];
  let lastImagesBlock;
  imgEls.forEach((imgEl) => {
    const parentEl = imgEl.parentNode;
    const imagesBlockEl = buildBlock('images', {
      elems: [imgEl.cloneNode(true), getImageCaption(imgEl)],
    });
    if (parentEl.parentNode) {
      parentEl.replaceWith(imagesBlockEl);
      lastImagesBlock = imagesBlockEl;
    } else {
      // same parent, add image to last images block
      lastImagesBlock.firstElementChild.append(imagesBlockEl.firstElementChild.firstElementChild);
    }
  });
}

/**
 * builds article header block from meta and default content.
 * @param {Element} mainEl The container element
 */
function buildArticleHeader(mainEl) {
  const div = document.createElement('div');
  const h1 = mainEl.querySelector('h1');
  const picture = mainEl.querySelector('picture');
  const tags = getMetadata('article:tag', true);
  const category = tags.length > 0 ? tags[0] : '';
  const author = getMetadata('author');
  const authorURL = getMetadata('author-url') || `${getRootPath()}/authors/${toClassName(author)}`;
  const publicationDate = getMetadata('publication-date');

  const categoryTag = getLinkForTopic(category);

  const articleHeaderBlockEl = buildBlock('article-header', [
    [`<p>${categoryTag}</p>`],
    [h1],
    [`<p><a href="${authorURL}">${author}</a></p>
      <p>${publicationDate}</p>`],
    [{ elems: [picture.closest('p'), getImageCaption(picture)] }],
  ]);
  div.append(articleHeaderBlockEl);
  mainEl.prepend(div);
}

function buildTagHeader(mainEl) {
  const div = mainEl.querySelector('div');

  if (div) {
    const heading = div.querySelector(':scope > h1, div > h2');
    const picture = div.querySelector(':scope > p > picture');

    if (picture) {
      const tagHeaderBlockEl = buildBlock('tag-header', [
        [heading],
        [{ elems: [picture.closest('p')] }],
      ]);
      div.prepend(tagHeaderBlockEl);
    }
  }
}

function buildAuthorHeader(mainEl) {
  const div = mainEl.querySelector('div');
  const heading = mainEl.querySelector('h1, h2');
  const bio = heading.nextElementSibling;
  const picture = mainEl.querySelector('picture');
  const elArr = [[heading]];
  if (picture) {
    elArr.push([{ elems: [picture.closest('p')] }]);
  }
  if (bio && bio.nodeName === 'P') {
    elArr.push([bio]);
  }
  const authorHeaderBlockEl = buildBlock('author-header', elArr);
  div.prepend(authorHeaderBlockEl);
}

function buildSocialLinks(mainEl) {
  const socialPar = [...mainEl.querySelectorAll('p')].find((p) => p.textContent.trim() === 'Social:');
  if (socialPar && socialPar.nextElementSibling === socialPar.parentNode.querySelector('ul')) {
    const socialLinkList = socialPar.nextElementSibling.outerHTML;
    socialPar.nextElementSibling.remove();
    socialPar.replaceWith(buildBlock('social-links', [[socialLinkList]]));
  }
}

function buildNewsletterModal(mainEl) {
  const $div = document.createElement('div');
  const $newsletterModal = buildBlock('newsletter-modal', []);
  $div.append($newsletterModal);
  mainEl.append($div);
}

function buildArticleFeed(mainEl, type) {
  const div = document.createElement('div');
  const title = mainEl.querySelector('h1, h2').textContent.trim();
  const articleFeedEl = buildBlock('article-feed', [
    [type, title],
  ]);
  div.append(articleFeedEl);
  mainEl.append(div);
}

function buildTagsBlock(mainEl) {
  const topics = getMetadata('article:tag', true);
  if (taxonomy && topics.length > 0) {
    const articleTax = computeTaxonomyFromTopics(topics);
    const tagsForBlock = articleTax.visibleTopics.map((topic) => getLinkForTopic(topic));

    const tagsBlock = buildBlock('tags', [
      [`<p>${tagsForBlock.join('')}</p>`],
    ]);
    const recBlock = mainEl.querySelector('.recommended-articles-container');
    if (recBlock) {
      recBlock.previousElementSibling.firstElementChild.append(tagsBlock);
    } else if (mainEl.lastElementChild.firstElementChild) {
      // insert in div of the last element
      mainEl.lastElementChild.firstElementChild.append(tagsBlock);
    }
    decorateBlock(tagsBlock);
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
function decorateBlocks(main) {
  main
    .querySelectorAll('div.section-wrapper > div > div')
    .forEach((block) => decorateBlock(block));
}

/**
 * Add Article to article history for personalization
 */

function addArticleToHistory() {
  const locale = getLocale();
  const key = `blog-${locale}-history`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.unshift({ path: window.location.pathname, tags: getMetadata('article:tag') });
  localStorage.setItem(key, JSON.stringify(history.slice(0, 5)));
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(mainEl) {
  removeStylingFromImages(mainEl);
  try {
    if (getMetadata('publication-date') && !mainEl.querySelector('.article-header')) {
      buildArticleHeader(mainEl);
      addArticleToHistory();
    }
    if (window.location.pathname.includes('/topics/')) {
      buildTagHeader(mainEl);
      if (!mainEl.querySelector('.article-feed')) {
        buildArticleFeed(mainEl, 'tags');
      }
    }
    if (window.location.pathname.includes('/authors/')) {
      buildAuthorHeader(mainEl);
      buildSocialLinks(mainEl);
      if (!document.querySelector('.article-feed')) {
        buildArticleFeed(mainEl, 'author');
      }
    }
    buildImageBlocks(mainEl);
    buildNewsletterModal(mainEl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function unwrapBlock(block) {
  const section = block.parentNode;
  const els = [...section.children];
  const blockSection = document.createElement('div');
  const postBlockSection = document.createElement('div');
  const nextSection = section.nextElementSibling;
  section.parentNode.insertBefore(blockSection, nextSection);
  section.parentNode.insertBefore(postBlockSection, nextSection);

  let appendTo;
  els.forEach((el) => {
    if (el === block) appendTo = blockSection;
    if (appendTo) {
      appendTo.appendChild(el);
      appendTo = postBlockSection;
    }
  });
  if (section.childElementCount === 0) {
    section.remove();
  }
  if (blockSection.childElementCount === 0) {
    blockSection.remove();
  }
  if (postBlockSection.childElementCount === 0) {
    postBlockSection.remove();
  }
}

function splitSections() {
  document.querySelectorAll('main > div > div').forEach((block) => {
    const blocksToSplit = ['article-header', 'article-feed', 'recommended-articles', 'video', 'carousel'];
    if (blocksToSplit.includes(block.className)) {
      unwrapBlock(block);
    }
  });
}

function removeEmptySections() {
  document.querySelectorAll('main > div').forEach((div) => {
    if (div.innerHTML.trim() === '') {
      div.remove();
    }
  });
}

/**
 * Build figcaption element
 * @param {Element} pEl The original element to be placed in figcaption.
 * @returns figCaptionEl Generated figcaption
 */
export function buildCaption(pEl) {
  const figCaptionEl = document.createElement('figcaption');
  pEl.classList.add('caption');
  figCaptionEl.append(pEl);
  return figCaptionEl;
}

/**
 * Build figure element
 * @param {Element} blockEl The original element to be placed in figure.
 * @returns figEl Generated figure
 */
export function buildFigure(blockEl) {
  const figEl = document.createElement('figure');
  figEl.classList.add('figure');
  Array.from(blockEl.children).forEach((child) => {
    const clone = child.cloneNode(true);
    // picture, video, or embed link is NOT wrapped in P tag
    if (clone.nodeName === 'PICTURE' || clone.nodeName === 'VIDEO' || clone.nodeName === 'A') {
      figEl.prepend(clone);
    } else {
      // content wrapped in P tag(s)
      const picture = clone.querySelector('picture');
      if (picture) {
        figEl.prepend(picture);
      }
      const video = clone.querySelector('video');
      if (video) {
        figEl.prepend(video);
      }
      const caption = clone.querySelector('em');
      if (caption) {
        const figElCaption = buildCaption(caption);
        figEl.append(figElCaption);
      }
      const link = clone.querySelector('a');
      if (link) {
        const img = figEl.querySelector('picture') || figEl.querySelector('video');
        if (img) {
          // wrap picture or video in A tag
          link.textContent = '';
          link.append(img);
        }
        figEl.prepend(link);
      }
    }
  });
  return figEl;
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name');
    const { list } = window.milo?.libs?.blocks;
    // Determine if block should be loaded from milo libs
    const isMiloBlock = !!(list && list.includes(blockName));
    const base = isMiloBlock ? window.milo.libs.base : '';
    try {
      const cssLoaded = new Promise((resolve) => {
        loadCSS(`${base}/blocks/${blockName}/${blockName}.css`, resolve);
        if (isMiloBlock) {
          loadCSS(`${base}/styles/variables.css`, resolve);
        }
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(`${base}/blocks/${blockName}/${blockName}.js`);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            debug(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      debug(`failed to load module for ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
function loadBlocks(main) {
  const blockPromises = [...main.querySelectorAll('div.section-wrapper > div > .block')]
    .map((block) => loadBlock(block));
  return blockPromises;
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope>div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const valueEl = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (valueEl.querySelector('a')) {
          const aArr = [...valueEl.querySelectorAll('a')];
          if (aArr.length === 1) {
            value = aArr[0].href;
          } else {
            value = aArr.map((a) => a.href);
          }
        } else if (valueEl.querySelector('p')) {
          const pArr = [...valueEl.querySelectorAll('p')];
          if (pArr.length === 1) {
            value = pArr[0].textContent;
          } else {
            value = pArr.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {[string]]} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent}</h${level}>`;
      }
    }
  });
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
    }
  });

  return picture;
}

/**
 * Formats the article date for the card using the date locale
 * matching the content displayed.
 * @param {number} date The date to format
 * @returns {string} The formatted card date
 */
export function formatLocalCardDate(date) {
  let jsDate = date;
  if (!date.includes('-')) {
    // number case, coming from Excel
    // 1/1/1900 is day 1 in Excel, so:
    // - add this
    // - add days between 1/1/1900 and 1/1/1970
    // - add one more day for Excel's leap year bug
    jsDate = new Date(Math.round((date - (1 + 25567 + 1)) * 86400 * 1000));
  } else {
    // Safari won't accept '-' as a date separator
    jsDate = date.replace(/-/g, '/');
  }
  const dateLocale = getDateLocale();

  let dateString = new Date(jsDate).toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (dateLocale === 'en-US') {
    // stylize US date format with dashes instead of slashes
    dateString = dateString.replace(/\//g, '-');
  }
  return dateString;
}

/**
 * Build article card
 * @param {Element} article The article data to be placed in card.
 * @returns card Generated card
 */
export function buildArticleCard(article, type = 'article', eager = false) {
  const {
    title, description, image, imageAlt, date,
  } = article;

  const path = article.path.split('.')[0];

  const picture = createOptimizedPicture(image, imageAlt || title, eager, [{ width: '750' }]);
  const pictureTag = picture.outerHTML;
  const card = document.createElement('a');
  card.className = `${type}-card`;
  card.href = path;

  const articleTax = getArticleTaxonomy(article);
  const categoryTag = getLinkForTopic(articleTax.category, path);

  card.innerHTML = `<div class="${type}-card-image">
      ${pictureTag}
    </div>
    <div class="${type}-card-body">
      <p class="${type}-card-category">
        ${categoryTag}
      </p>
      <h3>${title}</h3>
      <p class="${type}-card-description">${description}</p>
      <p class="${type}-card-date">${formatLocalCardDate(date)}
    </div>`;
  return card;
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
function decoratePictures(main) {
  main.querySelectorAll('img[src*="/media_"]').forEach((img, i) => {
    const newPicture = createOptimizedPicture(img.src, img.alt, !i);
    const picture = img.closest('picture');
    if (picture) picture.parentElement.replaceChild(newPicture, picture);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  // forward compatible pictures redecoration
  decoratePictures(main);
  makeLinksRelative(main);
  buildAutoBlocks(main);
  splitSections();
  removeEmptySections();
  wrapSections(main.querySelectorAll(':scope > div'));
  decorateBlocks(main);

  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  window.setTimeout(() => sampleRUM.observe(main.querySelectorAll('picture > img')), 1000);
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * fetches blog article index.
 * @returns {object} index with data and path lookup
 */
export async function fetchBlogArticleIndex() {
  const pageSize = 500;
  window.blogIndex = window.blogIndex || {
    data: [],
    byPath: {},
    offset: 0,
    complete: false,
  };
  if (window.blogIndex.complete) return (window.blogIndex);
  const index = window.blogIndex;
  const resp = await fetch(`${getRootPath()}/query-index.json?limit=${pageSize}&offset=${index.offset}`);
  const json = await resp.json();
  const complete = (json.limit + json.offset) === json.total;
  json.data.forEach((post) => {
    index.data.push(post);
    index.byPath[post.path.split('.')[0]] = post;
  });
  index.complete = complete;
  index.offset = json.offset + pageSize;
  return (index);
}

/**
 * gets a blog article index information by path.
 * @param {string} path indentifies article
 * @returns {object} article object (or null if article does not exist)
 */

export async function getBlogArticle(path) {
  const meta = await getMetadataJson(`${path}.metadata.json`);

  if (meta) {
    let title = meta['og:title'].trim();
    const trimEndings = ['|Adobe', '| Adobe', '| Adobe Blog', '|Adobe Blog'];
    trimEndings.forEach((ending) => {
      if (title.endsWith(ending)) title = title.substr(0, title.length - ending.length);
    });

    const articleMeta = {
      description: meta.description,
      title,
      author: meta.author,
      image: meta['og:image'],
      imageAlt: meta['og:image:alt'],
      date: meta['publication-date'],
      path,
      tags: meta['article:tag'],
    };
    loadArticleTaxonomy(articleMeta);
    return articleMeta;
  }
  return null;
}

/**
 * fetches the string variables.
 * @returns {object} localized variables
 */

export async function fetchPlaceholders() {
  if (!window.placeholders) {
    const resp = await fetch(`${getRootPath()}/placeholders.json`);
    const json = await resp.json();
    window.placeholders = {};
    json.data.forEach((placeholder) => {
      window.placeholders[placeholder.Key] = placeholder.Text;
    });
  }
  return window.placeholders;
}

/**
 * loads a script by adding a script tag to the head.
 * @param {string} url URL of the js file
 * @param {Function} callback callback on load
 * @param {string} type type attribute of script tag
 * @returns {Element} script element
 */

export function loadScript(url, callback, type) {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.setAttribute('src', url);
  if (type) {
    script.setAttribute('type', type);
  }
  head.append(script);
  script.onload = callback;
  return script;
}

export async function loadLibs() {
  window.milo = window.milo || {};
  if (!window.milo.libs) {
    let domain = `https://${PRODUCTION_DOMAINS[0]}`;
    const isProd = window.location.hostname === PRODUCTION_DOMAINS[0];
    if (!isProd) {
      const milolibs = new URLSearchParams(window.location.search).get('milolibs');
      const libStore = milolibs || 'main';
      domain = libStore === 'local' ? 'http://localhost:6456' : `https://${libStore}.milo.pink`;
    }
    window.milo.libs = { base: `${domain}/libs` };
    try {
      const { default: list } = await import(`${window.milo.libs.base}/blocks/list.js`);
      window.milo.libs.blocks = { list };
    } catch (e) {
      window.milo.libs.blocks = {};
      // eslint-disable-next-line no-console
      console.log('Couldn\'t load libs list');
    }
  }
}

function loadPrivacy() {
  function getOtDomainId() {
    const domains = {
      'adobe.com': '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
      'hlx.page': '3a6a37fe-9e07-4aa9-8640-8f358a623271',
      'adobeaemcloud.com': '70cd62b6-0fe3-4e20-8788-ef0435b8cdb1',
    };

    const currentDomain = Object.keys(domains)
      .find((domain) => window.location.host.indexOf(domain) > -1);

    return `${domains[currentDomain] || domains[Object.keys(domains)[0]]}`;
  }

  // Configure Privacy
  window.fedsConfig = {
    privacy: {
      otDomainId: getOtDomainId(), // your OneTrust domain ID - see list of domains
      footerLinkSelector: '[href="https://www.adobe.com/#openPrivacy"]', // CSS selector that will open the privacy modal
    },
  };

  const env = getHelixEnv().subdomain;
  loadScript(`https://www.${env}adobe.com/etc.clientlibs/globalnav/clientlibs/base/privacy-standalone.js`);
}

/**
 * Loads everything needed to get to LCP.
 */
async function loadEager() {
  const main = document.querySelector('main');
  if (main) {
    await loadLibs();
    decorateMain(main);
    const lcpBlocks = ['featured-article', 'article-header'];
    const block = document.querySelector('.block');
    const hasLCPBlock = (block && lcpBlocks.includes(block.getAttribute('data-block-name')));
    if (hasLCPBlock) await loadBlock(block, true);
    document.querySelector('body').classList.add('appear');
    const lcpCandidate = document.querySelector('main img');
    await new Promise((resolve) => {
      if (lcpCandidate && !lcpCandidate.complete) {
        lcpCandidate.addEventListener('load', () => resolve());
        lcpCandidate.addEventListener('error', () => resolve());
      } else {
        resolve();
      }
    });
    loadPrivacy();
  }
  if (document.querySelector('helix-sidekick')) {
    import('../tools/sidekick/plugins.js');
  } else {
    document.addEventListener('helix-sidekick-ready', () => {
      import('../tools/sidekick/plugins.js');
    }, { once: true });
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy() {
  const main = document.querySelector('main');

  // post LCP actions go here
  sampleRUM('lcp');

  /* load gnav */
  const header = document.querySelector('header');
  const gnavPath = getMetadata('gnav') || `${getRootPath()}/gnav`;
  header.setAttribute('data-block-name', 'gnav');
  header.setAttribute('data-gnav-source', gnavPath);
  loadBlock(header);

  /* load footer */
  const footer = document.querySelector('footer');
  footer.setAttribute('data-block-name', 'footer');
  footer.setAttribute('data-footer-source', `${getRootPath()}/footer`);
  loadBlock(footer);

  await loadTaxonomy();

  /* taxonomy dependent */
  buildTagsBlock(main);

  loadBlocks(main);
  loadCSS('/styles/lazy-styles.css');
  addFavIcon('/styles/favicon.svg');

  sampleRUM('lazy');
  sampleRUM.observe(document.querySelectorAll('main picture > img'));
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));

  if (window.location.pathname.endsWith('/')) {
    // homepage, add query index to publish dependencies
    const limit = 500;
    let offset = 0;
    while (offset < limit * 10) {
      addPublishDependencies(`/${getLanguage()}/query-index.json?limit=${limit}&offset=${offset}`);
      offset += limit;
    }
  }
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  /* trigger delayed.js load */
  const delayedScript = '/scripts/delayed.js';
  const usp = new URLSearchParams(window.location.search);
  const delayed = usp.get('delayed');

  if (!(delayed === 'off' || document.querySelector(`head script[src="${delayedScript}"]`))) {
    let ms = 3500;
    const delay = usp.get('delay');
    if (delay) ms = +delay;
    setTimeout(() => {
      loadScript(delayedScript, null, 'module');
    }, ms);
  }
}

/**
 * Decorates the page.
 */
async function decoratePage() {
  await loadEager();
  loadLazy();
  loadDelayed();
}

decoratePage(window);

function setHelixEnv(name, overrides) {
  if (name) {
    sessionStorage.setItem('helix-env', name);
    if (overrides) {
      sessionStorage.setItem('helix-env-overrides', JSON.stringify(overrides));
    } else {
      sessionStorage.removeItem('helix-env-overrides');
    }
  } else {
    sessionStorage.removeItem('helix-env');
    sessionStorage.removeItem('helix-env-overrides');
  }
}

function displayEnv() {
  try {
    /* setup based on URL Params */
    const usp = new URLSearchParams(window.location.search);
    if (usp.has('helix-env')) {
      const env = usp.get('helix-env');
      setHelixEnv(env);
    }

    /* setup based on referrer */
    if (document.referrer) {
      const url = new URL(document.referrer);
      if (window.location.hostname !== url.hostname) {
        debug(`external referrer detected: ${document.referrer}`);
      }
    }
  } catch (e) {
    debug(`display env failed: ${e.message}`);
  }
}
displayEnv();
/*
 * lighthouse performance instrumentation helper
 * (needs a refactor)
 */

export function stamp(message) {
  if (window.name.includes('performance')) {
    debug(`${new Date() - performance.timing.navigationStart}:${message}`);
  }
}

stamp('start');

function registerPerformanceLogger() {
  try {
    const polcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      debug(entries[0].element);
    });
    polcp.observe({ type: 'largest-contentful-paint', buffered: true });

    const pols = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      debug(entries[0].sources[0].node);
    });
    pols.observe({ type: 'layout-shift', buffered: true });

    const pores = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        stamp(`resource loaded: ${entry.name} - [${Math.round(entry.startTime + entry.duration)}]`);
      });
    });

    pores.observe({ type: 'resource', buffered: true });
  } catch (e) {
    // no output
  }
}

if (window.name.includes('performance')) registerPerformanceLogger();
