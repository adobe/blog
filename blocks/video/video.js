export default function decorate(block) {
  if (block.classList.contains('is-loaded')) {
    return;
  }
  const poster = block.querySelector('img') ? `poster="${block.querySelector('img').src}"` : '';
  const a = block.querySelector('a');

  const href = a.getAttribute('href');
  const url = new URL(href);
  const { hostname } = url;
  let { pathname } = url;

  if (hostname.includes('hlx.blob.core')) {
    // transform links from blob
    const helixId = pathname.split('/')[2];
    const type = href.includes('.mp4') ? 'mp4' : 'gif';
    pathname = `/media_${helixId}.${type}`;
  }

  const video = document.createElement('div');
  video.classList.add('video-wrapper');
  video.innerHTML = `<video controls preload="none" ${poster}>
    <source src=".${pathname}" type="video/mp4">
  </video>`;
  block.innerHTML = '<figure class="figure"></figure>';
  block.firstChild.prepend(video);

  const figcaption = block.querySelector('figcaption');
  if (figcaption) {
    // figcaption may have been added by caption block.
    // move it into picture tag
    const figure = block.querySelector('figure');
    figure.append(figcaption);
  }

  block.classList.add('is-loaded');
}
