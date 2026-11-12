// Liniendiagramm als SVG, ohne Bibliothek.
// Messpunkte = kleine, gedämpfte Punkte; Trend = 2px-Linie in Serienfarbe; Ziel = feine Referenzlinie.
// Hover/Touch: Fadenkreuz + Tooltip.

import { s, h, fill } from './ui.js';
import { keyZuDatum, tageZwischen, datumKurz, kg } from './rechner.js';

/**
 * @param {HTMLElement} box
 * @param {Array<{tag, wert, trend?}>} punkte  sortiert
 * @param {{ziel?:number, einheit:string, trendName?:string, wertName?:string, stellen?:number, baender?:Array<{von,bis}>}} opt
 *        baender: Zeiträume, die als Hintergrundband markiert werden (z. B. Pillenpause)
 */
export function zeichneVerlauf(box, punkte, opt) {
  fill(box);
  box.classList.add('chart');
  if (punkte.length === 0) {
    box.append(h('p', { class: 'leer' }, 'Noch keine Messungen. Trag oben deinen ersten Wert ein.'));
    return;
  }

  box._breite = box.clientWidth;
  const breite = Math.max(280, box.clientWidth || 600);
  const hoehe = Math.round(Math.min(320, Math.max(200, breite * 0.5)));
  const rand = { o: 16, r: 56, u: 28, l: 40 };
  const iw = breite - rand.l - rand.r, ih = hoehe - rand.o - rand.u;

  // Wertebereich: Messwerte, Trend und Ziel einschließen, auf ganze Einheiten runden
  const werte = punkte.flatMap(p => [p.wert, p.trend]).filter(Number.isFinite);
  if (Number.isFinite(opt.ziel)) werte.push(opt.ziel);
  let lo = Math.floor(Math.min(...werte) - 0.5), hi = Math.ceil(Math.max(...werte) + 0.5);
  if (hi - lo < 2) { lo -= 1; hi += 1; }

  const t0 = punkte[0].tag, tN = punkte[punkte.length - 1].tag;
  const spanne = Math.max(1, tageZwischen(t0, tN));
  const x = tag => rand.l + (punkte.length === 1 ? iw / 2 : (tageZwischen(t0, tag) / spanne) * iw);
  const y = w => rand.o + (1 - (w - lo) / (hi - lo)) * ih;

  const svg = s('svg', { viewBox: `0 0 ${breite} ${hoehe}`, width: '100%', height: hoehe, role: 'img',
    'aria-label': `${opt.trendName || 'Verlauf'} von ${datumKurz(t0)} bis ${datumKurz(tN)}` });

  // Gitter + y-Achse (ganze Zahlen, höchstens ~5 Linien)
  const schritt = Math.max(1, Math.ceil((hi - lo) / 5));
  const gitter = s('g', { class: 'gitter' });
  for (let w = Math.ceil(lo / schritt) * schritt; w <= hi; w += schritt) {
    gitter.append(s('line', { x1: rand.l, x2: rand.l + iw, y1: y(w), y2: y(w) }));
    gitter.append(s('text', { x: rand.l - 8, y: y(w) + 4, 'text-anchor': 'end' }, String(w)));
  }
  svg.append(gitter);

  // Hintergrundbänder (z. B. Pillenpause), je einen halben Tag über den Rand der Tage hinaus, auf die Fläche begrenzt
  const halb = punkte.length === 1 ? 0 : iw / spanne / 2;
  for (const b of opt.baender || []) {
    if (b.bis < t0 || b.von > tN) continue;
    const x1 = Math.max(rand.l, x(b.von < t0 ? t0 : b.von) - halb);
    const x2 = Math.min(rand.l + iw, x(b.bis > tN ? tN : b.bis) + halb);
    svg.append(s('rect', { class: 'band', x: x1, y: rand.o, width: Math.max(1, x2 - x1), height: ih }));
  }

  // x-Achse: bis zu 4 Datumsmarken
  const achse = s('g', { class: 'achse' });
  const marken = punkte.length === 1 ? [t0] : [...new Set([0, 1 / 3, 2 / 3, 1].map(f => {
    const ziel = keyZuDatum(t0).getTime() + f * spanne * 86400000;
    return punkte.reduce((best, p) => Math.abs(keyZuDatum(p.tag) - ziel) < Math.abs(keyZuDatum(best.tag) - ziel) ? p : best).tag;
  }))];
  marken.forEach((tag, i) => achse.append(s('text', {
    x: x(tag), y: hoehe - 6, 'text-anchor': punkte.length === 1 ? 'middle' : i === 0 ? 'start' : i === marken.length - 1 ? 'end' : 'middle',
  }, datumKurz(tag))));
  svg.append(achse);

  // Ziel-Referenzlinie mit Beschriftung rechts
  if (Number.isFinite(opt.ziel)) {
    svg.append(s('line', { class: 'ziellinie', x1: rand.l, x2: rand.l + iw, y1: y(opt.ziel), y2: y(opt.ziel) }));
    svg.append(s('text', { class: 'zieltext', x: rand.l + iw + 6, y: y(opt.ziel) + 4 }, `Ziel ${kg(opt.ziel, opt.stellen ?? 1)}`));
  }

  // Messpunkte
  const punkteG = s('g', { class: 'messpunkte' });
  punkte.forEach(p => punkteG.append(s('circle', { cx: x(p.tag), cy: y(p.wert), r: 3 })));
  svg.append(punkteG);

  // Trendlinie + Endpunkt mit Wert
  const mitTrend = punkte.filter(p => Number.isFinite(p.trend));
  if (mitTrend.length > 1) {
    const d = mitTrend.map((p, i) => `${i ? 'L' : 'M'}${x(p.tag).toFixed(1)},${y(p.trend).toFixed(1)}`).join('');
    svg.append(s('path', { class: 'trend', d }));
  }
  const letzter = punkte[punkte.length - 1];
  const endWert = Number.isFinite(letzter.trend) ? letzter.trend : letzter.wert;
  svg.append(s('circle', { class: 'endpunkt', cx: x(letzter.tag), cy: y(endWert), r: 5 }));
  const endText = s('text', { class: 'endtext', x: x(letzter.tag) + 9, y: y(endWert) + 4 }, kg(endWert, opt.stellen ?? 1));
  svg.append(endText);

  // Hover-Ebene
  const kreuz = s('line', { class: 'kreuz', y1: rand.o, y2: rand.o + ih, visibility: 'hidden' });
  const fokus = s('circle', { class: 'fokus', r: 5, visibility: 'hidden' });
  svg.append(kreuz, fokus);
  const flaeche = s('rect', { x: rand.l, y: 0, width: iw, height: hoehe, fill: 'transparent' });
  svg.append(flaeche);

  const tip = h('div', { class: 'tooltip', hidden: true });
  box.append(svg, tip);

  const zeige = ev => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * breite;
    const p = punkte.reduce((best, q) => Math.abs(x(q.tag) - px) < Math.abs(x(best.tag) - px) ? q : best);
    const wy = Number.isFinite(p.trend) ? p.trend : p.wert;
    kreuz.setAttribute('x1', x(p.tag)); kreuz.setAttribute('x2', x(p.tag)); kreuz.setAttribute('visibility', 'visible');
    fokus.setAttribute('cx', x(p.tag)); fokus.setAttribute('cy', y(wy)); fokus.setAttribute('visibility', 'visible');
    fill(tip,
      h('strong', {}, datumKurz(p.tag)),
      h('div', {}, h('span', { class: 'key punkt' }), `${opt.wertName || 'Gemessen'}: ${kg(p.wert, opt.stellen ?? 1)} ${opt.einheit}`),
      Number.isFinite(p.trend) ? h('div', {}, h('span', { class: 'key linie' }), `${opt.trendName || 'Trend'}: ${kg(p.trend, opt.stellen ?? 1)} ${opt.einheit}`) : null,
      (opt.baender || []).some(b => p.tag >= b.von && p.tag <= b.bis) ? h('div', {}, h('span', { class: 'key band-key' }), opt.bandName || 'Pillenpause') : null,
    );
    tip.hidden = false;
    const links = (x(p.tag) / breite) * r.width;
    tip.style.left = `${Math.min(r.width - tip.offsetWidth - 4, Math.max(4, links - tip.offsetWidth / 2))}px`;
    tip.style.top = `${Math.max(0, (y(wy) / hoehe) * r.height - tip.offsetHeight - 14)}px`;
  };
  const verstecke = () => { tip.hidden = true; kreuz.setAttribute('visibility', 'hidden'); fokus.setAttribute('visibility', 'hidden'); };
  flaeche.addEventListener('pointermove', zeige);
  flaeche.addEventListener('pointerdown', zeige);
  flaeche.addEventListener('pointerleave', verstecke);
}
