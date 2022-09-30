function decorateVideoBlock($block, $a, $img) {
  if ($block.classList.contains('video-loaded')) return;
  if ($a && $a.href.startsWith('https://')) {
    const url = new URL($a.href);
    const usp = new URLSearchParams(url.search);
    let attrs = '';
    if ($a.href.startsWith('https://www.youtube.com/watch') || $a.href.startsWith('https://youtu.be/')) {
      let vid = usp.get('v');
      if (url.host === 'youtu.be') vid = url.pathname.substr(1);
      if ($block.classList.contains('autoplay')) attrs = `&amp;autoplay=1&amp;mute=1&amp;playlist=${vid}&amp;loop=1`;
      $block.innerHTML = /* html */`
        <div class="vid-wrapper">
          <iframe src="https://www.youtube.com/embed/${vid}?rel=0&amp;modestbranding=1&amp;playsinline=1&amp;autohide=1&amp;showinfo=0&amp;rel=0&amp;${attrs}" frameBorder="0" allowfullscreen="" scrolling="no" allow="encrypted-media; accelerometer; gyroscope; picture-in-picture; autoplay" title="content from youtube" loading="lazy"></iframe>
        </div>
        `;
    } else if ($a.href.endsWith('.mp4')) {
      attrs = 'playsinline controls';
      if ($block.classList.contains('autoplay')) attrs = 'playsinline controls muted autoplay loop';
      const poster = $img ? `poster="${$img.src}"` : '';
      $block.innerHTML = /* html */`
        <div class="vid-wrapper">
          <video ${attrs} ${poster} name="media"><source src="${$a.href}" type="video/mp4"></video>
        </div>
        `;
    }
    $block.classList.add('video-loaded');
  }
}

function lazyLoadVideo($block, $a, $img) {
  const lazyIntersectHandler = (entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      if (entry.intersectionRatio >= 0.25) {
        const block = entry.target;
        decorateVideoBlock(block, $a, $img);
      }
    }
  };
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: [0.0, 0.25],
  };
  const observer = new IntersectionObserver(lazyIntersectHandler, options);
  observer.observe($block);
}

export default function decorate($block) {
  const $a = $block.querySelector('a');
  let $img = $block.querySelector('img');
  $block.innerHTML = '';
  const $section = $block.closest('.section-wrapper');
  if ($section.previousElementSibling.classList.contains('article-header-container')) {
    if (!$img) $img = $section.previousElementSibling.querySelector('.article-feature-image img');
    $section.previousElementSibling.querySelector('.article-feature-image').remove();
  }
  if (document.readyState === 'complete') {
    lazyLoadVideo($block, $a, $img);
  } else {
    window.addEventListener('load', () => {
      lazyLoadVideo($block, $a, $img);
    });
  }
}
