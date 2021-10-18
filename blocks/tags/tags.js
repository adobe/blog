export default function decorateTags(blockEl) {
  const tags = blockEl.querySelectorAll('a');
  const container = blockEl.querySelector('p');
  container.classList.add('tags-container');
  container.textContent = '';
  tags.forEach((tag) => {
    tag.classList.add('button');
    container.append(tag);
  });
}
