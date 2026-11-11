/* Test patch — paste this into Zen's Browser Console (not the normal DevTools).
   It applies the same logic as the mod, to the running browser:
   1. wraps PlacesUIUtils.showBookmarkDialog so any bookmark dialog
      (Add via Ctrl+D / star, Edit, sidebar Properties) shows the Keyword row
   2. wraps gEditItemOverlay.initPanel in every open browser window so the
      star popup shows it too
   Zero persistence: everything reverts when you restart Zen.
*/
(() => {
  const strip = rows =>
    Array.isArray(rows) ? rows.filter(r => r !== "keyword") : rows;

  // 1. dialogs (module-level, race-free)
  const { PlacesUIUtils } = ChromeUtils.importESModule(
    "moz-src:///browser/components/places/PlacesUIUtils.sys.mjs"
  );
  if (!PlacesUIUtils.showBookmarkDialog.__kwOriginal) {
    const orig = PlacesUIUtils.showBookmarkDialog;
    const wrapped = async function (aInfo, parentWindow) {
      if (aInfo && Array.isArray(aInfo.hiddenRows)) {
        aInfo.hiddenRows = strip(aInfo.hiddenRows);
      }
      return orig.call(this, aInfo, parentWindow);
    };
    wrapped.__kwOriginal = orig;
    PlacesUIUtils.showBookmarkDialog = wrapped;
    console.log("[bookmark-keyword] showBookmarkDialog wrapped");
  }

  // 2. star popup in already-open windows
  let n = 0;
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    const overlay = win.gEditItemOverlay;
    if (overlay && typeof overlay.initPanel === "function" && !overlay.initPanel.__kwOriginal) {
      const orig = overlay.initPanel;
      const wrapped = function (aInfo) {
        if (aInfo && Array.isArray(aInfo.hiddenRows)) {
          aInfo.hiddenRows = strip(aInfo.hiddenRows);
        }
        return orig.call(this, aInfo);
      };
      wrapped.__kwOriginal = orig;
      overlay.initPanel = wrapped;
      n++;
    }
  }
  console.log("[bookmark-keyword] star popup patched in " + n + " window(s)");
})();
