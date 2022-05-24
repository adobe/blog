import { createTag } from '../block-helpers.js';

function stringCleanup(string) {
  return string.toLowerCase().replace(/[^a-zA-Z0-9]+/g, ' ').trim().replaceAll(' ', '-');
}

export default function decorate($block) {
  const url = new URL(window.location.href);
  const baseUrl = url.origin + url.pathname;
  const $list = createTag('ol', { }, null);
  const $content = $block.querySelector('ul');

  Array.from($content.children).forEach(($tab) => {
    const title = $tab.textContent;
    const id = stringCleanup(title);
    const href = `${baseUrl}#${id}`;
    const $anchor = createTag('a', { href }, null);
    let target;

    $tab.innerHTML = '';
    $tab.append($anchor);
    $anchor.textContent = title;
    $list.append($tab);

    if (title === 'Introduction') {
      target = $block.parentElement.parentElement.previousSibling;
      target.id = id;
    } else {
      target = document.getElementById(id);
    }

    target.classList.add('--with-scroll-margin-top');
  });

  $content.after($list);
  $content.remove();
}
