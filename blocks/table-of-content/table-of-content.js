import createTag from '../gnav/gnav-utils.js';
  
export default function decorate(block) {
    block.insertAdjacentHTML('beforebegin', '<hr/>');
    block.insertAdjacentHTML('afterend', '<hr/>');

    const url = new URL(window.location.href);
    const baseUrl = url.origin + url.pathname;
    const $tabs = block.querySelectorAll('li');
    const gnavHeight = parseInt(window.getComputedStyle(document.querySelector('header')).height.replace('px', ''));

    $tabs.forEach(($tab) => {
        const title = $tab.textContent;
        const id = stringCleanup(title);
        const href = `${baseUrl}#${id}`;
        const $anchor = createTag('a', { href });
        let target;

        $tab.innerHTML = '';
        $tab.append($anchor);
        $anchor.textContent = title;

        if (title === 'Introduction') {
            target = block.parentElement.parentElement.previousSibling;
        } else {
            target = document.getElementById(id);
        }

        $tab.addEventListener('click', (e) => {
            e.preventDefault();

            window.scrollTo({
                top: target.offsetTop - gnavHeight - 24,
                left: 0,
                behavior: 'smooth'
            });

            window.history.pushState({},'', href);
        });
    });
}

function stringCleanup(string) {
    return string.toLowerCase().replace(/[^a-zA-Z0-9]+/g, ' ').trim().replaceAll(' ', '-');
}
