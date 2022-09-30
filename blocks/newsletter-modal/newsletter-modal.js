import { createTag } from '../block-helpers.js';

function displayConfirmation($container, $content, message) {
  const $confirmationText = createTag('p', { class: 'newsletter-modal-confirmation' });
  const $confirmationClose = createTag('button', { class: 'newsletter-modal-confirmation-close' });

  $confirmationText.textContent = message;
  $confirmationClose.textContent = 'Close';
  $content.innerHTML = '';

  $content.append($confirmationText);
  $content.append($confirmationClose);

  $confirmationClose.addEventListener('click', (e) => {
    e.preventDefault();
    $container.classList.remove('active');
  });
}

export default async function decorate(block) {
  const $container = block.closest('.newsletter-modal-container');
  const $bannerContainer = createTag('div', { class: 'newsletter-modal-banner-container' });
  const $content = createTag('div', { class: 'newsletter-modal-content' });
  const $banner = createTag('img', { class: 'newsletter-modal-banner', src: '/blocks/newsletter-modal/newsletter-banner.png' });
  const $close = createTag('a', { class: 'newsletter-modal-close' });
  const $closeIcon = createTag('img', { class: 'newsletter-modal-close-icon', src: '/blocks/newsletter-modal/close.svg' });
  const $text = createTag('p', { class: 'newsletter-modal-text' });
  const $form = createTag('form', { class: 'newsletter-modal-form' });
  const $emailLabel = createTag('label', { class: 'newsletter-modal-email-label', for: 'newsletter_email' });
  const $emailText = createTag('span', { class: 'newsletter-modal-email-text', id: 'newsletter_email' });
  const $email = createTag('input', { type: 'email', class: 'newsletter-modal-email', required: 'required' });
  const $cta = createTag('input', { type: 'submit', class: 'newsletter-modal-cta' });
  const $disclaimer = createTag('p', { class: 'newsletter-modal-disclaimer' });

  $close.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.remove('newsletter-no-scroll');
    $container.classList.remove('active');
  });

  $container.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.remove('newsletter-no-scroll');
    $container.classList.remove('active');
  });

  block.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  $bannerContainer.append($banner);
  $bannerContainer.append($close);
  $close.append($closeIcon);
  block.append($bannerContainer);

  $text.innerText = 'Let’s connect. Get the most popular Adobe Blog articles in your inbox every week.';
  $content.append($text);

  $disclaimer.innerHTML = 'The Adobe family of companies may keep me informed with personalized emails from the Adobe Blog team. See our <a href="https://adobe.com/privacy" target="_blank" rel="noopener">Privacy Policy</a> for more details or to opt-out at any time.';
  $content.append($disclaimer);

  $emailText.innerText = 'Email *';
  $emailLabel.append($emailText);
  $email.placeholder = 'Enter your email';
  $emailLabel.append($email);
  $form.append($emailLabel);

  $cta.value = 'Submit';

  $cta.addEventListener('click', (e) => {
    e.preventDefault();
    const email = $email.value;

    if (email && $email.checkValidity()) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const body = {
        sname: 'adbeblog',
        email,
        consent_notice: '<div class="disclaimer detail-spectrum-m" style="letter-spacing: 0px; padding-top: 15px;">The Adobe family of companies may keep me informed with personalized emails from the Adobe Blog team. See our <a href="https://www.adobe.com/privacy/policy.html" target="_blank">Privacy Policy</a> for more details or to opt-out at any time.</div>',
        current_url: window.location.href,
      };

      const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };

      fetch('https://www.adobe.com/api2/subscribe_v1', requestOptions)
        .then(() => {
          displayConfirmation($container, $content, 'Thank you for subscribing to the Adobe Blog Newsletter.');
        })
        .catch(() => {
          displayConfirmation($container, $content, 'An error occurred during subscription. Please refresh the page and try again.');
        });
    } else {
      $email.classList.add('error');
      $email.reportValidity();
    }
  });

  $form.append($cta);
  $content.append($form);
  block.append($content);
}
