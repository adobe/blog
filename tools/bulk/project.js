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
  const resp = await fetch(sitemapURL);
  const xml = await resp.text();
  const sitemap = new DOMParser().parseFromString(xml, 'text/xml');
  const subSitemaps = [...sitemap.querySelectorAll('sitemap loc')];
  let paths = [];
  const promises = subSitemaps.map((loc) => new Promise((resolve) => {
    const subSitemapURL = new URL(loc.textContent);
    loadSitemap(subSitemapURL.pathname).then((result) => {
      paths = paths.concat(result);
      resolve();
    });
  }));

  await Promise.all(promises);

  const urlLocs = sitemap.querySelectorAll('url loc');
  urlLocs.forEach((loc) => {
    const locURL = new URL(loc.textContent);
    paths.push(locURL.pathname);
  });

  return paths;
}

let allPaths;
async function getPaths(filter, limit = -1) {
  if (!allPaths) {
    allPaths = await loadSitemap(SITEMAP_ROOT) || [];
    allPaths.sort();
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
