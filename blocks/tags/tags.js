import { sampleRUM } from '../../scripts/scripts.js';

export default function decorateTags(blockEl) {
  const tags = blockEl.querySelectorAll('a');
  const container = blockEl.querySelector('p');
  container.classList.add('tags-container');
  container.textContent = '';
  const target = Array.from(tags).reduce((targets, tag) => {
    tag.classList.add('button');
    container.append(tag);
    targets.push(tag.textContent);
    return targets;
  }, []).join('; ');
  sampleRUM('loadtags', { target, source: `.${blockEl.getAttribute('data-block-name')}` });
}
