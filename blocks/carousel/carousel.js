import {
  createTag,
  createSVG,
} from '../block-helpers.js';

/**
 * The carousel's navigation
 * @param {element} $wrapper The container of the carousel
 */
function carouselAndLightbox($block) {
  const $wrapper = $block.querySelector('.carousel-wrapper');
  const $lightbox = $block.querySelector('.carousel-lightbox');
  const $expandButtons = $wrapper.querySelectorAll('.carousel-expand');
  const $carouselSlides = $wrapper.querySelectorAll('.carousel-slide');
  const $lightboxSlides = $lightbox.querySelectorAll('.carousel-slide');
  const $dots = $wrapper.querySelectorAll('.carousel-dot');
  const $carouselPrevious = $wrapper.querySelector('.carousel-previous');
  const $carouselNext = $wrapper.querySelector('.carousel-next');
  const $lightboxPrevious = $lightbox.querySelector('.carousel-previous');
  const $lightboxNext = $lightbox.querySelector('.carousel-next');
  const $thumbnails = $lightbox.querySelectorAll('.carousel-dot');
  const $closeLightbox = $lightbox.querySelector('.carousel-close-lightbox');
  const updateCarousel = (index) => {
    const current = $carouselSlides[index];
    const prev = $carouselSlides[index - 1] ?? $carouselSlides[[...$carouselSlides].length - 1];
    const next = $carouselSlides[index + 1] ?? $carouselSlides[0];
    $carouselSlides.forEach((slide) => {
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
  const updateLightbox = (index) => {
    const current = $lightboxSlides[index];
    const prev = $lightboxSlides[index - 1] ?? $lightboxSlides[[...$lightboxSlides].length - 1];
    const next = $lightboxSlides[index + 1] ?? $lightboxSlides[0];
    $lightboxSlides.forEach((slide) => {
      slide.classList.remove('slide-active');
      slide.classList.remove('slide-prev');
      slide.classList.remove('slide-next');
    });
    current.classList.add('slide-active');
    prev.classList.add('slide-prev');
    next.classList.add('slide-next');
    $thumbnails.forEach((otherDot) => {
      otherDot.classList.remove('dot-active');
    });
    $thumbnails[index].classList.add('dot-active');
  };
  let carouselIndex = 0;
  updateCarousel(carouselIndex);
  $carouselNext.addEventListener('click', () => {
    carouselIndex += 1;
    if (carouselIndex > [...$carouselSlides].length - 1) carouselIndex = 0;
    updateCarousel(carouselIndex);
  });
  $carouselPrevious.addEventListener('click', () => {
    carouselIndex -= 1;
    if (carouselIndex < 0) carouselIndex = [...$carouselSlides].length - 1;
    updateCarousel(carouselIndex);
  });
  [...$dots].forEach(($dot, index) => {
    $dot.addEventListener('click', () => {
      if (index !== carouselIndex) {
        carouselIndex = index;
        updateCarousel(carouselIndex);
      }
    });
  });
  $lightboxNext.addEventListener('click', () => {
    carouselIndex += 1;
    if (carouselIndex > [...$lightboxSlides].length - 1) carouselIndex = 0;
    updateLightbox(carouselIndex);
  });
  $lightboxPrevious.addEventListener('click', () => {
    carouselIndex -= 1;
    if (carouselIndex < 0) carouselIndex = [...$lightboxSlides].length - 1;
    updateLightbox(carouselIndex);
  });
  [...$thumbnails].forEach(($thumbnail, index) => {
    $thumbnail.addEventListener('click', () => {
      if (index !== carouselIndex) {
        carouselIndex = index;
        updateLightbox(carouselIndex);
      }
    });
  });
  [...$expandButtons].forEach(($btn) => {
    $btn.addEventListener('click', () => {
      updateLightbox(carouselIndex);
      $wrapper.closest('.block.carousel').classList.add('lightbox');
    });
  });
  const closeLightbox = () => {
    $wrapper.classList.add('no-animation');
    updateCarousel(carouselIndex);
    $wrapper.closest('.block.carousel').classList.remove('lightbox');
    setTimeout(() => { $wrapper.classList.remove('no-animation'); }, 300);
  };
  $closeLightbox.addEventListener('click', closeLightbox);
  $lightbox.addEventListener('click', (e) => {
    // Close lightbox when click on background=
    if ((e.target.tagName.toLowerCase() !== 'img'
    && e.target.tagName.toLowerCase() !== 'button'
    && e.target.tagName.toLowerCase() !== 'picture'
    && e.target.tagName.toLowerCase() !== 'svg'
    && e.target.tagName.toLowerCase() !== 'use'
    && e.target.tagName.toLowerCase() !== 'path')) {
      closeLightbox();
    }
  });
}

/**
 * Builds the carousel html
 * @param {NodeList} $imgs The images to fill the carousel
 * @param {element} $block The container of the carousel
 * @param {string} aspectRatio height ÷ width percentage of the carousel, ex: 50%;
 */
function buildCarousel($imgs, $block, aspectRatio) {
  $block.innerHTML = '';
  const $wrapper = createTag('div', { class: 'carousel-wrapper' });
  const $controls = createTag('div', { class: 'carousel-controls' });
  const $slides = createTag('div', { class: 'carousel-slides' });
  const $dots = createTag('div', { class: 'carousel-dots' });
  const $slideswrapper = createTag('div');
  $wrapper.appendChild($controls);
  $wrapper.appendChild($slides);
  $wrapper.appendChild($dots);
  $slides.appendChild($slideswrapper);
  $block.appendChild($wrapper);
  const $prev = createTag('button', { class: 'carousel-arrow carousel-previous', 'aria-label': 'Previous slide' });
  const $next = createTag('button', { class: 'carousel-arrow carousel-next', 'aria-label': 'Next slide' });
  $prev.appendChild(createSVG('chevron'));
  $next.appendChild(createSVG('chevron'));
  $controls.appendChild($prev);
  $controls.appendChild($next);
  [...$imgs].forEach(($img, index) => {
    const $slide = createTag('div', { class: 'carousel-slide' });
    $slide.appendChild($img);
    const $expandButton = createTag('button', { class: 'carousel-expand', 'aria-label': 'Open in full screen' });
    $expandButton.appendChild(createSVG('expand'));
    $slide.appendChild($expandButton);
    $slideswrapper.appendChild($slide);
    const $dot = createTag('button', { class: 'carousel-dot', 'aria-label': `Slide ${index + 1}` });
    $dots.appendChild($dot);
  });
  const $lightbox = $wrapper.cloneNode(true);
  $lightbox.classList.add('carousel-lightbox');
  const $closeButton = createTag('button', { class: 'carousel-close-lightbox', 'aria-label': 'Close full screen' });
  $closeButton.appendChild(createSVG('close'));
  $lightbox.appendChild($closeButton);
  $block.appendChild($lightbox);
  const $thumbnails = $lightbox.querySelectorAll('.carousel-dot');
  [...$thumbnails].forEach(($thumbnail, index) => {
    $thumbnail.appendChild($imgs[index].cloneNode(true));
  });
  if (aspectRatio) $slideswrapper.style.paddingBottom = aspectRatio;
  carouselAndLightbox($block);
}

export default function decorate($block) {
  const $imgs = $block.querySelectorAll('picture');
  // Find the aspect ratio of the shortest image:
  let aspectRatio;
  [...$imgs].forEach(($picture) => {
    const $img = $picture.querySelector('img');
    const ratio = $img.offsetHeight / $img.offsetWidth;
    if (aspectRatio === undefined || ratio < aspectRatio) aspectRatio = ratio;
  });
  // Build the carousel:
  $block.innerHTML = '';
  buildCarousel($imgs, $block, `${(aspectRatio * 100)}%`);
}
