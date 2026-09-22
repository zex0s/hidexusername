// ==UserScript==
// @name         Hide X/Twitter account switcher (bottom-left)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hides the @username account button in the bottom-left corner of x.com
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const css = `
    [data-testid="SideNav_AccountSwitcher_Button"] {
      display: none !important;
    }
  `;

  // GM_addStyle may not exist at document-start with default settings; fall back
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css);
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
})();
