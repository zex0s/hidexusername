// ==UserScript==
// @name         Hide X/Twitter username (bottom-left + profile page)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Replaces your @username with question marks in the bottom-left corner of x.com and on your profile page; hovering the profile handle briefly reveals it
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let myHandle = null;       // captured from the sidebar button before masking
  let hoveringProfile = false;

  function maskHandle(text) {
    if (text.startsWith('@') && text.length > 1) {
      return '@' + '?'.repeat(text.length - 1);
    }
    return null;
  }

  function patchSwitcher() {
    document.querySelectorAll('[data-testid="SideNav_AccountSwitcher_Button"]').forEach((btn) => {
      const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        if (text && text.startsWith('@') && text.length > 1) {
          if (!myHandle) myHandle = text.slice(1);
          node.nodeValue = maskHandle(text);
        }
      }
    });
  }

  function revealProfileName(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.startsWith('@?')) {
        node.nodeValue = '@' + myHandle;
      }
    }
  }

  function maskProfileName(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (text && text.toLowerCase() === '@' + myHandle.toLowerCase()) {
        node.nodeValue = maskHandle(text);
      }
    }
  }

  function attachHover(el) {
    if (el.dataset.hideXHandle === 'done') return;
    el.dataset.hideXHandle = 'done';
    el.addEventListener('mouseenter', () => {
      hoveringProfile = true;
      revealProfileName(el);
    });
    el.addEventListener('mouseleave', () => {
      hoveringProfile = false;
      maskProfileName(el);
    });
  }

  function patchProfile() {
    if (!myHandle || hoveringProfile) return;
    const el = document.querySelector('[data-testid="UserScreenName"]');
    if (!el) return;
    attachHover(el);
    maskProfileName(el);
  }

  const observer = new MutationObserver(() => {
    patchSwitcher();
    patchProfile();
  });

  function start() {
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
