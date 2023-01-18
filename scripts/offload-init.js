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

import { getHelixEnv, getTags } from './scripts.js';

function checkDX(tag) {
  const dxtags = [
    'Experience Cloud', 'Experience Manager', 'Magento Commerce', 'Marketo Engage', 'Target', 'Commerce Cloud', 'Campaign', 'Audience Manager, Analytics, Advertising Cloud',
    'Travel & Hospitality', 'Media & Entertainment', 'Financial Services', 'Government', 'Non-profits', 'Other', 'Healthcare', 'High Tech', 'Retail', 'Telecom', 'Manufacturing', 'Education',
    'B2B', 'Social', 'Personalization', 'Campaign Management', 'Content Management', 'Email Marketing', 'Commerce', 'Analytics', 'Advertising', 'Digital Transformation',
  ];
  return dxtags.includes(tag);
}

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
