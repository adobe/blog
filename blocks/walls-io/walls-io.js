/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

function injectScript(placeholderScript, block) {
    const script = document.createElement('script');
    if (placeholderScript.dataset) {
        const dataset = { ...placeholderScript.dataset };
        for (const [key, value] of Object.entries(dataset)) {
            script.dataset[key] = value.toString();
        }
    }

    if (placeholderScript.src) {
        script.src = placeholderScript.src;
    }

    if (placeholderScript.async) {
        script.async = placeholderScript.async;
    }

    block.append(script);
}

export default function decorate($block) {
    const scriptHolder = document.createElement('div');
    scriptHolder.innerHTML = $block.textContent;

    const javascriptVersion = scriptHolder.querySelector('script');
    const iframeVersion = scriptHolder.querySelector('iframe');
    if (javascriptVersion) {
        $block.innerHTML = '';
        injectScript(javascriptVersion, $block);
    } else if (iframeVersion) {
        $block.innerHTML = $block.textContent;
    }
    scriptHolder.remove();
}
