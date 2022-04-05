import createTag from '../gnav/gnav-utils.js';
  
export default function decorate(block) {
    block.insertAdjacentHTML('beforebegin', '<hr/>');
    block.insertAdjacentHTML('afterend', '<hr/>');
    const links = block.querySelectorAll('li');
    const gnavHeight = parseInt(window.getComputedStyle(document.querySelector('header')).height.replace('px', ''));

    for(let i = 0; i < links.length; i ++) {
        const title = links[i].innerText;
        const linkSlug = stringCleanup(title);
        let anchorElement = createTag('a', {href: `${window.location.href}#${linkSlug}`});
        links[i].innerText = '';
        links[i].append(anchorElement);
        anchorElement.innerText = title;

        if (title === 'Introduction') {
            const targetNode = block.parentElement.parentElement.previousSibling;
            generateLink(links, links[i], targetNode, gnavHeight);
        } else {
            const targetNode = document.getElementById(linkSlug);
            generateLink(links, links[i], targetNode, gnavHeight);
        }
    }
}

function stringCleanup(string) {
    return string.toLowerCase().replace(/[^a-zA-Z0-9]+/g, ' ').trim().replaceAll(' ', '-');
}

function generateLink(links, link, targetNode, height) {
    link.addEventListener('click', () => {
        const targetOffset = targetNode.offsetTop - height - 24;
        window.scrollTo({
            top: targetOffset,
            left: 0,
            behavior: 'smooth'
        });
    })
}
