// ==UserScript==
// @name           Bookmark Keyword Field
// @version        1.0.0
// @description    Show the Keyword field in Zen's bookmark dialog and star popup.
// @include        chrome://browser/content/browser.xhtml
// @include        chrome://browser/content/places/bookmarkProperties.xhtml
// ==/UserScript==
//
// Zen (like Firefox) fully supports bookmark keywords internally, but its
// Add/Edit bookmark UI hides the keyword row by passing "keyword" in the
// dialog's hiddenRows list. This mod removes that one entry, making the
// existing, fully wired-up Keyword field visible again:
//   - Add bookmark dialog (star button / Ctrl+D)
//   - Edit bookmark dialog
//   - Star popup in the toolbar
//   - Bookmarks sidebar / Library "Properties" dialogs
//
// Loaded per browser window by Sine.

(() => {
  "use strict";

  const TAG = "[bookmark-keyword]";
  const INCLUDED_URLS = [
    "chrome://browser/content/browser.xhtml",
    "chrome://browser/content/places/bookmarkProperties.xhtml",
  ];
  if (!INCLUDED_URLS.includes(location.href)) {
    return;
  }
  if (window.__bookmarkKeywordField) {
    return; // already patched this window
  }

  const stripKeyword = rows =>
    Array.isArray(rows) ? rows.filter(row => row !== "keyword") : rows;

  // 1. Per-window patch: gEditItemOverlay.initPanel controls which rows are
  //    shown in every bookmark panel/dialog instance. Covers the star popup
  //    and any dialog opened after this window loaded.
  function patchOverlay() {
    const overlay = window.gEditItemOverlay;
    if (!overlay || typeof overlay.initPanel !== "function") {
      return false;
    }
    if (overlay.initPanel.__bookmarkKeywordOriginal) {
      return true; // already patched
    }
    const original = overlay.initPanel;
    const wrapped = function (aInfo) {
      if (aInfo && Array.isArray(aInfo.hiddenRows)) {
        aInfo.hiddenRows = stripKeyword(aInfo.hiddenRows);
      }
      return original.call(this, aInfo);
    };
    wrapped.__bookmarkKeywordOriginal = original;
    overlay.initPanel = wrapped;
    return true;
  }

  // 2. Module-level patch: PlacesUIUtils.showBookmarkDialog passes its aInfo
  //    object straight into the dialog window, so stripping hiddenRows here
  //    guarantees dialogs opened from this window show the field even if the
  //    dialog window's script injection lags behind its initialization.
  function patchPlacesUIUtils() {
    const moduleURLs = [
      "moz-src:///browser/components/places/PlacesUIUtils.sys.mjs", // Zen
      "resource:///modules/PlacesUIUtils.sys.mjs", // standard Firefox layout
    ];
    let PlacesUIUtils = null;
    for (const url of moduleURLs) {
      try {
        ({ PlacesUIUtils } = ChromeUtils.importESModule(url));
        break;
      } catch (e) {
        // try next candidate
      }
    }
    if (!PlacesUIUtils || typeof PlacesUIUtils.showBookmarkDialog !== "function") {
      console.warn(TAG + ": could not import PlacesUIUtils, dialogs rely on per-window patch only");
      return;
    }
    if (PlacesUIUtils.showBookmarkDialog.__bookmarkKeywordOriginal) {
      return; // already patched
    }
    const original = PlacesUIUtils.showBookmarkDialog;
    const wrapped = async function (aInfo, parentWindow) {
      if (aInfo && Array.isArray(aInfo.hiddenRows)) {
        aInfo.hiddenRows = stripKeyword(aInfo.hiddenRows);
      }
      return original.call(this, aInfo, parentWindow);
    };
    wrapped.__bookmarkKeywordOriginal = original;
    PlacesUIUtils.showBookmarkDialog = wrapped;
  }

  window.__bookmarkKeywordField = { patchOverlay, patchPlacesUIUtils };
  patchPlacesUIUtils();

  if (!patchOverlay()) {
    // gEditItemOverlay is not defined yet (scripts still loading); retry
    // briefly until it appears so the star popup is covered too.
    let tries = 0;
    const timer = setInterval(() => {
      if (patchOverlay() || ++tries >= 50) {
        clearInterval(timer);
      }
    }, 100);
  }
})();
