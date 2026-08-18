// ==UserScript==
// @name         YTCoreUI
// @namespace    https://rvfet.com/
// @author       https://github.com/rvfet
// @version      2.0.0
// @description  Zero-CSS and Zer-Config Native YouTube web components engine
// @match        https://www.youtube.com/*
// @grant        none
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // 1. Google Material Symbols Font Loader
  (function ensureMaterialSymbols() {
    const ID = 'yt-material-symbols-font';
    if (document.getElementById(ID)) return;
    const link = document.createElement('link');
    link.id = ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0';
    (document.head || document.documentElement).appendChild(link);
  })();

  // 2. Micro Hyperscript DOM Builder
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'className' || k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (typeof v === 'boolean') v ? el.setAttribute(k, '') : el.removeAttribute(k);
      else el.setAttribute(k, String(v));
    }
    const append = (c) => {
      if (c == null || c === false) return;
      Array.isArray(c) ? c.forEach(append) : el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    };
    children.forEach(append);
    return el;
  }

  // 3. Component Factory
  const YTCoreUI = {
    h,

    icon(name, { size = 18, fill = false } = {}) {
      return h('span', {
        class: 'ytIconWrapperHost material-symbols-outlined',
        style: {
          fontSize: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
          lineHeight: `${size}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          userSelect: 'none',
          color: 'inherit',
          fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'opsz' ${size}`
        }
      }, name);
    },

    button({
      text = '',
      variant = 'secondary',
      size = 'm',
      icon = null,
      iconPosition = 'leading',
      disabled = false,
      title = '',
      onClick = null
    } = {}) {
      const variantCls = {
        primary: 'ytSpecButtonShapeNextFilled ytSpecButtonShapeNextMono',
        secondary: 'ytSpecButtonShapeNextTonal ytSpecButtonShapeNextMono',
        outline: 'ytSpecButtonShapeNextOutline ytSpecButtonShapeNextMono',
        text: 'ytSpecButtonShapeNextText ytSpecButtonShapeNextMono'
      }[variant] || 'ytSpecButtonShapeNextTonal ytSpecButtonShapeNextMono';

      const sizeCls = { s: 'ytSpecButtonShapeNextSizeS', m: 'ytSpecButtonShapeNextSizeM', l: 'ytSpecButtonShapeNextSizeL' }[size] || 'ytSpecButtonShapeNextSizeM';
      const isIconOnly = Boolean(icon && !text);
      const iconPosCls = isIconOnly ? 'ytSpecButtonShapeNextIconOnly' : icon ? (iconPosition === 'leading' ? 'ytSpecButtonShapeNextIconLeading' : 'ytSpecButtonShapeNextIconTrailing') : '';

      const iconEl = icon ? h('div', {
        'aria-hidden': 'true',
        class: 'ytSpecButtonShapeNextIcon',
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '0' }
      }, typeof icon === 'string' ? YTCoreUI.icon(icon, { size: size === 's' ? 16 : 18 }) : icon) : null;

      const textSpan = text ? h('div', {
        class: 'ytSpecButtonShapeNextButtonTextContent',
        style: { display: 'inline-flex', alignItems: 'center', lineHeight: 'normal' }
      }, text) : null;

      const children = [];
      if (iconEl && (iconPosition === 'leading' || isIconOnly)) children.push(iconEl);
      if (textSpan) children.push(textSpan);
      if (iconEl && iconPosition === 'trailing' && !isIconOnly) children.push(iconEl);
      children.push(h('yt-touch-feedback-shape', { 'aria-hidden': 'true', class: 'ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse' },
        h('div', { class: 'ytSpecTouchFeedbackShapeStroke' }),
        h('div', { class: 'ytSpecTouchFeedbackShapeFill' })
      ));

      const button = h('button', {
        class: `ytSpecButtonShapeNextHost ${variantCls} ${sizeCls} ${iconPosCls} ytSpecButtonShapeNextEnableBackdropFilterExperiment ytSpecButtonShapeNextMainstagePadding`.trim(),
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
        title: title || text,
        disabled,
        onClick: (e) => !button.disabled && onClick && onClick(e, container)
      }, ...children);

      const container = h('button-view-model', { class: 'ytSpecButtonViewModelHost' }, button);
      container.button = button;
      container.setText = (str) => { if (textSpan) textSpan.textContent = str; };
      container.setDisabled = (st) => { button.disabled = Boolean(st); };
      return container;
    },

    chip({ label = '', selected = false, icon = null, onClick = null } = {}) {
      const chipBtn = YTCoreUI.button({
        text: label,
        variant: selected ? 'primary' : 'secondary',
        size: 's',
        icon,
        onClick: (e) => {
          const next = !chipWrapper.isSelected();
          chipWrapper.setSelected(next);
          if (onClick) onClick(next, e, chipWrapper);
        }
      });

      const chipWrapper = h('yt-chip-shape', { class: 'ytChipShapeHost', 'aria-selected': selected }, chipBtn);
      chipWrapper.setSelected = (st) => {
        chipWrapper.setAttribute('aria-selected', String(st));
        chipBtn.button.classList.toggle('ytSpecButtonShapeNextFilled', st);
        chipBtn.button.classList.toggle('ytSpecButtonShapeNextTonal', !st);
      };
      chipWrapper.isSelected = () => chipWrapper.getAttribute('aria-selected') === 'true';
      chipWrapper.getLabel = () => label;
      return chipWrapper;
    },

    chipBar({ chips = [], selectedId = null, multiSelect = false, onChange = null } = {}) {
      const instances = [];
      const container = h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } });

      chips.forEach((item, idx) => {
        const id = item.id !== undefined ? item.id : idx;
        const label = typeof item === 'string' ? item : item.label;
        const el = YTCoreUI.chip({
          label,
          icon: item.icon,
          selected: selectedId === id || Boolean(item.selected),
          onClick: (st, e, target) => {
            if (!multiSelect) instances.forEach((c) => c.id !== id && c.el.setSelected(false));
            if (item.onClick) item.onClick(st, e, target);
            if (onChange) onChange(group.getSelected(), id, target);
          }
        });
        instances.push({ id, el });
        container.appendChild(el);
      });

      const group = h('div', { class: 'ytChipCloudRendererHost', style: { display: 'inline-flex', alignItems: 'center' } }, container);
      group.getSelected = () => {
        const active = instances.filter((c) => c.el.isSelected());
        return multiSelect ? active.map((c) => c.id) : (active[0]?.id ?? null);
      };
      return group;
    },

    searchbox({ placeholder = 'Search...', value = '', onSearch = null, onInput = null } = {}) {
      const input = h('input', {
        class: 'ytSearchboxComponentInput',
        type: 'text',
        placeholder,
        value,
        style: {
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--yt-spec-text-primary, #fff)',
          fontSize: '14px',
          fontFamily: 'Roboto, Noto, sans-serif',
          lineHeight: '20px',
          width: '160px',
          padding: '0 4px'
        },
        onInput: (e) => {
          clear.style.display = e.target.value ? 'inline-flex' : 'none';
          if (onInput) onInput(e.target.value, e);
        },
        onKeydown: (e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (onSearch) onSearch(input.value, e); }
        }
      });

      const clear = h('div', {
        style: { display: value ? 'inline-flex' : 'none', cursor: 'pointer', color: 'var(--yt-spec-text-secondary, #aaa)' },
        onClick: () => { input.value = ''; clear.style.display = 'none'; input.focus(); onInput && onInput(''); }
      }, YTCoreUI.icon('close', { size: 16 }));

      const wrapper = h('div', {
        class: 'ytSearchboxComponentInputBox ytSearchboxComponentInputBoxDark ytSearchboxComponentInputBoxShape',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1))',
          color: 'var(--yt-spec-text-secondary, #aaa)',
          borderRadius: '18px',
          height: '36px',
          padding: '0 12px',
          boxSizing: 'border-box',
          gap: '6px'
        }
      },
        YTCoreUI.icon('search', { size: 18 }),
        input,
        clear
      );

      wrapper.getValue = () => input.value;
      wrapper.setValue = (v) => { input.value = v; clear.style.display = v ? 'inline-flex' : 'none'; };
      return wrapper;
    },

    select({
      options = [],
      value = null,
      placeholder = 'Select option...',
      multiple = false,
      size = 'm',
      onChange = null
    } = {}) {
      const normalizeValues = (v) => {
        if (multiple) return Array.isArray(v) ? v.map(String) : (v != null ? [String(v)] : []);
        return v != null ? [String(v)] : [];
      };

      let selectedState = new Set(normalizeValues(value));
      let isOpen = false;

      const triggerBtn = YTCoreUI.button({
        text: placeholder,
        variant: 'secondary',
        size,
        icon: 'expand_more',
        iconPosition: 'trailing',
        onClick: (e) => {
          e.stopPropagation();
          isOpen ? closeDropdown() : openDropdown();
        }
      });

      const optionsList = h('div', {
        class: 'style-scope ytd-menu-popup-renderer',
        style: {
          display: 'none',
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: '0',
          minWidth: '220px',
          backgroundColor: 'var(--yt-spec-menu-background, var(--yt-spec-general-background-b, #282828))',
          borderRadius: '12px',
          boxShadow: 'var(--yt-spec-elevation-3, 0 4px 32px 0 rgba(0,0,0,0.4))',
          border: '1px solid var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1))',
          padding: '8px 0',
          zIndex: '2200',
          maxHeight: '300px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }
      });

      const optionRows = [];

      const updateState = () => {
        const selArray = Array.from(selectedState);
        if (selArray.length === 0) {
          triggerBtn.setText(placeholder);
        } else if (multiple) {
          if (selArray.length === 1) {
            const match = options.find((o) => String(o.value !== undefined ? o.value : o) === selArray[0]);
            triggerBtn.setText(match?.label ?? match ?? selArray[0]);
          } else {
            triggerBtn.setText(`${selArray.length} selected`);
          }
        } else {
          const match = options.find((o) => String(o.value !== undefined ? o.value : o) === selArray[0]);
          triggerBtn.setText(match?.label ?? match ?? selArray[0]);
        }

        optionRows.forEach(({ row, checkIcon, textNode, stringVal }) => {
          const isSelected = selectedState.has(stringVal);
          checkIcon.style.visibility = isSelected ? 'visible' : 'hidden';
          textNode.style.fontWeight = isSelected ? '500' : '400';
          textNode.style.color = isSelected ? 'var(--yt-spec-text-primary, #fff)' : 'var(--yt-spec-text-secondary, #aaa)';
          row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
      };

      options.forEach((opt) => {
        const rawVal = opt.value !== undefined ? opt.value : opt;
        const stringVal = String(rawVal);
        const optLabel = opt.label !== undefined ? opt.label : opt;

        const checkIcon = YTCoreUI.icon('check', { size: 18 });
        checkIcon.style.color = 'var(--yt-spec-call-to-action, #3ea6ff)';
        checkIcon.style.visibility = 'hidden';

        const leadingIcon = opt.icon ? YTCoreUI.icon(opt.icon, { size: 20 }) : null;
        if (leadingIcon) leadingIcon.style.color = 'var(--yt-spec-text-secondary, #aaa)';

        const textNode = h('span', {
          style: { flex: '1', lineHeight: 'normal', fontSize: '14px', color: 'var(--yt-spec-text-secondary, #aaa)' }
        }, optLabel);

        const row = h('div', {
          class: 'style-scope ytd-menu-service-item-renderer',
          role: 'option',
          tabindex: '0',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '0 16px',
            height: '40px',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            backgroundColor: 'transparent',
            boxSizing: 'border-box'
          },
          onMouseenter: () => { row.style.backgroundColor = 'var(--yt-spec-badge-chip-background, rgba(255,255,255,0.1))'; },
          onMouseleave: () => { row.style.backgroundColor = 'transparent'; },
          onClick: (e) => {
            e.stopPropagation();
            if (multiple) {
              selectedState.has(stringVal) ? selectedState.delete(stringVal) : selectedState.add(stringVal);
            } else {
              selectedState.clear();
              selectedState.add(stringVal);
              closeDropdown();
            }
            updateState();
            if (onChange) {
              const current = Array.from(selectedState).map((s) => {
                const match = options.find((o) => String(o.value !== undefined ? o.value : o) === s);
                return match?.value !== undefined ? match.value : (match ?? s);
              });
              onChange(multiple ? current : current[0], rawVal, e);
            }
          }
        }, leadingIcon, textNode, checkIcon);

        optionRows.push({ row, checkIcon, textNode, stringVal, rawVal });
        optionsList.appendChild(row);
      });

      const openDropdown = () => {
        isOpen = true;
        optionsList.style.display = 'block';
        setTimeout(() => document.addEventListener('click', outsideClickListener), 0);
      };

      const closeDropdown = () => {
        isOpen = false;
        optionsList.style.display = 'none';
        document.removeEventListener('click', outsideClickListener);
      };

      const outsideClickListener = (e) => {
        if (!container.contains(e.target)) closeDropdown();
      };

      const container = h('div', {
        style: { position: 'relative', display: 'inline-flex', alignItems: 'center' }
      }, triggerBtn, optionsList);

      updateState();

      container.getValue = () => {
        const arr = Array.from(selectedState).map((s) => {
          const match = options.find((o) => String(o.value !== undefined ? o.value : o) === s);
          return match?.value !== undefined ? match.value : (match ?? s);
        });
        return multiple ? arr : (arr[0] ?? null);
      };

      container.setValue = (newVal) => {
        selectedState = new Set(normalizeValues(newVal));
        updateState();
      };

      return container;
    }
  };

  // Export globally for consumers
  window.YTCoreUI = YTCoreUI;
})();