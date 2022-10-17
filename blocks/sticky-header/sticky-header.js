import {
  createOptimizedPicture,
} from '../../scripts/scripts.js';

export default function decorate(block) {
  const secondaryHeaderContents = document.createElement('div');
  secondaryHeaderContents.classList.add('secondary-header-contents');
  block.querySelectorAll('a').forEach(async (a) => {
    if (a && a.href) {
      // content wrapper
      const secondaryHeaderContent = document.createElement('div');
      secondaryHeaderContent.classList.add('content-wrapper');

      // get response from the URL
      const { pathname } = new URL(a);
      const path = pathname?.replace(/\.html$/, '');
      if (path) {
        const response = await fetch(`${path}.plain.html`);
        if (response.ok) {
          const responseEl = document.createElement('div');
          responseEl.innerHTML = await response.text();
          block.classList.add('is-loaded');

          // creating secondary header image and text div.
          const secondaryHeaderImage = document.createElement('img');
          const secondaryHeaderTextBold = document.createElement('p');
          const secondaryHeaderText = document.createElement('p');
          const secondaryHeaderCta = document.createElement('a');
          secondaryHeaderImage.classList.add('secondary-header-image');
          secondaryHeaderTextBold.classList.add('secondary-header-text-bold');
          secondaryHeaderText.classList.add('secondary-header-text');
          secondaryHeaderCta.classList.add('secondary-header-cta');

          // secondary header image content
          const img = responseEl.querySelector('img');
          const picture = img.closest('picture');
          const newPicture = createOptimizedPicture(img.src, img.alt);
          if (picture) {
            picture.parentElement.replaceChild(newPicture, picture);
            secondaryHeaderImage.append(newPicture);
          }

          // secondary header text content
          const bold = responseEl.querySelector('p');
          bold.classList.add('bold-text');
          secondaryHeaderTextBold.append(responseEl);

          const text = responseEl.querySelector('p:nth-child(2)');
          text.classList.add('text');
          secondaryHeaderText.append(responseEl);

          const link = responseEl.querySelector('a');
          link.classList.add('cta-link');
          secondaryHeaderCta.append(responseEl);

          // appending DOM objects
          secondaryHeaderContent.append(secondaryHeaderImage);
          secondaryHeaderContent.append(secondaryHeaderTextBold);
          secondaryHeaderContent.append(secondaryHeaderText);
          secondaryHeaderContent.append(secondaryHeaderCta);
          secondaryHeaderContents.append(secondaryHeaderContent);
          block.innerHTML = '';
          block.append(secondaryHeaderContents);
        } else {
          block.remove();
        }
      }
    }
  });
}
