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

const BULKOPERATIONS_CONFIG = '/en/drafts/alex/bulkoperationsconfig.json';

let config;

async function getConfig() {
  if (!config) {
    const res = await fetch(BULKOPERATIONS_CONFIG);
    if (!res.ok) {
      throw new Error('Config not found!');
    }

    const json = await res.json();
    const sp = json.sp.data[0];
    // reshape object for easy access
    config = {
      sp,
    };

    const graphURL = 'https://graph.microsoft.com/v1.0';

    config.sp = {
      ...config.sp,
      clientApp: {
        auth: {
          clientId: config.sp.clientId,
          authority: config.sp.authority,
        },
      },
      login: {
        redirectUri: '/tools/bulk/spauth.html',
      },
      api: {
        url: graphURL,
        file: {
          get: {
            baseURI: `${config.sp.site}/drive/root:${config.sp.rootFolders}`,
          },
          download: {
            baseURI: `${config.sp.site}/drive/items`,
          },
          upload: {
            baseURI: `${config.sp.site}/drive/root:${config.sp.rootFolders}`,
            method: 'PUT',
          },
          createUploadSession: {
            baseURI: `${config.sp.site}/drive/root:${config.sp.rootFolders}`,
            method: 'POST',
            payload: {
              '@microsoft.graph.conflictBehavior': 'replace',
            },
          },
        },
        directory: {
          create: {
            baseURI: `${config.sp.site}/drive/root:${config.sp.rootFolders}`,
            method: 'PATCH',
            payload: {
              folder: {},
            },
          },
        },
        batch: {
          uri: `${graphURL}/$batch`,
        },
      },
    };

    const adminServerURL = 'https://admin.hlx3.page';
    config.admin = {
      api: {
        preview: {
          baseURI: `${adminServerURL}/preview`,
        },
      },
    };
  }

  return config;
}

export {
  // eslint-disable-next-line import/prefer-default-export
  getConfig,
};
