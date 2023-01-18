/**
 * Retrieves the content of a metadata tag. Multivalued metadata are returned
 * as a comma-separated list (or as an array of string if asArray is true).
 * @param {string} name The metadata name (or property)
 * @param {boolean} asArray Return an array instead of a comma-separated string
 * @returns {string|Array} The metadata value
 */
const getMetadata = (name, asArray = false) => {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((el) => el.content);

  return asArray ? meta : meta.join(', ');
};

const getTags = () => getMetadata('article:tag', true);

/* globals digitalData _satellite */

/* eslint-disable no-underscore-dangle */

function setDigitalData() {
  // creates a string from the categories & products for analytics
  // example: "Category: #AdobeForAll | Category: Adobe Life | Product: Photoshop"
  const getPageFilterInfo = () => {
    let pageFilterInfo = '';
    const tags = getTags();
    const taxonomy = window.getTaxonomy();
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
  let lang = window.getLanguage();
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
