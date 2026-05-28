function initCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre:has(code)');

  codeBlocks.forEach((code) => {
    if (code.querySelector('.copy-cnt')) return;

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '/copy.svg#empty');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('copy-svg');
    svg.appendChild(use);

    const btn = document.createElement('button');
    btn.appendChild(svg);
    btn.classList.add('copy-btn');
    btn.addEventListener('click', (e) => copyCode(e));

    const container = document.createElement('div');
    container.classList.add('copy-cnt');
    container.appendChild(btn);

    code.classList.add('relative');
    code.appendChild(container);
  });
}

function copyCode(event) {
  let codeBlock = getChildByTagName(event.currentTarget.parentElement.parentElement, 'CODE')
  navigator.clipboard.writeText(codeBlock.innerText).catch(() => {});
  const use = getChildByTagName(getChildByTagName(event.currentTarget, 'svg'), 'use');
  use.setAttribute('href', '/copy.svg#filled')
  setTimeout(() => {
    if (use) {
      use.setAttribute('href', '/copy.svg#empty')
    }
  }, 100);
}

function getChildByTagName(element, tagName) {
  return Array.from(element.children).find((child) => child.tagName === tagName);
}

initCopyButtons();
document.addEventListener('astro:page-load', initCopyButtons);
