// ==UserScript==
// @name         Blur X/Twitter username (bottom-left + profile page)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Covers your @username with a blur box in the bottom-left corner of x.com and on your profile page; hovering reveals it until the cursor leaves
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const CSS = `
    .hxn-blur {
      filter: blur(7px) !important;
      background-color: rgba(128, 128, 128, 0.30) !important;
      border-radius: 5px !important;
      padding: 0 4px !important;
      cursor: default !important;
      transition: filter 0.15s ease !important;
    }
    .hxn-blur:hover {
      filter: none !important;
    }
  `;

  function injectStyle() {
    if (document.getElementById('hxn-blur-style')) return;
    const style = document.createElement('style');
    style.id = 'hxn-blur-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  let myHandle = null;   // captured from the sidebar button

  function isMyHandleText(t) {
    return !!myHandle && t && t.toLowerCase() === ('@' + myHandle).toLowerCase();
  }

  function blurEl(el) {
    el.classList.add('hxn-blur');
  }

  // Sidebar button: blur the leaf span holding the @handle (text stays intact)
  function patchSwitcher() {
    document.querySelectorAll('[data-testid="SideNav_AccountSwitcher_Button"]').forEach((btn) => {
      btn.querySelectorAll('span').forEach((span) => {
        if (span.children.length > 0) return;
        const t = span.textContent;
        if (!t || !t.startsWith('@') || t.length < 2) return;
        if (!myHandle) myHandle = t.slice(1);
        blurEl(span);
      });
    });
  }

  // Profile page: the big handle under the display name is a leaf <span> in
  // <main> with no testid. It is NOT inside an <article> (tweets) or a link
  // (mentions, tweet author rows), which is what distinguishes it.
  function patchProfile() {
    if (!myHandle) return;
    const main = document.querySelector('main');
    if (!main) return;
    main.querySelectorAll('span').forEach((span) => {
      if (span.children.length > 0) return;
      if (!isMyHandleText(span.textContent)) return;
      if (span.closest('article') || span.closest('a')) return;
      blurEl(span);
    });
  }

  // childList only: we now touch classes, not text, so characterData
  // mutations from our own writes can no longer occur at all.
  const observer = new MutationObserver(() => {
    patchSwitcher();
    patchProfile();
  });

  function start() {
    injectStyle();
    observer.observe(document.body, { childList: true, subtree: true });
    patchSwitcher();
    patchProfile();
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
