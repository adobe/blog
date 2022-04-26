/**
 * Replace element type. ex) <p> -> <div>
 * @param {Element} el The original element that subject to replace.
 * @param {string} type The nodeName to be set for el.
 * @returns newEl Updated Element
 */
export const replaceElementType = (el, type) => {
  // If they are same, no need to replace.
  if (el === null || el.nodeName === type.toUpperCase()) {
    return el;
  }
  const newEl = document.createElement(type);
  newEl.innerHTML = el.innerHTML;
  el.parentNode.replaceChild(newEl, el);
  // copy all attributes from el to newEl
  [...el.attributes].forEach((attr) => newEl.setAttribute(attr.nodeName, attr.nodeValue));
  return newEl;
};

/**
 * Create element with attributes
 * @param {string} name The tag of the element, ex) <div>
 * @param {object} attrs The attributes to add to the element, ex) {class: 'class-name'}
 * @returns el Created Element
 */
export function createTag(name, attrs) {
  const el = document.createElement(name);
  if (typeof attrs === 'object') {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

/**
 * Creates an SVG tag using the specified ID.
 * @param {string} id The ID
 * @returns {element} The SVG tag
 */
export function createSVG(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/icons/icons.svg#${id}`);
  svg.appendChild(use);
  return svg;
}
