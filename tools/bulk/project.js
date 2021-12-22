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

// const OWNER = 'adobe';
// const REPO = 'blog';
// const BRANCH = 'main';
const INDEX_PATH = '/fr/query-index.json';

// const HOST = `https://${BRANCH}--${REPO}--${OWNER}.hlx.live`;
// const INDEX_URL = `${HOST}${INDEX_PATH}`;

// const LIMIT = -1;
const LIMIT = 1000;

let fetched;
async function getPaths() {
  if (fetched) return fetched;
  const res = await fetch(INDEX_PATH);
  if (res.ok) {
    const json = await res.json();
    fetched = json.data.map((d) => d.path);
    if (LIMIT > 0) {
      fetched = fetched.slice(0, LIMIT);
    }
    return fetched;
  }
  return [];
}

function getURL(path) {
  return path;
  // return `${HOST}${path}`;
}

export {
  getPaths,
  getURL,
};
