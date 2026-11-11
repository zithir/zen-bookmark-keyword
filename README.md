# Bookmark Keyword Field (Zen mod)

Shows Zen/Firefox's built-in (but hidden) **Keyword** field in every bookmark UI:

- Add bookmark dialog (star button / `Ctrl+D`)
- Edit bookmark dialog and star popup
- Bookmarks sidebar / Library "Properties" dialogs

So you can set or change a bookmark's address-bar keyword (Vivaldi's
"bookmark nickname") at the moment you save the bookmark — no separate trip
to `about:config`-land or the Library.

## How it works

Nothing is reimplemented. Zen's `bookmarkProperties.xhtml` contains a fully
wired-up keyword row (`editBMPanel_keywordField`), and `editBookmark.js`
already loads, tracks and saves keyword values. The dialogs simply pass
`"keyword"` in their `hiddenRows` list, which hides the row. This mod removes
that single entry at two choke points:

1. `gEditItemOverlay.initPanel` (per window — star popup)
2. `PlacesUIUtils.showBookmarkDialog` (per dialog open — race-free)

The field only appears for bookmarks (not folders / multi-select), the dialog
grows automatically (the dialog has a MutationObserver that resizes on row
unhide), and the existing keyword is pre-filled when editing.

## Install (with Sine)

1. Install [Sine](https://github.com/CosmoCreeper/Sine) (community mod manager
   for Zen — runs JS mods).
2. Zen Settings → Sine: allow JavaScript mods from unofficial sources
   (`sine.allow-unsafe-js`).
3. In Sine's mod installer, add this repository:
   `zithir/zen-bookmark-keyword` — and install it.
4. Restart Zen.

## Verify

Press `Ctrl+D` on any page: the dialog now has a **Keyword** field between the
Tags row and the buttons. Type one, Save, then type the keyword in the
address bar.

## Uninstall

Turn the mod off in Sine and restart Zen. The mod only wraps two functions at
runtime; nothing on disk or in your places database is modified by it.
