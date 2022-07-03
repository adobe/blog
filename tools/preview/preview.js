/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console */

import {
  toggleCardPreview,
  getPredictedUrl,
  copyArticleData,
  updateFeed,
} from '../sidekick/plugins.js';

function loadPlugins(sk) {
  sk.addEventListener('custom:card-preview', toggleCardPreview);
  sk.addEventListener('custom:predicted-url', getPredictedUrl);
  sk.addEventListener('custom:copy-article-data', copyArticleData);
  sk.addEventListener('custom:update-feed', updateFeed);
}

function waitForSidekick(callback) {
  const { body } = document;
  const sk = body.querySelector('helix-sidekick');
  if (sk) {
    // sidekick ready
    callback(sk);
  } else {
    // wait for sidekick
    const observer = new MutationObserver((list) => {
      list.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {
          if (node.tagName === 'HELIX-SIDEKICK') {
            observer.disconnect();
            callback(node);
          }
        });
      });
    });
    observer.observe(body, { childList: true });
  }
}

waitForSidekick(loadPlugins);
