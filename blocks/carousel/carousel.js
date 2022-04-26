import {
  createTag,
  createSVG,
} from '../block-helpers.js';

function carouselFunctionality($block) {
  const prevBTN = $block.querySelector('.carousel-previous');
  const nextBTN = $block.querySelector('.carousel-next');
  const $slides = $block.querySelectorAll('.carousel-slide');
  const $dots = $block.querySelectorAll('.carousel-dot');
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

function buildCarousel($imgs, $block, height = null) {
  $block.innerHTML = '';
  const $wrapper = createTag('div', { class: 'carousel-wrapper' });
  const $slides = createTag('div', { class: 'carousel-slides' });
  const $controls = createTag('div', { class: 'carousel-controls' });
  $wrapper.appendChild($controls);
  $wrapper.appendChild($slides);
  const $slideswrapper = createTag('div');
  $slides.appendChild($slideswrapper);
  $block.appendChild($wrapper);
  if (height) {
    $slides.style.height = `${height}px`;
    $wrapper.style.height = `${height + 24}px`;
  }
  const $dots = createTag('div', { class: 'carousel-dots' });
  const $prev = createTag('button', { class: 'carousel-arrow carousel-previous', 'aria-label': 'Previous slide' });
  const $next = createTag('button', { class: 'carousel-arrow carousel-next', 'aria-label': 'Next slide' });
  $prev.appendChild(createSVG('chevron'));
  $next.appendChild(createSVG('chevron'));
  $controls.appendChild($prev);
  $controls.appendChild($next);
  $controls.appendChild($dots);

  [...$imgs].forEach(($img, index) => {
    const $slide = createTag('div', { class: `carousel-slide carousel-slide-${index + 1}` });
    $slide.appendChild($img);
    $slideswrapper.appendChild($slide);
    const $dot = createTag('button', { class: `carousel-dot carousel-dot-${index + 1}`, 'aria-label': `Slide ${index + 1}` });
    $dots.appendChild($dot);
  });

  carouselFunctionality($block);
}

export default function decorate($block) {
  const $imgs = $block.querySelectorAll('img');
  const heights = [];
  [...$imgs].forEach(($img) => {
    heights.push($img.offsetHeight);
  });
  $block.innerHTML = '';
  buildCarousel($imgs, $block, Math.min(...heights));
}
