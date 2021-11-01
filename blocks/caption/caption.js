export default function decorate(block) {
  const em = block.querySelector('em');
  if (em) {
    const previous = block.previousElementSibling;
    if (previous) {
      const figcaption = document.createElement('figcaption');
      const p = document.createElement('p');
      p.classList.add('caption');
      figcaption.append(p);
      p.append(em);

      const figure = previous.querySelector('figure');
      if (figure) {
        // if figure, append it
        figure.append(figcaption);
      } else {
        // otherwise, append to block
        // -> previous block has to deal with figcaption
        previous.append(figcaption);
      }
    }
  }

  block.remove();
}
