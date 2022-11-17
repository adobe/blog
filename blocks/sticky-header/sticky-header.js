export default function decorate($block) {
  const $header = document.querySelector('header');
  $header.parentNode.insertBefore($block, $header.nextSibling);

  const $a = $block.querySelector('a');
  $a.classList.add('button');
  $a.target = '_blank';
}
