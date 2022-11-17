import { createTag } from '../block-helpers.js';

export default function decorate($block) {
  const $header = document.querySelector('header');
  const $stickyHeader = document.querySelector('.sticky-header.block')
  const $stickyHeaderContents = document.querySelector('.sticky-header div')

  $header.parentNode.insertBefore($block, $header.nextSibling);

  const $a = $block.querySelector('a');
  $a.classList.add('button');
  $a.target = '_blank';

  // Should these go at the top?
  const $close = createTag('a', { class: 'sticky-header-close' });
  const $closeIcon = createTag('img', { class: 'newsletter-modal-close-icon', src: '/blocks/sticky-header/close.svg' });

  $close.addEventListener('click', (e) => {
    $stickyHeader.remove()
  })

  $stickyHeaderContents.append($close)
  $close.append($closeIcon)
}
