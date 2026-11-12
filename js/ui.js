// Mini-Helfer für DOM ohne Framework.

import { SYMBOLE } from './icons.js';

/**
 * h('div', {class:'x', onclick: fn}, 'Text', kind, [weitere], null)
 * null/false/undefined werden übersprungen, Arrays werden flachgeklopft.
 */
export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;          // nur für eigene, feste Texte verwenden
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  anhaengen(el, kinder);
  return el;
}

function anhaengen(el, kinder) {
  for (const k of kinder.flat(Infinity)) {
    if (k === null || k === undefined || k === false || k === true) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** Inhalt ersetzen. Immer diesen Helfer nehmen, nie replaceChildren mit Listen. */
export function fill(el, ...kinder) {
  el.textContent = '';
  anhaengen(el, kinder);
  return el;
}

/** SVG-Element erzeugen. */
export function s(tag, attrs = {}, ...kinder) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, v);
  anhaengen(el, kinder);
  return el;
}

let toastTimer;
export function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('sichtbar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('sichtbar'), 2600);
}

/** Eigenes Icon (statt Emoji). name = Schlüssel aus SYMBOLE in icons.js. */
export function ic(name, klasse = '') {
  return h('span', { class: `ic ${klasse}`.trim(), 'aria-hidden': 'true', html: SYMBOLE[name] || '' });
}
