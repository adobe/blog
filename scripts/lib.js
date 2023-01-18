/**
 * Get the current Helix environment
 * @returns {Object} the env object
 */
export function getHelixEnv() {
  let envName = sessionStorage.getItem('helix-env');
  if (!envName) envName = 'prod';
  const envs = {
    dev: {
      ims: 'stg1',
      subdomain: 'dev02.',
      adobeIO: 'cc-collab-stage.adobe.io',
      adminconsole: 'stage.adminconsole.adobe.com',
      account: 'stage.account.adobe.com',
      target: false,
    },
    stage: {
      ims: 'stg1',
      subdomain: 'stage.',
      adobeIO: 'cc-collab-stage.adobe.io',
      adminconsole: 'stage.adminconsole.adobe.com',
      account: 'stage.account.adobe.com',
      target: false,
    },
    prod: {
      ims: 'prod',
      subdomain: '',
      adobeIO: 'cc-collab.adobe.io',
      adminconsole: 'adminconsole.adobe.com',
      account: 'account.adobe.com',
      target: true,
    },
  };
  const env = envs[envName];

  const overrideItem = sessionStorage.getItem('helix-env-overrides');
  if (overrideItem) {
    const overrides = JSON.parse(overrideItem);
    const keys = Object.keys(overrides);
    env.overrides = keys;

    keys.forEach((value) => {
      env[value] = overrides[value];
    });
  }

  if (env) {
    env.name = envName;
  }
  return env;
}

export const LANG = {
  EN: 'en',
  DE: 'de',
  FR: 'fr',
  KO: 'ko',
  ES: 'es',
  IT: 'it',
  JP: 'jp',
  BR: 'br',
};

export const LANG_LOCALE = {
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  ko: 'ko_KR',
  es: 'es_ES',
  it: 'it_IT',
  jp: 'ja_JP',
  br: 'pt_BR',
};

let language;

export function getLanguage() {
  if (language) return language;
  language = LANG.EN;
  const segs = window.location.pathname.split('/');
  if (segs && segs.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, value] of Object.entries(LANG)) {
      if (value === segs[1]) {
        language = value;
        break;
      }
    }
  }
  window.language = language;
  return language;
}

/**
 * Retrieves the content of a metadata tag. Multivalued metadata are returned
 * as a comma-separated list (or as an array of string if asArray is true).
 * @param {string} name The metadata name (or property)
 * @param {boolean} asArray Return an array instead of a comma-separated string
 * @returns {string|Array} The metadata value
 */
export function getMetadata(name, asArray = false) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((el) => el.content);

  return asArray ? meta : meta.join(', ');
}

export function getTags() {
  return getMetadata('article:tag', true);
}
