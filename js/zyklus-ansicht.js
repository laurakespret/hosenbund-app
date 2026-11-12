// Verlauf → Zyklus: Pillenkalender mit Tagesform und Vergleich der Pillenphasen.

import { h, ic } from './ui.js';
import { tagKey, plusTage, keyZuDatum, datumLang, datumKurz, kg, tageZwischen } from './rechner.js';
import { PILLEN_PHASEN, MERKMALE, phaseVon, phasenVergleich, formErfasst, tagesStufe } from './zyklus.js';

const VERGLEICH_TAGE = 84;   // letzte 3 Packungen

/**
 * @param {object} ctx  { S, ui, zeichnen, karte, kachel }
 * @param {object} hilfe { pille(tag), eintrag(tag), punkte(tag), trend: Map<tag, trend> }
 */
export function ansichtZyklus(ctx, hilfe) {
  const { S, karte, kachel } = ctx;
  if (!S.zyklus?.modus || S.zyklus.modus === 'aus') {
    return [karte(null, h('p', { class: 'hinweis' }, 'Pille noch nicht eingerichtet: ', h('a', { href: '#ich' }, 'unter „Ich“'), '.'))];
  }
  const heute = tagKey();
  const pi = hilfe.pille(heute);
  const stufe = tagesStufe(hilfe.eintrag(heute).form || {}, pi);
  const phase = PILLEN_PHASEN.find(p => p.id === phaseVon(pi));
  const bisWechsel = pi.phase === 'pause' ? tageZwischen(heute, pi.naechstePackung) : tageZwischen(heute, pi.naechstePause);

  return [
    h('div', { class: 'kacheln' },
      kachel('Heute', pi.phase === 'pause' ? `Pause · Tag ${pi.pausenTag}` : `${phase.label} · Tag ${pi.einnahmeTag}`,
        stufe.stufe === 'normal' ? 'normaler Tag' : stufe.stufe === 'ruhe' ? 'Ruhetag' : 'sanfter Tag'),
      kachel(pi.phase === 'pause' ? 'Neue Packung' : 'Nächste Pause', bisWechsel === 0 ? 'heute' : `in ${bisWechsel} ${bisWechsel === 1 ? 'Tag' : 'Tagen'}`,
        datumKurz(pi.phase === 'pause' ? pi.naechstePackung : pi.naechstePause))),
    kalender(ctx, hilfe, heute),
    vergleich(ctx, hilfe, heute),
  ];
}

/* ---------- Monatskalender ---------- */

function kalender(ctx, hilfe, heute) {
  const { ui, karte } = ctx;
  ui.zyklusMonat ||= heute.slice(0, 7);
  const [j, m] = ui.zyklusMonat.split('-').map(Number);
  const erster = `${ui.zyklusMonat}-01`;
  const tageImMonat = new Date(j, m, 0).getDate();
  const versatz = (keyZuDatum(erster).getDay() + 6) % 7;   // Montag zuerst
  const monatName = keyZuDatum(erster).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const wechsle = n => { const d = new Date(j, m - 1 + n, 1); ui.zyklusMonat = tagKey(d).slice(0, 7); ctx.zeichnen(); };

  const zellen = [];
  for (let i = 0; i < versatz; i++) zellen.push(h('span', { class: 'kal-leer', 'aria-hidden': 'true' }));
  for (let d = 1; d <= tageImMonat; d++) {
    const t = plusTage(erster, d - 1);
    const pi = hilfe.pille(t);
    const form = hilfe.eintrag(t).form || {};
    const merkmale = MERKMALE.filter(x => x.hat(form));
    const zukunft = t > heute;
    const beschreibung = [datumLang(t), pi?.phase === 'pause' ? 'Pillenpause' : null, ...merkmale.map(x => x.label)].filter(Boolean).join(', ');
    zellen.push(h('button', {
      class: ['kal-tag', pi?.phase === 'pause' ? 'kal-pause' : '', t === heute ? 'heute' : '', zukunft ? 'zukunft' : ''].filter(Boolean).join(' '),
      'aria-label': beschreibung, title: beschreibung, 'data-kal': t, disabled: zukunft,
      onclick: () => { ui.tag = t; location.hash = 'heute'; },
    },
      h('span', { class: 'kal-nr' }, String(d)),
      h('span', { class: 'kal-icons' }, merkmale.slice(0, 3).map(x => ic(x.icon)), merkmale.length > 3 ? h('span', { class: 'kal-mehr' }, '+') : null)));
  }

  return karte(null,
    h('div', { class: 'karten-kopf' },
      h('button', { class: 'rund klein', 'aria-label': 'Vorheriger Monat', onclick: () => wechsle(-1) }, '‹'),
      h('h2', { class: 'kal-titel' }, monatName),
      h('button', { class: 'rund klein', 'aria-label': 'Nächster Monat', onclick: () => wechsle(1) }, '›')),
    h('div', { class: 'kalender', role: 'group', 'aria-label': `Kalender ${monatName}` },
      ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => h('span', { class: 'kal-kopf', 'aria-hidden': 'true' }, w)),
      zellen),
    h('p', { class: 'legende' }, h('span', { class: 'key band-key' }), 'Pause',
      MERKMALE.map(x => h('span', { class: 'legende-teil' }, ic(x.icon), x.label))));
}

/* ---------- Phasen im Vergleich ---------- */

function vergleich(ctx, hilfe, heute) {
  const { karte } = ctx;
  const tage = Array.from({ length: VERGLEICH_TAGE }, (_, i) => plusTage(heute, i - VERGLEICH_TAGE + 1));
  const erg = phasenVergleich(tage, t => phaseVon(hilfe.pille(t)), t => {
    const e = hilfe.eintrag(t);
    const trend = hilfe.trend.get(t);
    return {
      form: e.form,
      gewichtDiff: Number.isFinite(e.gewicht) && Number.isFinite(trend) ? e.gewicht - trend : null,
      punkte: hilfe.punkte(t),
      training: !!e.training?.fertig,
    };
  });
  const phasen = PILLEN_PHASEN;
  const zahl = (x, f) => x === null || x === undefined ? '–' : f(x);
  const vorzeichen = x => `${x > 0.04 ? '+' : x < -0.04 ? '−' : '±'}${kg(Math.abs(x))}`;
  const erfasstGesamt = phasen.reduce((s, p) => s + erg[p.id].erfasst, 0);

  // Stufe 0–4 für die Farbintensität (eine Farbe, hell → kräftig)
  const stufe = (n, von) => !von || !n ? 0 : Math.min(4, Math.ceil((n / von) * 4));

  const zeile = (label, werte, kl = '') => h('tr', { class: kl || null }, h('th', { scope: 'row' }, label), werte);
  const tabelle = h('table', { class: 'phasen' },
    h('thead', {}, h('tr', {}, h('th', {}, h('span', { class: 'sr' }, 'Wert')),
      phasen.map(p => h('th', { scope: 'col', class: p.id === 'pause' ? 'phase-pause' : null }, p.kurz)))),
    h('tbody', {},
      zeile('Gewicht ggü. Trend (kg)', phasen.map(p => h('td', {}, zahl(erg[p.id].gewichtDiff, vorzeichen)))),
      zeile('Bausteine Ø', phasen.map(p => h('td', {}, zahl(erg[p.id].punkte, x => kg(x))))),
      zeile('Trainings', phasen.map(p => h('td', {}, String(erg[p.id].training)))),
      MERKMALE.map((m, i) => zeile([ic(m.icon), m.label], phasen.map(p => {
        const n = erg[p.id].merkmale[m.id], von = erg[p.id].erfasst;
        return h('td', { class: `heat heat-${stufe(n, von)}`, 'data-merkmal': `${m.id}-${p.id}`,
          title: `${m.label}, ${p.label}: ${n} von ${von} Tagen`, 'aria-label': `${m.label}, ${p.label}: an ${n} von ${von} erfassten Tagen` },
          von ? String(n) : '–');
      }), i === 0 ? 'trenner' : ''))));

  return karte('Phasen im Vergleich',
    h('p', { class: 'hinweis' }, 'Letzte 3 Packungen. Beschwerden: Anzahl Tage.'),
    h('div', { class: 'raster-scroll' }, tabelle),
    erfasstGesamt ? null : h('p', { class: 'hinweis' }, 'Noch keine Tagesform eingetragen.'));
}
