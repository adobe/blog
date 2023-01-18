/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { getHelixEnv, getTags } from './lib.js';

const SCRIPT_TYPE_PARTYTOWN = 'text/partytown';

const createScriptElement = (src, type, attributes = {}) => {
  const script = document.createElement('script');
  script.src = src;
  if (type) {
    script.type = type;
  }
  document.head.appendChild(script);

  Object.keys(attributes).forEach((key) => {
    script.setAttribute(key, attributes[key]);
  });

  return script;
};

const checkDX = (tag) => {
  const dxtags = [
    'Experience Cloud', 'Experience Manager', 'Magento Commerce', 'Marketo Engage', 'Target', 'Commerce Cloud', 'Campaign', 'Audience Manager, Analytics, Advertising Cloud',
    'Travel & Hospitality', 'Media & Entertainment', 'Financial Services', 'Government', 'Non-profits', 'Other', 'Healthcare', 'High Tech', 'Retail', 'Telecom', 'Manufacturing', 'Education',
    'B2B', 'Social', 'Personalization', 'Campaign Management', 'Content Management', 'Email Marketing', 'Commerce', 'Analytics', 'Advertising', 'Digital Transformation',
  ];
  return dxtags.includes(tag);
};

const configure = () => {
  const { target, name } = getHelixEnv();

  let isDX = false;
  const tags = getTags();
  tags.forEach((tag) => {
    if (checkDX(tag)) {
      isDX = true;
    }
  });

  let accounts = '';
  if (isDX) {
    if (name === 'prod') {
      accounts = 'adbadobedxprod';
    } else if (name === 'stage') {
      accounts = 'adbadobedxqa';
    }
  }

  window.marketingtech = window.marketingtech || {};
  window.marketingtech.adobe = {
    target,
    audienceManager: true,
    launch: {
      property: 'global',
      environment: 'production',
    },
    analytics: {
      // additional report suites to send data to “,” separated  Ex: 'RS1,RS2'
      additionalAccounts: accounts,
    },
  };
  window.targetGlobalSettings = window.targetGlobalSettings || {};
  window.targetGlobalSettings.bodyHidingEnabled = false;
};

/**
 * Initializes partytown and creates the necessary script tags for martech tracking.
 * The partytown library is added to the <head> and partytown configured to offload
 * the relevant scripts.
 */
export default function offload() {
  configure();

  window.partytown = {
    forward: ['taxonomy', 'language'],
    lib: '/scripts/',
  };

  // general init of partytown
  import('./partytown.js');

  createScriptElement(
    '/scripts/martech.min.js',
    SCRIPT_TYPE_PARTYTOWN,
    { 'data-seed-adobelaunch': 'true' },
  );
  createScriptElement('/scripts/offload-run.js', SCRIPT_TYPE_PARTYTOWN);
}
