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
/* eslint-disable no-use-before-define, no-console */

import { getConfig } from '../config.js';
import { debounce } from '../utils.js';
import { getPaths, getURL } from '../project.js';

const status = document.getElementById('status');
const loading = document.getElementById('loading');
const STATUS_LEVELS = ['level-0', 'level-4'];

function setStatus(msg, level = 'level-4') {
  status.classList.remove(STATUS_LEVELS.filter((l) => l !== level));
  status.classList.add(level);
  status.innerHTML = msg;
}

function loadingON(txt) {
  loading.classList.remove('hidden');
  setStatus(txt);
}

function loadingOFF() {
  loading.classList.add('hidden');
}

function setError(msg, error) {
  setStatus(msg, 'level-0');
  // eslint-disable-next-line no-console
  console.error(msg, error);
}

function displayResults(total, time, results, searchString) {
  const panel = document.getElementById('results');
  panel.innerHTML = '';
  if (!results || results.length === 0) {
    if (searchString) {
      const child = document.createElement('div');
      child.classList.add('noresult');
      child.innerHTML = `No results for "${searchString}" in ${total} files (${time}s).`;
      panel.appendChild(child);
    }
  } else {
    const numberOfResults = document.createElement('div');
    numberOfResults.classList.add('nbOfResults');

    numberOfResults.innerHTML = `"${searchString}" has been found in ${results.length}/${total} files (${time}s).`;

    panel.appendChild(numberOfResults);

    results.forEach((r) => {
      const child = document.createElement('div');
      child.classList.add('result');

      const path = document.createElement('div');
      path.classList.add('path');
      path.innerHTML = r.path;

      const lines = document.createElement('div');
      lines.classList.add('lines');

      const split = r.content.split('\n');
      for (let i = 0; i < split.length; i += 1) {
        const line = split[i];
        if (line.indexOf(searchString) !== -1) {
          const lineNumber = document.createElement('span');
          lineNumber.classList.add('lineNumber');
          lineNumber.innerHTML = `${i + 1}: `;

          const text = document.createElement('span');
          text.classList.add('text');
          text.innerHTML = line.replaceAll(searchString, `<font>${searchString}</font>`);

          const lineElement = document.createElement('div');
          lineElement.classList.add('line');
          lineElement.appendChild(lineNumber);
          lineElement.appendChild(text);

          lines.appendChild(lineElement);
        }
      }

      child.appendChild(path);
      child.appendChild(lines);
      panel.appendChild(child);
    });
  }
}

const content = {
  array: [],
  object: {},
};

async function getContent(path) {
  if (content.object[path]) return content.object[path];
  return loadContent(path);
}

async function loadContent(path) {
  const mdPath = `${path}.md`;
  const res = await fetch(getURL(mdPath));
  if (res.ok) {
    const text = await res.text();
    const o = {
      path,
      content: text,
    };
    content.array.push(o);
    content.object[path] = o;
    return o;
  }
  console.error(`Error fetching ${mdPath}`);
  return null;
}

let lastSearch = '';
async function search() {
  const searchString = (document.querySelector('#search input').value || '').trim();
  if (searchString === lastSearch) return;

  const searchResults = [];
  let total = 0;
  const start = new Date().getTime();
  displayResults(total, (new Date().getTime() - start) / 1000);

  lastSearch = searchString;

  if (searchString !== '') {
    console.log('searching...', searchString);

    const paths = await getPaths();

    paths.forEach((path) => {
      getContent(path).then((c) => {
        total += 1;
        if (c && c.content.indexOf(searchString) !== -1) {
          searchResults.push(c);
          displayResults(total, (new Date().getTime() - start) / 1000, searchResults, searchString);
        }
      });
    });

    // const promises = paths.map(async (path) => {
    //   total += 1;
    //   const c = await getContent(path);
    //   if (c && c.content.indexOf(searchString) !== -1) {
    //     searchResults.push(c);
    // displayResults(total, (new Date().getTime() - start) / 1000, searchResults, searchString);
    //   }
    // });

    // await Promise.all(promises);

    // if (searchResults.length === 0) {
    //   displayResults(total, (new Date().getTime() - start) / 1000, null, searchString);
    // }
  }
}

function setListeners() {
  // document.querySelector('#sync button').addEventListener('click', sync);
  // document.querySelector('#save button').addEventListener('click', save);
  document.querySelector('#search button').addEventListener('click', debounce(search, 500));
}

async function init() {
  setListeners();
  loadingON('Initializing the application');
  try {
    await getConfig();
  } catch (err) {
    setError('Something is wrong with the application config', err);
    return;
  }
  loadingON('Config loaded');
  // loadingON('Connecting now to Sharepoint...');
  // await connectToSP(async () => {
  //   loadingON('Connected to Sharepoint!');
  // });
  loadingON('Application loaded.');
  loadingOFF();
}

export {
  // eslint-disable-next-line import/prefer-default-export
  init,
};
