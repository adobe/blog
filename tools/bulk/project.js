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

const SITEMAP_ROOT = '/sitemap-index.xml';

async function loadSitemap(sitemapURL) {
  // const resp = await fetch(sitemapURL);
  // const xml = await resp.text();
  // const sitemap = new DOMParser().parseFromString(xml, 'text/xml');
  // const subSitemaps = [...sitemap.querySelectorAll('sitemap loc')];
  // let paths = [];
  // const promises = subSitemaps.map((loc) => new Promise((resolve) => {
  //   const subSitemapURL = new URL(loc.textContent);
  //   loadSitemap(subSitemapURL.pathname).then((result) => {
  //     paths = paths.concat(result);
  //     resolve();
  //   });
  // }));

  // await Promise.all(promises);

  // const urlLocs = sitemap.querySelectorAll('url loc');
  // urlLocs.forEach((loc) => {
  //   const locURL = new URL(loc.textContent);
  //   paths.push(locURL.pathname);
  // });

  // return paths;

  const paths = [
    '/en/drafts/alex/a/a',
    '/en/drafts/alex/a/b',
    '/en/drafts/alex/a/c',
    '/en/drafts/alex/a/d',
    '/en/drafts/alex/a/e',
    '/en/drafts/alex/a/f',
    '/en/drafts/alex/a/g',
    '/en/drafts/alex/a/h',
    '/en/drafts/alex/a/i',
    '/en/drafts/alex/a/j',
    '/en/drafts/alex/a/k',
    '/en/drafts/alex/a/l',
    '/en/drafts/alex/a/m',
    '/en/drafts/alex/a/n',
  ];
  return paths;
}

let allPaths;
async function getPaths(filter, limit = -1) {
  if (!allPaths) {
    allPaths = await loadSitemap(SITEMAP_ROOT) || [];
    allPaths.sort((a, b) => {
      if (a > b) { return -1; }
      if (a < b) { return 1; }
      return 0;
    });
  }
  if (allPaths) {
    let filtered = allPaths;
    if (filter) {
      filtered = allPaths.filter((path) => path.startsWith(filter));
    }
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }
  return [];
}

export {
  // eslint-disable-next-line import/prefer-default-export
  getPaths,
};
