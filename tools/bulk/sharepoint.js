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
import { getConfig } from './config.js';
import { PublicClientApplication } from './lib/msal-browser-2.14.2.js';

let accessToken;

async function connect(callback) {
  const { sp } = (await getConfig());

  const publicClientApplication = new PublicClientApplication(sp.clientApp);

  await publicClientApplication.loginPopup(sp.login);

  const account = publicClientApplication.getAllAccounts()[0];

  const accessTokenRequest = {
    scopes: ['files.readwrite', 'sites.readwrite.all'],
    account,
  };

  try {
    const res = await publicClientApplication.acquireTokenSilent(accessTokenRequest);
    accessToken = res.accessToken;
    if (callback) await callback();
  } catch (error) {
    // Acquire token silent failure, and send an interactive request
    if (error.name === 'InteractionRequiredAuthError') {
      try {
        const res = await publicClientApplication.acquireTokenPopup(accessTokenRequest);
        // Acquire token interactive success
        accessToken = res.accessToken;
        if (callback) await callback();
      } catch (err) {
        throw new Error(`Cannot connect to Sharepoint: ${err.message}`);
      }
    }
  }
}

function validateConnnection() {
  if (!accessToken) {
    throw new Error('You need to sign-in first');
  }
}

function getRequestOption() {
  validateConnnection();

  const bearer = `Bearer ${accessToken}`;
  const headers = new Headers();
  headers.append('Authorization', bearer);

  return {
    method: 'GET',
    headers,
  };
}

async function createFolder(folder) {
  validateConnnection();

  const { sp } = await getConfig();

  const options = getRequestOption();
  options.headers.append('Accept', 'application/json');
  options.headers.append('Content-Type', 'application/json');
  options.method = sp.api.directory.create.method;
  options.body = JSON.stringify(sp.api.directory.create.payload);

  const res = await fetch(`${sp.api.directory.create.baseURI}${folder}`, options);
  if (res.ok) {
    return res.json();
  }
  throw new Error(`Could not create folder: ${folder}`);
}

async function saveFile(file, dest) {
  validateConnnection();

  const folder = dest.substring(0, dest.lastIndexOf('/'));
  const filename = dest.split('/').pop().split('/').pop();

  await createFolder(folder);

  // start upload session

  const { sp } = await getConfig();

  const payload = {
    ...sp.api.file.createUploadSession.payload,
    description: 'Preview file',
    fileSize: file.size,
    name: filename,
  };

  let options = getRequestOption();
  options.headers.append('Accept', 'application/json');
  options.headers.append('Content-Type', 'application/json');
  options.method = sp.api.file.createUploadSession.method;
  options.body = JSON.stringify(payload);

  let res = await fetch(`${sp.api.file.createUploadSession.baseURI}${dest}:/createUploadSession`, options);
  if (res.ok) {
    const json = await res.json();

    options = getRequestOption();
    // TODO API is limited to 60Mb, for more, we need to batch the upload.
    options.headers.append('Content-Length', file.size);
    options.headers.append('Content-Range', `bytes 0-${file.size - 1}/${file.size}`);
    options.method = sp.api.file.upload.method;
    options.body = file;

    res = await fetch(`${json.uploadUrl}`, options);
    if (res.ok) {
      return res.json();
    }
  }
  throw new Error(`Could not upload file ${dest}`);
}

export {
  saveFile,
  connect,
};
