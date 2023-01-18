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

export const LANG = {
  EN: 'en',
  DE: 'de',
  FR: 'fr',
  KO: 'ko',
  ES: 'es',
  IT: 'it',
  JP: 'jp',
  BR: 'br',
};

export const LANG_LOCALE = {
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
  window.language = language;
  return language;
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

export function getTags() {
  return getMetadata('article:tag', true);
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
export function computeTaxonomyFromTopics(topics, path) {
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
export async function loadTaxonomy() {
  const mod = await import('./taxonomy.js');
  taxonomy = await mod.default(getLanguage());
  window.taxonomy = taxonomy;
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

const SCRIPT_TYPE_PARTYTOWN = 'text/partytown';

const createScriptElement = (src, type, attributes = {}) => {
  const script = document.createElement('script');
  script.src = src;
  if (type) {
    script.type = type;
  }
  document.head.appendChild(script);

  Object.keys(attributes).forEach((key) => {
    script.setAttribute(key, attributes[key]);
  });

  return script;
};

const checkDX = (tag) => {
  const dxtags = [
    'Experience Cloud', 'Experience Manager', 'Magento Commerce', 'Marketo Engage', 'Target', 'Commerce Cloud', 'Campaign', 'Audience Manager, Analytics, Advertising Cloud',
    'Travel & Hospitality', 'Media & Entertainment', 'Financial Services', 'Government', 'Non-profits', 'Other', 'Healthcare', 'High Tech', 'Retail', 'Telecom', 'Manufacturing', 'Education',
    'B2B', 'Social', 'Personalization', 'Campaign Management', 'Content Management', 'Email Marketing', 'Commerce', 'Analytics', 'Advertising', 'Digital Transformation',
  ];
  return dxtags.includes(tag);
};

const configure = () => {
  window.getLanguage = () => getLanguage();
  window.getTaxonomy = () => getTaxonomy();

  const { target, name } = getHelixEnv();

  let isDX = false;
  const tags = getTags();
  tags.forEach((tag) => {
    if (checkDX(tag)) {
      isDX = true;
    }
  });

  let accounts = '';
  if (isDX) {
    if (name === 'prod') {
      accounts = 'adbadobedxprod';
    } else if (name === 'stage') {
      accounts = 'adbadobedxqa';
    }
  }

  window.marketingtech = window.marketingtech || {};
  window.marketingtech.adobe = {
    target,
    audienceManager: true,
    launch: {
      property: 'global',
      environment: 'production',
    },
    analytics: {
      // additional report suites to send data to “,” separated  Ex: 'RS1,RS2'
      additionalAccounts: accounts,
    },
  };
  window.targetGlobalSettings = window.targetGlobalSettings || {};
  window.targetGlobalSettings.bodyHidingEnabled = false;
};

/**
 * Initializes partytown and creates the necessary script tags for martech tracking.
 * The partytown library is added to the <head> and partytown configured to offload
 * the relevant scripts.
 */
export function offload() {
  configure();
  window.partytown = {
    logCalls: true,
    logGetters: true,
    logSetters: true,
    logStackTraces: false,
    logScriptExecution: true,
    mainWindowAccessors: ['getTaxonomy', 'getLanguage'],
    debug: true,
    lib: '/scripts/',
  };

  // general init of partytown
  import('./partytown.js');

  createScriptElement(
    '/scripts/martech.min.js',
    SCRIPT_TYPE_PARTYTOWN,
    { 'data-seed-adobelaunch': 'true' },
  );
  createScriptElement('/scripts/offload-run.js', SCRIPT_TYPE_PARTYTOWN);
}
