import {
  createTag,
  createSVG,
} from '../block-helpers.js';

function carouselFunctionality($wrapper) {
  const prevBTN = $wrapper.querySelector('.carousel-previous');
  const nextBTN = $wrapper.querySelector('.carousel-next');
  const $slides = $wrapper.querySelectorAll('.carousel-slide');
  const $dots = $wrapper.querySelectorAll('.carousel-dot');
  let carouselIndex = 0;
  const updateCarousel = (index) => {
    const current = $slides[index];
    const prev = $slides[index - 1] ?? $slides[[...$slides].length - 1];
    const next = $slides[index + 1] ?? $slides[0];
    $slides.forEach((slide) => {
      slide.classList.remove('slide-active');
      slide.classList.remove('slide-prev');
      slide.classList.remove('slide-next');
    });
    current.classList.add('slide-active');
    prev.classList.add('slide-prev');
    next.classList.add('slide-next');
    $dots.forEach((otherDot) => {
      otherDot.classList.remove('dot-active');
    });
    $dots[index].classList.add('dot-active');
  };
  updateCarousel(carouselIndex);
  nextBTN.addEventListener('click', () => {
    carouselIndex += 1;
    if (carouselIndex > [...$slides].length - 1) carouselIndex = 0;
    updateCarousel(carouselIndex);
  });
  prevBTN.addEventListener('click', () => {
    carouselIndex -= 1;
    if (carouselIndex < 0) carouselIndex = [...$slides].length - 1;
    updateCarousel(carouselIndex);
  });
  [...$dots].forEach(($dot, index) => {
    $dot.addEventListener('click', () => {
      carouselIndex = index;
      updateCarousel(carouselIndex);
      $dots.forEach((otherDot) => {
        otherDot.classList.remove('dot-active');
      });
      $dot.classList.add('dot-active');
    });
  });
}

/**
 * Builds the carousel html
 * @param {NodeList} $imgs The images to fill the carousel
 * @param {element} $block The container/block of the carousel
 * @param {string} aspectRatio height ÷ width percentage of the carousel, ex: 50%;
 */
function buildCarousel($imgs, $block, aspectRatio) {
  $block.innerHTML = '';
  const $wrapper = createTag('div', { class: 'carousel-wrapper' });
  const $slides = createTag('div', { class: 'carousel-slides' });
  const $controls = createTag('div', { class: 'carousel-controls' });
  $wrapper.appendChild($controls);
  $wrapper.appendChild($slides);
  const $slideswrapper = createTag('div');
  $slides.appendChild($slideswrapper);
  $block.appendChild($wrapper);
  if (aspectRatio) $slideswrapper.style.paddingBottom = aspectRatio;
  const $dots = createTag('div', { class: 'carousel-dots' });
  const $prev = createTag('button', { class: 'carousel-arrow carousel-previous', 'aria-label': 'Previous slide' });
  const $next = createTag('button', { class: 'carousel-arrow carousel-next', 'aria-label': 'Next slide' });
  $prev.appendChild(createSVG('chevron'));
  $next.appendChild(createSVG('chevron'));
  $controls.appendChild($prev);
  $controls.appendChild($next);
  $controls.appendChild($dots);

  [...$imgs].forEach(($img, index) => {
    const $slide = createTag('div', { class: 'carousel-slide' });
    $slide.appendChild($img);
    $slideswrapper.appendChild($slide);
    const $dot = createTag('button', { class: 'carousel-dot', 'aria-label': `Slide ${index + 1}` });
    $dots.appendChild($dot);
  });

  carouselFunctionality($wrapper);
}

export default function decorate($block) {
  const $imgs = $block.querySelectorAll('img');
  let aspectRatio;
  // Find the aspect ratio of the shortest image:
  [...$imgs].forEach(($img) => {
    const ratio = $img.offsetHeight / $img.offsetWidth;
    if (aspectRatio === undefined || ratio < aspectRatio) {
      aspectRatio = ratio;
    }
  });
  $block.innerHTML = '';
  buildCarousel($imgs, $block, `${(aspectRatio * 100)}%`);
}
