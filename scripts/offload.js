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

const createScriptElement = (src, type) => {
  const script = document.createElement('script');
  script.src = src;
  if (type) {
    script.type = type;
  }
  document.head.appendChild(script);

  return script;
};

/**
 * Checks whether alloy or other 3rd party scripts should be offloaded via partytown.
 * If so, initializes partytown and creates the necessary script tags for alloy/3rd party scripts.
 *
 * Checks for two conditions:
 * - Is alloy enabled via window.hlx.alloy.enable = true?
 * - Are any scripts configured to be offloaded via party-town
 *   by adding to window.hlx.offload.scripts?
 *
 * If either is true, the partytown library is added to the <head>
 * and partytown configured to offload the relevant scripts.
 */
export default function offload() {
  window.hlx.offload = window.hlx.offload || {};

  const { offload: config, alloy } = window.hlx;

  const hasScripts = Array.isArray(config.scripts) && config.scripts.length > 0;

  // neither alloy nor 3rd party scripts are requested to be offloaded -> exit
  if (!alloy.enable && !hasScripts) {
    return;
  }

  // if alloy is enabled, configure partytown with the window.* forwards
  // required by alloy. this needs to happen before partytown initialization
  if (alloy.enable) {
    window.hlx.offload.forward = window.hlx.offload.forward.concat([
      '__alloyMonitors',
      '__alloyNS',
      'alloy',
      'alloy_all',
      'alloy_click',
      'alloy_last_event',
      'alloy_load',
      'alloy_unload',
      'adobe',
    ]);
  }

  window.partytown = {
    lib: '/scripts/',
    forward: window.hlx.offload.forward || [],
  };

  // general init of partytown
  import('./partytown.js');

  // if alloy is enabled, add the scripts required by alloy
  // to the offloading
  if (alloy.enable) {
    createScriptElement('/scripts/alloy-init.js', SCRIPT_TYPE_PARTYTOWN);
    createScriptElement('/scripts/alloy.min.js', SCRIPT_TYPE_PARTYTOWN);
    createScriptElement('/scripts/alloy-config.js', SCRIPT_TYPE_PARTYTOWN);
  }

  // add any additional 3rd party scripts to be offloaded
  if (hasScripts) {
    config.scripts.forEach((script) => {
      createScriptElement(script, SCRIPT_TYPE_PARTYTOWN);
    });
  }
}
