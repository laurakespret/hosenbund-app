// Ansicht „Rezepte“: Wochenplan fürs Abendessen, alle Rezepte mit Filter, Rezeptdetail, Einkaufsliste.

import { h, ic, toast } from './ui.js';
import { tagKey, keyZuDatum, datumLang } from './rechner.js';
import { standardPlan, istTrainingstag, WOCHENTAGE } from './training.js';
import {
  REZEPTE, MAHLZEITEN, TAGS, TAG_ICONS, rezept, wochenStart, wochenEssen, naechstesRezept, mengeText, skaliert, einkaufsliste,
} from './rezepte.js';

export function standardEssen() {
  return { wahl: {}, personen: 1, favoriten: [], einkauf: { woche: null, haken: [] } };
}

/** @param {object} ctx { S, ui, aendern, zeichnen, karte, kachel } */
export function ansichtRezepte(ctx) {
  const { ui } = ctx;
  if (ui.rezept && rezept(ui.rezept)) return detail(ctx, rezept(ui.rezept));
  ui.rezeptTab ||= 'woche';
  const inhalt = { woche: wochenplan, alle: alleRezepte, einkauf: einkauf }[ui.rezeptTab](ctx);
  return h('div', { class: 'ansicht' },
    h('h1', {}, 'Rezepte'),
    h('div', { class: 'segment gross', role: 'group', 'aria-label': 'Ansicht', 'data-segment': 'rezepte' },
      [['woche', 'Wochenplan'], ['alle', 'Katalog'], ['einkauf', 'Einkaufsliste']].map(([id, l]) => h('button', {
        class: ui.rezeptTab === id ? 'an' : null, 'aria-pressed': String(ui.rezeptTab === id), 'data-wert': id,
        onclick: () => { ui.rezeptTab = id; ctx.zeichnen(); },
      }, l))),
    inhalt);
}

function essen(S) {
  return { ...standardEssen(), ...(S.essen || {}) };
}

export function oeffneRezept(ctx, id) {
  ctx.ui.rezept = id;
  ctx.ui.portionen = null;
  if (location.hash !== '#rezepte') location.hash = 'rezepte'; else ctx.zeichnen();
  window.scrollTo(0, 0);
}

/* ---------- Wochenplan ---------- */

function wochenplan(ctx) {
  const { S, aendern, karte } = ctx;
  const heute = tagKey();
  const plan = S.plan || standardPlan();
  const e = essen(S);
  const woche = wochenEssen(wochenStart(heute), t => istTrainingstag(plan, t), e.wahl, ctx.istWohlTag);

  return [
    h('p', { class: 'legende oben' }, ic('training'), 'Trainingstag', ic('wohl'), 'Wohlfühltag'),
    karte(null, h('ul', { class: 'essensplan' }, woche.map(({ tag, training, wohl, rezept: r }) => h('li', { class: tag === heute ? 'heute' : null, 'data-tag': tag },
      h('div', { class: 'tag-spalte' },
        h('strong', {}, WOCHENTAGE[keyZuDatum(tag).getDay()]),
        h('span', { class: 'mini-badge' }, training ? h('span', { title: 'Trainingstag' }, ic('training')) : null, wohl ? h('span', { title: 'Wohlfühltag' }, ic('wohl')) : null)),
      h('button', { class: 'rezept-zeile', onclick: () => oeffneRezept(ctx, r.id) },
        h('span', { class: 'rezept-name' }, r.name),
        h('small', {}, `${r.minuten} Min. · ca. ${r.kcal} kcal · ${r.eiweiss} g Eiweiß`)),
      h('button', { class: 'rund klein', 'aria-label': `Anderes Gericht für ${datumLang(tag)}`, 'data-tauschen': tag,
        onclick: () => aendern(z => {
          const neu = naechstesRezept(r, training);
          z.essen = { ...essen(z), wahl: { ...essen(z).wahl, [tag]: neu.id } };
        }) }, ic('tauschen')))))),
    h('aside', { class: 'tipp' }, 'Frühstück & Snacks: 2–3 Favoriten wiederholen.'),
  ];
}

/* ---------- Alle Rezepte ---------- */

function alleRezepte(ctx) {
  const { S, ui } = ctx;
  const e = essen(S);
  ui.rezeptFilter ||= 'alle';
  const filter = [['alle', 'Alle'], ...Object.entries(MAHLZEITEN), ['nach-training', [ic('training'), 'Training']], ['wohlfuehl', [ic('wohl'), 'Wohlfühlen']], ['favoriten', [ic('herz'), 'Favoriten']]];
  const passt = r => ui.rezeptFilter === 'alle' ? true
    : ui.rezeptFilter === 'favoriten' ? e.favoriten.includes(r.id)
    : MAHLZEITEN[ui.rezeptFilter] ? r.mahlzeit === ui.rezeptFilter
    : r.tags.includes(ui.rezeptFilter);
  const liste = REZEPTE.filter(passt);

  return [
    h('div', { class: 'chips scroll', role: 'group', 'aria-label': 'Filter' }, filter.map(([id, l]) => h('button', {
      class: 'chip' + (ui.rezeptFilter === id ? ' an' : ''), 'aria-pressed': String(ui.rezeptFilter === id), 'data-filter': id,
      onclick: () => { ui.rezeptFilter = id; ctx.zeichnen(); },
    }, l))),
    ui.rezeptFilter === 'alle'
      ? Object.entries(MAHLZEITEN).map(([id, label]) => [
          h('h2', { class: 'katalog-gruppe', 'data-gruppe': id }, label, h('span', { class: 'leise klein-text' }, ` ${liste.filter(r => r.mahlzeit === id).length}`)),
          karten(liste.filter(r => r.mahlzeit === id))])
      : liste.length ? karten(liste)
      : h('p', { class: 'hinweis' }, ui.rezeptFilter === 'favoriten' ? 'Noch keine Favoriten.' : 'Keine Rezepte für diesen Filter.'),
  ];

  function karten(rs) {
    return h('div', { class: 'rezept-liste' }, rs.map(r => h('button', { class: 'karte rezept-karte', 'data-rezept': r.id, onclick: () => oeffneRezept(ctx, r.id) },
          h('div', { class: 'rezept-oben' },
            h('span', { class: 'leise klein-text' }, MAHLZEITEN[r.mahlzeit]),
            e.favoriten.includes(r.id) ? h('span', { 'aria-label': 'Favorit', class: 'fav-zeichen' }, ic('herz')) : null),
          h('div', { class: 'rezept-name' }, r.name),
          h('div', { class: 'rezept-fakten' }, h('span', {}, ic('uhr'), `${r.minuten} Min.`), h('span', {}, ic('kcal'), `${r.kcal} kcal`), h('span', {}, ic('eiweiss'), `${r.eiweiss} g Eiweiß`)))));
  }
}

/* ---------- Detail ---------- */

function detail(ctx, r) {
  const { S, ui, aendern, karte, kachel } = ctx;
  const e = essen(S);
  const portionen = ui.portionen || (r.portionen > 1 ? r.portionen : e.personen);
  const fav = e.favoriten.includes(r.id);
  const zutaten = skaliert(r, portionen);

  return h('div', { class: 'ansicht' },
    h('div', { class: 'detail-kopf' },
      h('button', { class: 'link', onclick: () => { ui.rezept = null; ctx.zeichnen(); } }, '‹ Zurück'),
      h('button', { class: 'knopf fav' + (fav ? ' an' : ''), 'aria-pressed': String(fav), id: 'favorit',
        onclick: () => aendern(z => {
          const x = essen(z);
          z.essen = { ...x, favoriten: fav ? x.favoriten.filter(id => id !== r.id) : [...x.favoriten, r.id] };
        }) }, fav ? [ic('herz'), 'Favorit'] : [ic('herzLeer'), 'Merken'])),
    h('div', { class: 'leise klein-text' }, MAHLZEITEN[r.mahlzeit]),
    h('h1', {}, r.name),
    h('div', { class: 'tag-reihe' }, r.tags.map(t => h('span', { class: 'mini-tag' }, ic(TAG_ICONS[t]), TAGS[t]))),
    h('div', { class: 'kacheln drei fakten' },
      kachel('Zeit', `${r.minuten} Min.`),
      kachel('Pro Portion', `${r.kcal} kcal`, 'ca.'),
      kachel('Eiweiß', `${r.eiweiss} g`, 'pro Portion')),
    karte(null,
      h('div', { class: 'karten-kopf' },
        h('h2', {}, 'Zutaten'),
        h('div', { class: 'stepper' },
          h('button', { class: 'rund klein', 'aria-label': 'weniger Portionen', disabled: portionen <= 1, onclick: () => { ui.portionen = portionen - 1; ctx.zeichnen(); } }, '−'),
          h('output', { id: 'portionen' }, `${portionen} ${portionen === 1 ? 'Portion' : 'Portionen'}`),
          h('button', { class: 'rund klein', 'aria-label': 'mehr Portionen', disabled: portionen >= 8, onclick: () => { ui.portionen = portionen + 1; ctx.zeichnen(); } }, '+'))),
      h('ul', { class: 'zutaten' }, zutaten.map(x => h('li', {}, h('span', { class: 'menge' }, mengeText(x.m, x.e)), h('span', {}, x.n))))),
    h('button', { class: 'knopf breit', id: 'rezept-gegessen', onclick: () => {
      const tag = tagKey();
      aendern(z => {
        const e = z.eintraege[tag] ||= {};
        e.gegessen = [...(e.gegessen || []), { name: r.name, kcal: r.kcal, eiweiss: r.eiweiss, mahlzeit: r.mahlzeit }];
      });
      toast(`Eingetragen: ${r.kcal} kcal`);
    } }, ic('haken'), '1 Portion gegessen'),
    karte('So geht’s', h('ol', { class: 'zubereitung' }, r.schritte.map(s => h('li', {}, s)))),
    r.tipp ? h('aside', { class: 'tipp' }, r.tipp) : null);
}

/* ---------- Einkaufsliste ---------- */

function einkauf(ctx) {
  const { S, aendern, karte } = ctx;
  const heute = tagKey();
  const montag = wochenStart(heute);
  const plan = S.plan || standardPlan();
  const e = essen(S);
  // Nur die restlichen Tage dieser Woche (ab heute)
  const tage = wochenEssen(montag, t => istTrainingstag(plan, t), e.wahl, ctx.istWohlTag).filter(x => x.tag >= heute);
  const liste = einkaufsliste(tage.map(x => x.rezept), e.personen);
  const haken = e.einkauf.woche === montag ? e.einkauf.haken : [];

  const zeile = x => {
    const an = haken.includes(x.key);
    return h('li', { class: an ? 'gekauft' : null },
      h('button', { class: 'haken klein' + (an ? ' an' : ''), role: 'checkbox', 'aria-checked': String(an), 'aria-label': x.n, 'data-zutat': x.key,
        onclick: () => aendern(z => {
          const alt = essen(z);
          const h0 = alt.einkauf.woche === montag ? alt.einkauf.haken : [];
          z.essen = { ...alt, einkauf: { woche: montag, haken: an ? h0.filter(k => k !== x.key) : [...h0, x.key] } };
        }) }, an ? ic('haken') : ''),
      x.text ? h('span', { class: 'menge' }, x.text) : null, h('span', { class: 'zutat-name' }, x.n));
  };

  return [
    karte(null,
      h('div', { class: 'karten-kopf' },
        h('div', {}, h('h2', {}, 'Für die restliche Woche'), h('small', { class: 'leise' }, `${tage.length} Abendessen ab heute`)),
        h('div', { class: 'segment klein', role: 'group', 'aria-label': 'Personen', 'data-segment': 'personen' },
          [1, 2].map(n => h('button', { class: e.personen === n ? 'an' : null, 'aria-pressed': String(e.personen === n), 'data-wert': n,
            onclick: () => aendern(z => { z.essen = { ...essen(z), personen: n }; }) }, n === 1 ? '1 Person' : '2 Personen')))),
      h('ul', { class: 'einkauf' }, liste.frisch.map(zeile))),
    liste.vorrat.length ? karte('Hast du wahrscheinlich da', h('ul', { class: 'einkauf' }, liste.vorrat.map(zeile))) : null,
  ];
}
