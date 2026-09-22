// ==UserScript==
// @name         Hide X/Twitter username (bottom-left + profile page)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Replaces your @username with question marks in the bottom-left corner of x.com and on your profile page; hovering the profile handle reveals it until the cursor leaves
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let myHandle = null;          // captured from the sidebar button before masking
  let hovering = false;
  let maskedSpan = null;        // last profile-handle span we masked

  function maskText(t) {
    return '@' + '?'.repeat(t.length - 1);
  }

  function isMyHandleText(t) {
    return !!myHandle && t && t.toLowerCase() === ('@' + myHandle).toLowerCase();
  }

  function patchSwitcher() {
    document.querySelectorAll('[data-testid="SideNav_AccountSwitcher_Button"]').forEach((btn) => {
      const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.nodeValue;
        if (!t || !t.startsWith('@') || t.length < 2) continue;
        if (!myHandle) myHandle = t.slice(1);
        const masked = maskText(t);
        // Only write when the value actually differs: writing nodeValue fires a
        // characterData mutation even for identical text, which would re-trigger
        // the MutationObserver forever and freeze the page.
        if (node.nodeValue !== masked) node.nodeValue = masked;
      }
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
      const t = span.textContent;
      if (isMyHandleText(t)) {
        maskedSpan = span;
        if (!hovering) {
          const masked = maskText(t);
          if (span.textContent !== masked) span.textContent = masked;
        }
      }
    });
  }

  // Delegation on document survives React re-renders that would strip
  // listeners attached directly to the span.
  function hoverZone() {
    return maskedSpan && maskedSpan.isConnected ? (maskedSpan.parentElement || maskedSpan) : null;
  }

  document.addEventListener('mouseover', (e) => {
    const zone = hoverZone();
    if (!zone || hovering || !zone.contains(e.target)) return;
    hovering = true;
    maskedSpan.textContent = '@' + myHandle;
  });

  document.addEventListener('mouseout', (e) => {
    const zone = hoverZone();
    if (!zone || !hovering) return;
    if (zone.contains(e.target) && !zone.contains(e.relatedTarget)) {
      hovering = false;
      maskedSpan.textContent = maskText('@' + myHandle);
    }
  });

  const observer = new MutationObserver(() => {
    patchSwitcher();
    patchProfile();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    patchSwitcher();
    patchProfile();
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
