const { getLanguage, getTags, getTaxonomy } = require('./scripts.js');

/* globals digitalData _satellite */

/* eslint-disable no-underscore-dangle */

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

function trackPageLoad() {
  if (!digitalData || !_satellite) {
    return;
  }

  // pageload for initial pageload (For regular tracking of pageload hits)
  _satellite.track('pageload', {
    digitalData: digitalData._snapshot(),
  });
}

setDigitalData();
trackPageLoad();
