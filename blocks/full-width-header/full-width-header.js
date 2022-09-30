export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (picture) {
    const figure = document.querySelector('.article-feature-image .figure-feature');
    figure.innerHTML = '';
    figure.appendChild(picture);
  } else {
    block.remove();
  }
}
