/* eslint-disable import/named, import/extensions */

import {
} from '../../scripts/scripts.js';
import createTag from '../gnav/gnav-utils.js';

function bindNewsletterCTAs() {
    setTimeout(() => {
        const $links = document.querySelectorAll('a');

        $links.forEach(($link) => {
            if ($link.classList.contains('newsletter-modal-cta')) {
                $link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const $container = document.querySelector('.newsletter-modal-container');
                    $container.classList.add('active');
                });
            }
        });
    }, 10);
}

export default async function decorate(block) {
    const $container = block.closest('.newsletter-modal-container');
    const $bannerContainer = createTag('div', { class: 'newsletter-modal-banner-container' });
    const $banner = createTag('img', { class: 'newsletter-modal-banner', src: '/blocks/newsletter-modal/banner-header.svg' });
    const $close = createTag('a', { class: 'newsletter-modal-close' });
    const $closeIcon = createTag('img', { class: 'newsletter-modal-close-icon', src: '/blocks/newsletter-modal/close.svg' });
    const $text = createTag('p', { class: 'newsletter-modal-text' });
    const $emailLabel = createTag('label', { class: 'newsletter-modal-email-label', for: 'newsletter_email' });
    const $emailText = createTag('span', { class: 'newsletter-modal-email-text' });
    const $email = createTag('input', { type: 'text', class: 'newsletter-modal-email'});
    const $cta = createTag('input', { type: 'submit', class: 'newsletter-modal-cta'});
    const $disclaimer = createTag('p', { class: 'newsletter-modal-disclaimer' });

    $close.addEventListener('click', (e) => {
        e.preventDefault();
        $container.classList.remove('active');
    });

    $container.addEventListener('click', (e) => {
        e.preventDefault();
        $container.classList.remove('active');
    });

    block.addEventListener('click', (e) => {
        e.stopPropagation();
    })

    $bannerContainer.append($banner);
    $bannerContainer.append($close);
    $close.append($closeIcon);
    block.append($bannerContainer);

    $text.innerText = 'Sign up for the Adobe Blog Newsletter and get access to creative news, product launches, and more — delivered to your inbox weekly.';
    block.append($text);

    $emailText.innerText = 'Email *';
    $emailLabel.append($emailText);
    $email.placeholder = 'Enter your email';
    $emailLabel.append($email);
    block.append($emailLabel);

    $cta.value = 'Submit';
    block.append($cta);

    $disclaimer.innerHTML = `The Adobe family of companies may keep me informed with personalized emails about Discover content. See our <a href='https://adobe.com/privacy' target='_blank' rel='noopener'>Privacy Policy</a> for more details or to opt-out at any time.`;
    block.append($disclaimer);

    bindNewsletterCTAs();
}
