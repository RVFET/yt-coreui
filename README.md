# YTCoreUI Core Library

A zero-CSS micro-component library for YouTube userscript developers. It builds DOM elements using YouTube's internal design system tokens (`--yt-spec-*`) and layout classes (`ytSpecButtonShapeNext*`, Polymer/custom element wrappers).

---

### Why This Exists

1. **Theme Fragility:** Hardcoding CSS or shipping custom stylesheets breaks across YouTube's dark/light modes, ambient mode, and theme updates.
2. **DOM Verbosity:** Reconstructing YouTube's native button and chip structures manually in vanilla JavaScript requires verbose, repetitive element nesting and class juggling.
3. **No Bundle Overhead:** Importing React, Preact, or custom CSS bundles into userscripts adds unnecessary bloat. YTCoreUI relies on the styles YouTube has *already evaluated and loaded* in the client's memory.

---

### What It Is & What It Isn't

* **It IS:** A helper library designed to be imported via `@require` in your own userscripts to rapidly inject native-looking UI controls (buttons, chips, search boxes, dropdown selects).
* **It IS NOT:** A standalone extension with end-user functionality. Installing it alone does nothing.
* **It IS NOT:** A full reactive UI framework (no virtual DOM, no state reconciler). It returns standard HTML DOM nodes with simple setter/getter bindings.

---

### Components Provided

* `YTCoreUI.h(tag, attrs, ...children)`: Minimal hyperscript utility handling inline style objects, event listeners, and nested children.
* `YTCoreUI.icon(name, options)`: Material Symbols loader and wrapper.
* `YTCoreUI.button(options)`: Native YouTube Spec Next button (primary, secondary, outline, text) with touch-feedback shapes and dynamic labels.
* `YTCoreUI.chip(options)` / `YTCoreUI.chipBar(options)`: Filter chips and single/multi-select chip groups.
* `YTCoreUI.searchbox(options)`: Integrated YouTube-styled search bar with clear actions and input debouncing hooks.
* `YTCoreUI.select(options)`: Custom single/multi-select dropdown styled after YouTube's native context menus (`ytd-menu-popup-renderer`).

---

### Usage

Add the library to your userscript metadata block via `@require`:

```javascript
// ==UserScript==
// @name         My YouTube Extension
// @match        https://www.youtube.com/*
// @require      https://update.greasyfork.org/scripts/591892/1906121/YTCoreUI.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // 1. Create a native-styled button
  const myButton = YTCoreUI.button({
    text: 'Download',
    variant: 'secondary',
    size: 'm',
    icon: 'download',
    onClick: (e, target) => {
      console.log('Action triggered');
      target.setText('Processing...');
      target.setDisabled(true);
    }
  });

  // 2. Create a dropdown selector
  const mySelect = YTCoreUI.select({
    placeholder: 'Filter Quality',
    options: [
      { label: '1080p', value: '1080' },
      { label: '4K', value: '2160' }
    ],
    onChange: (selectedValue) => {
      console.log('Selected:', selectedValue);
    }
  });

  // 3. Inject directly into YouTube's DOM (e.g., above the player or in the actions bar)
  const targetContainer = document.querySelector('#owner');
  if (targetContainer) {
    targetContainer.appendChild(myButton);
    targetContainer.appendChild(mySelect);
  }
})();
```