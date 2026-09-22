// ==UserScript==
// @name         Hide X/Twitter username (bottom-left)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Replaces the @username characters with question marks in the bottom-left corner of x.com, keeping the avatar and display name
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function patchTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (text && text.startsWith('@') && text.length > 1) {
        node.nodeValue = '@' + '?'.repeat(text.length - 1);
      }
    }
  }

  function patchButton() {
    const buttons = document.querySelectorAll(
      '[data-testid="SideNav_AccountSwitcher_Button"]'
    );
    buttons.forEach(patchTextNodes);
    return buttons.length > 0;
  }

  // React re-renders this part of the nav, so re-apply on every DOM change
  const observer = new MutationObserver(() => {
    patchButton();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    patchButton();
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
