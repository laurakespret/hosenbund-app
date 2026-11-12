// Training → Fortschritt: Kacheln, Verlauf je Übung und Chronik (mehr Gewicht, weniger Sätze …).

import { h, s, ic } from './ui.js';
import { tagKey, plusTage, datumKurz, kg } from './rechner.js';
import { ORTE, GEFUEHL, uebungsLexikon, trainingsTagebuch, uebungsVerlauf } from './training.js';

/**
 * @param {object} ctx   { S, ui, zeichnen, karte, kachel }
 * @param {object} hilfe { pille(tag) }
 */
export function ansichtFortschritt(ctx, hilfe) {
  const { S, karte, kachel } = ctx;
  const alle = ctx.einheiten();
  const buch = trainingsTagebuch(S.eintraege, alle);
  const sport = sportTage(S.eintraege);
  if (!buch.length && !sport.length) return [karte(null, h('p', { class: 'hinweis' }, 'Noch kein Training. Nach dem ersten erscheint hier dein Fortschritt.'))];

  const heute = tagKey();
  const seit = d => buch.filter(b => b.tag > plusTage(heute, -d));
  const vier = seit(28), acht = seit(56);
  const geplant = vier.reduce((x, b) => x + b.geplant, 0), geschafft = vier.reduce((x, b) => x + b.geschafft, 0);
  const steigerungen = acht.reduce((x, b) => x + b.ereignisse.filter(e => e.typ === 'mehr').length, 0);

  return [
    h('div', { class: 'kacheln drei' },
      kachel('Trainings', String(vier.length), 'letzte 4 Wochen'),
      kachel('Steigerungen', String(steigerungen), 'letzte 8 Wochen'),
      kachel('Sätze geschafft', geplant ? `${Math.round((geschafft / geplant) * 100)} %` : '–', 'letzte 4 Wochen')),
    uebungKarte(ctx, alle),
    chronik(ctx, hilfe, buch, sport, alle),
  ];
}

/* ---------- Verlauf einer Übung ---------- */

function uebungKarte(ctx, alle) {
  const { S, ui, karte } = ctx;
  const lex = uebungsLexikon(alle);
  // Nur Übungen mit Daten, in der Reihenfolge der Einheiten
  const mitDaten = Object.keys(lex).filter(k => !alle[lex[k].einheit].sanft && uebungsVerlauf(S.eintraege, k, alle).length);
  if (!mitDaten.length) return null;
  if (!mitDaten.includes(ui.fortschrittUebung)) ui.fortschrittUebung = mitDaten[0];
  const key = ui.fortschrittUebung;
  const punkte = uebungsVerlauf(S.eintraege, key, alle);
  const v = lex[key].variante;

  const wahl = h('select', { id: 'fortschritt-uebung', 'aria-label': 'Übung' },
    mitDaten.map(k => h('option', { value: k, selected: k === key }, `${lex[k].variante.name} (${ORTE[lex[k].ort]})`)));
  wahl.addEventListener('change', () => { ui.fortschrittUebung = wahl.value; ctx.zeichnen(); });

  const erster = punkte[0], letzter = punkte[punkte.length - 1];
  const diff = letzter.wert - erster.wert;
  const einheit = letzter.einheit;
  const zahl = x => einheit === 'kg' ? kg(x, x % 1 ? 1 : 0) : String(Math.round(x));

  return karte(v.gewicht ? 'Bestes Gewicht' : 'Beste Leistung',
    wahl,
    h('p', { class: 'fortschritt-zeile' },
      h('strong', {}, `${zahl(letzter.wert)} ${einheit}`),
      punkte.length > 1 ? h('span', { class: 'leise' }, ` ${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${zahl(Math.abs(diff))} seit ${datumKurz(erster.tag)}`) : null),
    linie(punkte, einheit, zahl),
    h('details', { class: 'tabelle' },
      h('summary', {}, 'Als Tabelle'),
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Datum'), h('th', {}, `Bestwert (${einheit})`))),
        h('tbody', {}, [...punkte].reverse().map(p => h('tr', {}, h('td', {}, datumKurz(p.tag), p.leicht ? ' (leicht)' : ''), h('td', {}, zahl(p.wert))))))));
}

/** Schlichte Linie mit Punkten, ein Wert pro Einheit. Antippen zeigt den Wert. */
function linie(punkte, einheit, zahl) {
  const B = 320, H = 150, L = 34, R = 10, O = 12, U = 24;
  const werte = punkte.map(p => p.wert);
  let min = Math.min(...werte), max = Math.max(...werte);
  if (min === max) { min -= 1; max += 1; }
  const rand = (max - min) * 0.15;
  min = Math.max(0, min - rand); max += rand;
  const x = i => punkte.length === 1 ? (L + B - R) / 2 : L + (i / (punkte.length - 1)) * (B - L - R);
  const y = w => O + (1 - (w - min) / (max - min)) * (H - O - U);
  if (max - min > 4) { min = Math.floor(min); max = Math.ceil(max); }
  const ticks = [min, (min + max) / 2, max];

  const info = h('p', { class: 'chart-info', 'aria-live': 'polite' }, 'Punkt antippen für Details');
  const svg = s('svg', { viewBox: `0 0 ${B} ${H}`, class: 'mini-chart', role: 'img', 'aria-label': `Verlauf: ${punkte.map(p => `${datumKurz(p.tag)} ${zahl(p.wert)} ${einheit}`).join(', ')}` },
    ticks.map(t => [
      s('line', { x1: L, x2: B - R, y1: y(t), y2: y(t), class: 'gitter' }),
      s('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', class: 'achse' }, zahl(t)),
    ]),
    s('text', { x: L, y: H - 6, class: 'achse' }, datumKurz(punkte[0].tag)),
    punkte.length > 1 ? s('text', { x: B - R, y: H - 6, 'text-anchor': 'end', class: 'achse' }, datumKurz(punkte[punkte.length - 1].tag)) : null,
    punkte.length > 1 ? s('polyline', { points: punkte.map((p, i) => `${x(i)},${y(p.wert)}`).join(' '), class: 'serie' }) : null,
    punkte.map((p, i) => {
      const zeige = () => { info.textContent = `${datumKurz(p.tag)}: ${zahl(p.wert)} ${einheit}${p.leicht ? ' (leichte Variante)' : ''}`; };
      const g = s('g', { class: 'punkt-gruppe', tabindex: 0, 'data-punkt': p.tag },
        s('circle', { cx: x(i), cy: y(p.wert), r: 14, class: 'treffer' }),
        s('circle', { cx: x(i), cy: y(p.wert), r: 4.5, class: 'marke' + (p.leicht ? ' leicht' : '') }));
      for (const ev of ['click', 'focus', 'mouseenter']) g.addEventListener(ev, zeige);
      return g;
    }));
  return h('div', { class: 'mini-chart-box' }, svg, info);
}

/* ---------- Chronik ---------- */

/** Tage mit eingetragenem Sport, älteste zuerst. */
function sportTage(eintraege) {
  return Object.entries(eintraege).filter(([, e]) => Array.isArray(e.sport) && e.sport.length)
    .map(([tag, e]) => ({ tag, sport: e.sport })).sort((a, b) => a.tag.localeCompare(b.tag));
}

function chronik(ctx, hilfe, buch, sport, einheiten) {
  const { karte, ui } = ctx;
  const ANZAHL = 6;
  const alle = [...buch, ...sport].sort((a, b) => b.tag.localeCompare(a.tag) || (a.sport ? 1 : -1));
  const sichtbar = ui.chronikAlle ? alle : alle.slice(0, ANZAHL);
  const zahl = (x, e) => e === 'kg' ? `${kg(x, x % 1 ? 1 : 0)} kg` : `${Math.round(x)} ${e}`;
  return karte('Chronik',
    h('ul', { class: 'chronik' }, sichtbar.map(b => {
      if (b.sport) return h('li', { 'data-chronik': b.tag, class: 'chronik-sport' },
        h('div', { class: 'chronik-kopf' }, h('strong', {}, datumKurz(b.tag)), h('span', {}, 'Sport'),
          h('span', { class: 'chronik-saetze' }, `${b.sport.reduce((x, s) => x + (Number(s.minuten) || 0), 0)} Min.`)),
        h('ul', { class: 'ereignisse' }, b.sport.map(s => h('li', { class: 'ereignis' }, ic('bewegung'), `${s.name}: ${s.minuten} Min.`))));
      const pause = hilfe.pille(b.tag)?.phase === 'pause';
      const gef = GEFUEHL.find(g => g.wert === b.gefuehl);
      return h('li', { 'data-chronik': b.tag },
        h('div', { class: 'chronik-kopf' },
          h('strong', {}, datumKurz(b.tag)),
          h('span', {}, `${b.name}${b.sanft ? '' : ` · ${ORTE[b.ort]}`}`),
          h('span', { class: 'chronik-saetze' + (b.geschafft < b.geplant ? ' weniger' : '') }, `${b.geschafft}/${b.geplant} Sätze`)),
        h('div', { class: 'chronik-marken' },
          b.leicht ? h('span', { class: 'mini-tag' }, 'Leichte Variante') : null,
          pause ? h('span', { class: 'mini-tag' }, ic('pille'), 'Pause') : null,
          gef ? h('span', { class: 'mini-tag' }, gef.label) : null),
        b.ereignisse.length ? h('ul', { class: 'ereignisse' }, b.ereignisse.map(e => h('li', { class: `ereignis ereignis-${e.typ}` },
          ic(e.typ === 'mehr' ? 'hoch' : e.typ === 'weniger' ? 'runter' : 'saetze'),
          e.typ === 'saetze' ? `${e.name}: ${e.ist} von ${e.soll} Sätzen` : `${e.name}: ${zahl(e.von, e.einheit)} → ${zahl(e.bis, e.einheit)}`))) : null,
        b.notiz ? h('p', { class: 'chronik-notiz' }, b.notiz) : null);
    })),
    alle.length > ANZAHL ? h('button', { class: 'knopf breit', id: 'chronik-mehr', onclick: () => { ui.chronikAlle = !ui.chronikAlle; ctx.zeichnen(); } },
      ui.chronikAlle ? 'Weniger anzeigen' : `Alle ${alle.length} anzeigen`) : null);
}
