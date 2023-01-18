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

/**
 * Initializes partytown and creates the necessary script tags for martech tracking.
 * The partytown library is added to the <head> and partytown configured to offload
 * the relevant scripts.
 */
export default function offload() {
  window.partytown = {
    lib: '/scripts/',
  };

  // general init of partytown
  import('./partytown.js');

  createScriptElement('/scripts/offload-init.js', SCRIPT_TYPE_PARTYTOWN);
  createScriptElement(
    '/scripts/martech.min.js',
    SCRIPT_TYPE_PARTYTOWN,
    { 'data-seed-adobelaunch': 'true' },
  );
  createScriptElement('/scripts/offload-run.js', SCRIPT_TYPE_PARTYTOWN);
}
