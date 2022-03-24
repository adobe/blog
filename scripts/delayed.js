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

/* globals digitalData _satellite */
/* eslint-disable no-underscore-dangle */

import {
  loadScript,
  sampleRUM,
  getHelixEnv,
  getMetadata,
  getTaxonomy,
  getLanguage,
} from './scripts.js';

function getTags() {
  return getMetadata('article:tag', true);
}

function checkDX(tag) {
  const dxtags = [
    'Experience Cloud', 'Experience Manager', 'Magento Commerce', 'Marketo Engage', 'Target', 'Commerce Cloud', 'Campaign', 'Audience Manager, Analytics, Advertising Cloud',
    'Travel & Hospitality', 'Media & Entertainment', 'Financial Services', 'Government', 'Non-profits', 'Other', 'Healthcare', 'High Tech', 'Retail', 'Telecom', 'Manufacturing', 'Education',
    'B2B', 'Social', 'Personalization', 'Campaign Management', 'Content Management', 'Email Marketing', 'Commerce', 'Analytics', 'Advertising', 'Digital Transformation',
  ];
  return dxtags.includes(tag);
}

function setDigitalData() {
  // creates a string from the categories & products for analytics
  // example: "Category: #AdobeForAll | Category: Adobe Life | Product: Photoshop"
  const getPageFilterInfo = () => {
    let pageFilterInfo = '';
    const tags = getTags();
    const taxonomy = getTaxonomy();
    const categories = [];
    const products = [];
    tags.forEach((t) => {
      const tax = taxonomy.get(t);
      if (tax) {
        if (tax.category.toLowerCase() === taxonomy.PRODUCTS) {
          products.push(t);
        } else {
          categories.push(t);
        }
      }
    });

    // Outputs a String for analytics, example: Category: A | Category: B | Product: C | Product: D
    categories.forEach((category) => {
      pageFilterInfo += `Category: ${category} | `;
    });
    products.forEach((product) => {
      pageFilterInfo += `Product: ${product} | `;
    });

    // remove " | " from the end of the string
    return pageFilterInfo.replace(/ \| $/m, '');
  };

  const langMap = { en: 'en-US' };
  let lang = getLanguage();
  if (langMap[lang]) lang = langMap[lang];
  digitalData._set('page.pageInfo.language', lang);
  digitalData._set('page.pageInfo.siteSection', 'blog.adobe.com');
  digitalData._set('page.pageInfo.attributes.pageFilterInfo', getPageFilterInfo());
}

/**
 * tracks the initial page load
 */
function trackPageLoad() {
  if (!digitalData || !_satellite) {
    return;
  }

  // pageload for initial pageload (For regular tracking of pageload hits)
  _satellite.track('pageload', {
    digitalData: digitalData._snapshot(),
  });
}

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

const launchScriptEl = loadScript('https://www.adobe.com/marketingtech/main.no-promise.min.js', () => {
  setDigitalData();
  trackPageLoad();
});
launchScriptEl.setAttribute('data-seed-adobelaunch', 'true');

/* Core Web Vitals RUM collection */

sampleRUM('cwv');

function updateExternalLinks() {
  document.querySelectorAll('main a').forEach((a) => {
    try {
      const { origin } = new URL(a.href, window.location.href);
      if (origin && origin !== window.location.origin) {
        a.setAttribute('rel', 'noopener');
        a.setAttribute('target', '_blank');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid link: ${a.href}`);
    }
  });
}

// no-interlinks is a special "tag" to skip interlink via content
if (document.querySelector('.article-header')
  && !document.querySelector('[data-origin]')
  && !document.querySelector('[name="no-interlinks"]')) {
  loadScript('/blocks/interlinks/interlinks.js', null, 'module');
}

updateExternalLinks();
