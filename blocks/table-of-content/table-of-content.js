import createTag from '../gnav/gnav-utils.js';
  
export default function decorate(block) {
    block.insertAdjacentHTML('beforebegin', '<hr/>');
    block.insertAdjacentHTML('afterend', '<hr/>');
    const baseURL = window.location.href;
    const links = block.querySelectorAll('li');
    const gnavHeight = parseInt(window.getComputedStyle(document.querySelector('header')).height.replace('px', ''));

    for(let i = 0; i < links.length; i ++) {
        const title = links[i].innerText;
        const linkSlug = stringCleanup(title);
        let anchorElement = createTag('a', {href: `${baseURL}#${linkSlug}`});
        links[i].innerText = '';
        links[i].append(anchorElement);
        anchorElement.innerText = title;

        if (title === 'Introduction') {
            const targetNode = block.parentElement.parentElement.previousSibling;
            generateLink(links[i], targetNode, gnavHeight);
        } else {
            const targetNode = document.getElementById(linkSlug);
            generateLink(links[i], targetNode, gnavHeight);
        }
    }
}

function stringCleanup(string) {
    return string.toLowerCase().replace(/[^a-zA-Z0-9]+/g, ' ').trim().replaceAll(' ', '-');
}

function generateLink(link, targetNode, height) {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetOffset = targetNode.offsetTop - height - 24;
        window.scrollTo({
            top: targetOffset,
            left: 0,
            behavior: 'smooth'
        });
    })
}
