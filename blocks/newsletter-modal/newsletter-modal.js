/* eslint-disable import/named, import/extensions */

import {
} from '../../scripts/scripts.js';
import createTag from '../gnav/gnav-utils.js';

export default async function decorate(block) {
    const $container = block.closest('.newsletter-modal-container');
    const $bannerContainer = createTag('div', { class: 'newsletter-modal-banner-container' });
    const $banner = createTag('img', { class: 'newsletter-modal-banner', src: '/blocks/newsletter-modal/banner-header.svg' });
    const $close = createTag('a', { class: 'newsletter-modal-close' });
    const $closeIcon = createTag('img', { class: 'newsletter-modal-close-icon', src: '/blocks/newsletter-modal/close.svg' });
    const $text = createTag('p', { class: 'newsletter-modal-text' });
    const $emailLabel = createTag('label', { class: 'newsletter-modal-email-label', for: 'newsletter_email' });
    const $emailText = createTag('span', { class: 'newsletter-modal-email-text' });
    const $email = createTag('input', { type: 'email', class: 'newsletter-modal-email', required: 'required'});
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

    $cta.addEventListener('click', (e) => {
        e.preventDefault();
        const email = $email.value;

        if (email && $email.checkValidity()) {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');

            const body = {
                sname: 'adbeblog',
                email,
                consent_notice: '<div class="disclaimer detail-spectrum-m" style="letter-spacing: 0px; padding-top: 15px;">The Adobe family of companies may keep me informed with personalized Adobe Blog newsletters. See our <a href="https://www.adobe.com/privacy/policy.html" target="_blank">Privacy Policy</a> for more details or to opt-out at any time.</div>',
                current_url: window.location.href,
            };

            const requestOptions = {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            };

            fetch('https://www.adobe.com/api2/subscribe_v1', requestOptions)
                .then(() => {
                    // $formHeading.textContent = 'Thanks for signing up!';
                    // $formHeading.classList.add('success');
                    // $formHeading.classList.remove('error');
                    $email.classList.remove('error');
                    $email.value = '';
                })
                .catch(() => {
                    // $formHeading.textContent = 'An error occurred during subscription';
                    // $formHeading.classList.add('error');
                });
        } else {
            $email.classList.add('error');
            $email.reportValidity();
        }
    });

    block.append($cta);

    $disclaimer.innerHTML = `The Adobe family of companies may keep me informed with personalized Adobe Blog newsletters. See our <a href='https://adobe.com/privacy' target='_blank' rel='noopener'>Privacy Policy</a> for more details or to opt-out at any time.`;
    block.append($disclaimer);
}
