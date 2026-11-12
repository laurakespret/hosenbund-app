// Eigene Icons für die Navigation im 80er Memphis-Stil:
// kräftige Linie (currentColor) + versetzte bunte Form dahinter (Klasse .ic-form, Farbe per CSS).
// Feste, eigene SVG-Texte → dürfen per innerHTML eingesetzt werden.

const svg = inhalt => `<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inhalt}</svg>`;

export const ICONS = {
  // Sonne
  heute: svg(`
    <circle class="ic-form" cx="18.5" cy="18.5" r="7" stroke="none"/>
    <circle cx="16" cy="16" r="5.5"/>
    <path d="M16 3.5v3M16 25.5v3M3.5 16h3M25.5 16h3M7.2 7.2l2.1 2.1M22.7 22.7l2.1 2.1M7.2 24.8l2.1-2.1M22.7 9.3l2.1-2.1"/>`),
  // Diagramm mit Zickzack-Kurve
  verlauf: svg(`
    <path class="ic-form" d="M14 27 L23 11 L32 27 Z" stroke="none"/>
    <path d="M5 4v22h23"/>
    <path d="M9 20l5-6 4 3 7-9"/>
    <circle cx="25" cy="8" r="1.6" fill="currentColor" stroke="none"/>`),
  // Kurzhantel
  training: svg(`
    <rect class="ic-form" x="9" y="13" width="18" height="12" rx="2" stroke="none" transform="rotate(-8 18 19)"/>
    <path d="M11 16h10"/>
    <rect x="6" y="10" width="5" height="12" rx="1.5"/>
    <rect x="21" y="10" width="5" height="12" rx="1.5"/>
    <path d="M3.5 13.5v5M28.5 13.5v5"/>`),
  // Schüssel mit Dampf
  rezepte: svg(`
    <circle class="ic-form" cx="20" cy="21" r="8" stroke="none"/>
    <path d="M4.5 15.5h23a11.5 11.5 0 0 1-23 0z"/>
    <path d="M12 26.5h8"/>
    <path d="M11 11c-1.5-1.5 1.5-3 0-4.5M16 11c-1.5-1.5 1.5-3 0-4.5M21 11c-1.5-1.5 1.5-3 0-4.5"/>`),
  // Person
  ich: svg(`
    <rect class="ic-form" x="12" y="14" width="16" height="16" rx="3" stroke="none" transform="rotate(12 20 22)"/>
    <circle cx="16" cy="10.5" r="5"/>
    <path d="M6 27c0-5.5 4.5-9 10-9s10 3.5 10 9"/>`),
};

// Kleine Icons für Inhalte (ohne bunte Form). Gleicher Strich wie die Navigation.
const HERZ = 'M16 27S4 20 4 11.5A6 6 0 0 1 16 9a6 6 0 0 1 12 2.5C28 20 16 27 16 27z';
const TROPFEN = 'M16 4c5 6.5 8 10.5 8 14.5a8 8 0 0 1-16 0C8 14.5 11 10.5 16 4z';
const FLAMME = 'M16 28c-5.5 0-9-3.5-9-8.5 0-5 4-7 5-12 3 2 4 4.5 4 7 1-1 2-2.5 2.5-4.5 3.5 3 5.5 6 5.5 9.5 0 5-3.5 8.5-8 8.5z';
const BLATT = '<path d="M6 26C6 13 13 6 27 5c0 14-7 21-20 21z"/><path d="M6 26 18 14"/>';
const batterie = n => `<rect x="3.5" y="10" width="22" height="12" rx="2.5"/><path d="M28.5 14v4"/>${
  Array.from({ length: n }, (_, i) => `<rect x="${6.5 + i * 6}" y="13" width="4" height="6" rx="1" fill="currentColor" stroke="none"/>`).join('')}`;

export const SYMBOLE = {
  schritte:  svg('<path d="M3.5 23.5v-11l5 1.5 3-3 4.5 6 9 3a3 3 0 0 1 3 3v.5z"/><path d="M3.5 27.5h25M12 17l-2 2M15 19.5l-2 2"/>'),
  wasser:    svg(`<path d="${TROPFEN}"/><path d="M12 19a4 4 0 0 0 3 4"/>`),
  gemuese:   svg(BLATT),
  eiweiss:   svg('<path d="M16 4c5 0 9 8 9 14a9 9 0 0 1-18 0c0-6 4-14 9-14z"/>'),
  bewegung:  svg(`<path d="${HERZ}"/><path d="M7 16h5l2-3.5 3 7 2-3.5h6"/>`),
  kueche:    svg('<path d="M24.5 20A10 10 0 0 1 12 7.5 10 10 0 1 0 24.5 20z"/><path d="M23 5v4M21 7h4"/>'),
  genuss:    svg('<rect x="8" y="4" width="16" height="24" rx="2.5"/><path d="M8 12h16M8 20h16M16 4v24"/>'),
  training:  ICONS.training.replace(/<rect class="ic-form"[^>]*\/>/, ''),
  essen:     ICONS.rezepte.replace(/<circle class="ic-form"[^>]*\/>/, ''),
  pille:     svg('<g transform="rotate(-45 16 16)"><rect x="4" y="10.5" width="24" height="11" rx="5.5"/><path d="M16 10.5v11"/></g>'),
  wohl:      svg(`<path d="${HERZ}"/>`),
  herz:      svg(`<path d="${HERZ}" fill="currentColor"/>`),
  herzLeer:  svg(`<path d="${HERZ}"/>`),
  kraempfe:  svg('<path d="M3 16l4-6 4 12 4-12 4 12 4-12 4 6"/>'),
  blaehbauch: svg('<ellipse cx="16" cy="13" rx="8.5" ry="10"/><path d="M14.5 25.5h3M16 23v2.5c0 1.5-1.5 2 0 4"/>'),
  blutung:   svg(`<path d="${TROPFEN}" fill="currentColor"/>`),
  energie1:  svg(batterie(1)),
  energie2:  svg(batterie(2)),
  energie3:  svg(batterie(3)),
  serie:     svg(`<path d="${FLAMME}"/>`),
  kcal:      svg(`<path d="${FLAMME}"/>`),
  stern:     svg('<path d="M16 3l3 10 10 3-10 3-3 10-3-10-10-3 10-3z"/>'),
  uhr:       svg('<circle cx="16" cy="18" r="10"/><path d="M16 18v-5M12.5 4h7M16 4v4M24 9l2-2"/>'),
  haken:     svg('<path d="M6 16.5l6.5 6.5L26 9.5"/>'),
  tauschen:  svg('<path d="M25.5 12.5A10 10 0 0 0 7.5 10M6.5 19.5a10 10 0 0 0 18 2.5"/><path d="M7 4v6.5h6.5M25 28v-6.5h-6.5"/>'),
  hoch:      svg('<path d="M16 26V6M8 14l8-8 8 8"/>'),
  kamera:    svg('<path d="M4 10.5a2 2 0 0 1 2-2h3.5l2-3h9l2 3H26a2 2 0 0 1 2 2V24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="16" cy="16.5" r="5"/>'),
  runter:    svg('<path d="M16 6v20M8 18l8 8 8-8"/>'),
  saetze:    svg('<rect x="4" y="6" width="24" height="5" rx="2"/><rect x="4" y="14" width="24" height="5" rx="2"/><rect x="4" y="22" width="14" height="5" rx="2" stroke-dasharray="3 3"/>'),
  teilen:    svg('<path d="M16 4v15M10 10l6-6 6 6"/><path d="M11 14H7v14h18V14h-4"/>'),
  health:    svg('<rect x="9" y="3" width="14" height="26" rx="3"/><path d="M16 9v10M12 15l4 4 4-4"/>'),
  box:       svg('<path d="M5 10.5l11-5 11 5v12l-11 5-11-5z"/><path d="M5 10.5l11 5 11-5M16 15.5v12"/>'),
  schnell:   svg('<path d="M18 3L7 18h8l-2 11 12-16h-8z"/>'),
  blatt:     svg(BLATT),
};
