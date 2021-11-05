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
/* global $browser $driver */
/* eslint-disable no-console */

/*
 * Scripted Browser API Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 */
const assert = require('assert');

const baseUrl = '$$$URL$$$';

/**
 * Checks if the specified homepage is loading and showing the expected content.
 * @param {string} url The URL of the homepage to check
 */
async function checkHomepage(url) {
  $browser.get(url)
    .then(async () => {
      console.log(`Page ${url} loaded.`);
      if (url === `${baseUrl}/`) {
        // First make sure the main homepage is not static
        let staticMarker;
        try {
          staticMarker = await $browser.findElement($driver.By.id('___WARNING__STATIC_HOMEPAGE___'));
        } catch (e) {
          // good
        }
        if (staticMarker) {
          assert.fail('This homepage is static: backend must be down!');
        }
      }
      console.log('Waiting for ".load-more" element...');
      return $browser.waitForAndFindElement($driver.By.css('.load-more'), 60000);
    }).then(() => {
      console.log('".load-more" element found. Retrieving the articles...');
      return $browser.findElements($driver.By.css('.article-card, .featured-article-card'));
    }).then((articles) => {
      assert.ok(articles.length >= 12, `Expected at least 12 articles, got ${articles.length}`);
      console.log(`Found ${articles.length} articles in the page. Retrieving featured article...`);
      return $browser.findElement($driver.By.css('.featured-article-card'), 60000);
    })
    .then(() => console.log('Found featured article. All good!'));
}

// Check the default and all regional homepages
(async () => {
  await Promise.all([
    '/',
    '/br/',
    '/de/',
    '/en/apac.html',
    '/en/uk.html',
    '/es/',
    '/es/latam.html',
    '/fr/',
    '/it/',
    '/jp/',
    '/ko/',
  ].map((path) => checkHomepage(`${baseUrl}${path}`)));
})();
