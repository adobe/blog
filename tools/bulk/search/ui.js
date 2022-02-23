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
import { getPaths } from '../project.js';
import { connect, saveFile } from '../sharepoint.js';
import { asyncForEach } from '../utils.js';
import { md2word } from '../helix/md2word-web.bundle.js';

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

let searchResults = [];
let lastIndexDisplayed = -1;
function displayResults(total, time, searchString, replaceString) {
  const panel = document.getElementById('results');
  if (!searchResults || searchResults.length === 0) {
    panel.innerHTML = '';
    lastIndexDisplayed = -1;
    if (searchString) {
      const child = document.createElement('div');
      child.classList.add('noResult');
      child.innerHTML = `No results for "${searchString}" in ${total} files (${time}s).`;
      panel.appendChild(child);
    }
  } else {
    let numberOfResults;
    if (lastIndexDisplayed < 0) {
      panel.innerHTML = '';
      numberOfResults = document.createElement('div');
      numberOfResults.classList.add('nbOfResults');
      panel.appendChild(numberOfResults);
    } else {
      numberOfResults = panel.querySelector('.nbOfResults');
    }

    numberOfResults.innerHTML = `"${searchString}" has been found in ${searchResults.length}/${total} files (${time}s).`;

    let i = lastIndexDisplayed + 1;
    for (; i < searchResults.length; i += 1) {
      const r = searchResults[i];

      const child = document.createElement('div');
      child.classList.add('result');

      const path = document.createElement('div');
      path.classList.add('path');
      const a = document.createElement('a');
      a.href = r.path;
      a.innerHTML = r.path;
      a.target = '_new';
      path.append(a);

      const lines = document.createElement('div');
      lines.classList.add('lines');

      const split = r.content.split('\n');
      for (let l = 0; l < split.length; l += 1) {
        const line = split[l];
        if (line.indexOf(searchString) !== -1) {
          const lineNumber = document.createElement('span');
          lineNumber.classList.add('lineNumber');
          lineNumber.innerHTML = `${l + 1}: `;

          const text = document.createElement('span');
          text.classList.add('text');
          text.innerHTML = line
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll(searchString, `<font class="searched">${searchString}</font>${replaceString && replaceString !== '' ? `<font class="replaceWith">${replaceString}</font>` : ''}`);

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
    }
    lastIndexDisplayed = i - 1;
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
  const res = await fetch(mdPath);
  if (res.ok) {
    const text = await res.text();

    const o = {
      path,
      content: text,
    };

    const key = res.headers.get('surrogate-key');
    if (key) {
      const split = key.substring(0, key.indexOf(' ')).split('--');
      if (split && split.length === 3) {
        [o.ref, o.repo, o.owner] = split;
      }
    }

    content.array.push(o);
    content.object[path] = o;
    console.log(o);
    return o;
  }
  console.error(`Error fetching ${mdPath}`);
  return null;
}

const BATCH_SIZE = 100;

async function search() {
  const searchString = (document.querySelector('#search input').value || '').trim();
  const replaceString = (document.querySelector('#replace input').value || '').trim();
  const pathFilter = (document.querySelector('#path').value || '').trim();
  const limit = Number.parseInt(document.querySelector('#limit').value || -1, 10);

  saveSearchParams();

  searchResults = [];
  lastIndexDisplayed = -1;

  let total = 0;
  const start = new Date().getTime();
  displayResults(total, (new Date().getTime() - start) / 1000);

  if (searchString !== '') {
    loadingON('Searching....');

    const paths = await getPaths(pathFilter, limit);
    let load = 0;
    let index = 0;
    const promises = [];
    do {
      if (load < BATCH_SIZE) {
        const path = paths[index];
        // eslint-disable-next-line no-loop-func
        promises.push(new Promise((resolve) => {
          getContent(path).then((c) => {
            total += 1;
            if (c && c.content.indexOf(searchString) !== -1) {
              searchResults.push(c);
            }
            displayResults(
              total,
              (new Date().getTime() - start) / 1000,
              searchString,
              replaceString,
            );
            resolve();
          });
        }));

        load += 1;
        index += 1;
      } else {
        load = 0;
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(promises);
      }
    } while (index < paths.length);

    await Promise.all(promises);

    displayResults(total, (new Date().getTime() - start) / 1000, searchString, replaceString);
    loadingOFF();
  }
}

async function replace() {
  if (searchResults.length > 0) {
    const searchString = (document.querySelector('#search input').value || '').trim();
    const replaceString = (document.querySelector('#replace input').value || '').trim();

    loadingON('Saving files to Sharepoint');
    await asyncForEach(searchResults, async (r) => {
      let destination = `/drafts/search/${r.path}.docx`;
      if (r.owner && r.repo && r.ref) {
        const { admin } = await getConfig();
        const res = await fetch(`${admin.api.status.baseURI}/${r.owner}/${r.repo}/${r.ref}/${r.path}`);
        if (res.ok) {
          const status = await res.json();
        }
      }
      const newMD = r.content.replaceAll(searchString, replaceString).replaceAll('https://bulk-poc--blog--adobe.hlx3.page/', 'http://localhost:3000/');
      loadingON(`Converting ${r.path} to docx`);
      const buffer = await md2word(newMD, console);
      loadingON(`Saving ${r.path}.docx to Sharepoint`);
      await saveFile(buffer, `${destination}.docx`);
      loadingON('Saved.');
    });
    loadingOFF();
  }
}

function setListeners() {
  // document.querySelector('#sync button').addEventListener('click', sync);
  // document.querySelector('#save button').addEventListener('click', save);
  document.querySelector('#search button').addEventListener('click', search);
  document.querySelector('#replace button').addEventListener('click', () => {
    loadingON('Connecting to Sharepoint');
    connect(() => {
      loadingON('Connected');
      loadingOFF();
      replace();
    });
  });
}

function saveSearchParams() {
  const searchString = (document.querySelector('#search input').value || '').trim();
  const replaceString = (document.querySelector('#replace input').value || '').trim();
  const pathFilter = (document.querySelector('#path').value || '').trim();
  const limit = Number.parseInt(document.querySelector('#limit').value || -1, 10);

  window.localStorage.setItem('bulk.search.params', JSON.stringify({
    searchString,
    replaceString,
    pathFilter,
    limit,
  }));
}

function loadSearchParams() {
  const item = window.localStorage.getItem('bulk.search.params');
  if (item) {
    const o = JSON.parse(item);
    document.querySelector('#search input').value = o.searchString;
    document.querySelector('#replace input').value = o.replaceString || '';
    document.querySelector('#path').value = o.pathFilter;
    document.querySelector('#limit').value = o.limit;
  }
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
  loadSearchParams();
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
