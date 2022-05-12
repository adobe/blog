import {
  createTag,
} from '../block-helpers.js';

function decorateRow($row) {
  const $columns = Array.from($row.children);
  const $image = $columns[0].querySelector('img');
  const link = $columns[0].querySelector('a').href;
  const $icon = createTag('img', { src: '/blocks/toolkit/link-icon.svg' });
  const $link = createTag('a', { href: link, target: '_blank' });

  $row.classList.add('row');

  $columns[0].innerHTML = '';
  $columns[0].append($image);
  $columns[0].classList.add('row-image');
  $columns[1].classList.add('row-content');

  const $cta = $columns[1].querySelector('a');

  if ($cta) {
    $cta.classList.add('button', 'small');
    $cta.target = '_blank';
  } else {
    $columns[1].querySelector('h2').append($icon);
    $row.parentElement.append($link);
    $link.append($row);
  }
}

function decorateCTARow($row) {
  $row.classList.add('ctas');
  const $links = $row.querySelectorAll('a');

  if ($links[0]) {
    $links[0].classList.add('button', 'small', 'light');
  }

  if ($links[1]) {
    $links[1].classList.add('button', 'small');
  }
}

export default function decorate($block) {
  const $rows = Array.from($block.children);
  let $container;

  $rows.forEach(($row) => {
    const $columns = Array.from($row.children);

    if ($columns.length === 2) {
      if (!$container) {
        $container = createTag('div', { class: 'container' });
        $block.append($container);
      }

      $container.append($row);

      if ($columns[0].innerHTML) {
        decorateRow($row);
      } else {
        decorateCTARow($row);
      }
    } else {
      $row.classList.add('column');
      $block.append($row);
    }
  });
}
