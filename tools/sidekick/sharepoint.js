import { PublicClientApplication } from './msal-browser-2.14.2.js';

const graphURL = 'https://graph.microsoft.com/v1.0';
const baseURI = 'https://graph.microsoft.com/v1.0/sites/adobe.sharepoint.com,7be4993e-8502-4600-834d-2eac96f9558e,1f8af71f-8465-4c46-8185-b0a6ce9b3c85/drive/root:/theblog';

let connectAttempts = 0;
let accessToken;

const sp = {
  clientApp: {
    auth: {
      clientId: 'f4bd8221-936d-4fd8-949a-8c14864bf16a',
      authority: 'https://login.microsoftonline.com/fa7b1b5a-7b34-4387-94ae-d2c178decee1',
    },
  },
  login: {
    redirectUri: '/tools/sidekick/spauth.htm',
  },
  api: {
    url: graphURL,
    file: {
      get: {
        baseURI,
      },
      download: {
        baseURI,
      },
      upload: {
        baseURI,
        method: 'PUT',
      },
      createUploadSession: {
        baseURI,
        method: 'POST',
        payload: {
          '@microsoft.graph.conflictBehavior': 'replace',
        },
      },
    },
    directory: {
      create: {
        baseURI,
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

export async function connect(callback) {
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
        connectAttempts += 1;
        if (connectAttempts === 1) {
          // Retry to connect once
          connect(callback);
        }
        // Give up
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

export async function saveFile(file, dest) {
  validateConnnection();

  const folder = dest.substring(0, dest.lastIndexOf('/'));
  const filename = dest.split('/').pop().split('/').pop();

  await createFolder(folder);

  // start upload session

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

export async function test() {
  validateConnnection();

  const options = getRequestOption();
  options.headers.append('Accept', 'application/json');
  options.headers.append('Content-Type', 'application/json');
  options.method = 'GET';
  // options.body = JSON.stringify(payload);

  await fetch(`${sp.api.file.createUploadSession.baseURI}`, options);
  throw new Error('Could not upload file');
}
