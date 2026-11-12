// Hosenbund: Zustand, Navigation und Ansichten.

import { h, fill, toast, ic } from './ui.js';
import { laden, speichern, loeschen, exportieren, importieren, leererZustand } from './store.js';
import {
  tagKey, plusTage, tageZwischen, AKTIVITAET, energie, trendlinie, tempoProWoche, prognose,
  realistischeDauer, BAUSTEINE, GENUSS, bausteinErfuellt, tagesPunkte, letzteTage, meineBausteine,
  kg, datumKurz, datumLang, alterAus, keyZuDatum,
} from './rechner.js';
import { zeichneVerlauf } from './chart.js';
import { ICONS } from './icons.js';
import { essenKarte, essenDialog } from './kalorien-ansicht.js';
import { summe as essenSumme } from './kalorien.js';
import { ansichtZyklus } from './zyklus-ansicht.js';
import { leseHealthText, uebernehmen, beschreibe } from './health.js';
import { ansichtTraining } from './training-ansicht.js';
import { ansichtRezepte, oeffneRezept, standardEssen } from './rezepte-ansicht.js';
import { abendFuer, rezept } from './rezepte.js';
import { PILLEN_SCHEMATA, BESCHWERDEN, ENERGIE, pillenInfo, tagesStufe, zieleFuer, stufenText } from './zyklus.js';
import { ORTE, istTrainingstag, naechsteEinheit, standardPlan } from './training.js';
import { einheitenAlle } from './bibliothek.js';
import { erzeugeDemo } from './demo.js';
import { VERSION } from './version.js';

const params = new URLSearchParams(location.search);
if (params.has('reset')) loeschen();

let S = laden();
if (params.has('demo')) { S = erzeugeDemo(tagKey()); speichern(S); }
// ?demo und ?reset nur einmal ausführen: aus der Adresse entfernen, damit Neuladen nichts überschreibt
if (params.has('demo') || params.has('reset')) {
  params.delete('demo'); params.delete('reset');
  history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash);
}

const ui = {
  ansicht: 'heute',
  tag: tagKey(),          // in „Heute“ angezeigter Tag (zum Nachtragen änderbar)
  zeitraum: 90,           // Verlauf: 30 | 90 | 0 (= alles)
  verlaufTab: 'gewicht',  // Verlauf: 'gewicht' | 'woche'
  trainingWahl: {},       // Training: gewählte Einheit/Ort vor dem Start
};

const haupt = document.getElementById('haupt');
const nav = document.getElementById('nav');

/* ---------- Zustand ändern ---------- */

function aendern(fn, { neuZeichnen = true } = {}) {
  fn(S);
  aufraeumen();
  if (!speichern(S)) toast('Speichern hat nicht geklappt. Ist der private Modus an?');
  if (neuZeichnen) zeichnen();
}

/** Leere Felder und leere Tage entfernen, damit die Daten schlank bleiben. */
function aufraeumen() {
  for (const [tag, e] of Object.entries(S.eintraege)) {
    if (e.form) {
      if (!e.form.beschwerden?.length) delete e.form.beschwerden;
      if (!e.form.energie) delete e.form.energie;
      if (!Object.keys(e.form).length) delete e.form;
    }
    for (const k of Object.keys(e)) if (e[k] === '' || e[k] === null || e[k] === undefined || e[k] === 0) delete e[k];
    if (Object.keys(e).length === 0) delete S.eintraege[tag];
  }
}

function eintrag(tag) {
  return S.eintraege[tag] || {};
}

function setzeWert(tag, feld, wert) {
  aendern(z => { z.eintraege[tag] = { ...(z.eintraege[tag] || {}), [feld]: wert }; });
}

/* ---------- Abgeleitete Werte ---------- */

function gewichtsReihe() {
  const punkte = Object.entries(S.eintraege)
    .filter(([, e]) => Number.isFinite(e.gewicht))
    .map(([tag, e]) => ({ tag, wert: e.gewicht }));
  // Startgewicht aus dem Profil zählt als erste Messung, falls am Starttag nichts eingetragen ist
  if (S.profil && !punkte.some(p => p.tag === S.profil.startdatum)) {
    punkte.push({ tag: S.profil.startdatum, wert: S.profil.startgewicht });
  }
  return trendlinie(punkte);
}

function bauchReihe() {
  return trendlinie(Object.entries(S.eintraege)
    .filter(([, e]) => Number.isFinite(e.bauch))
    .map(([tag, e]) => ({ tag, wert: e.bauch })), 0.2);
}

function aktuellesGewicht() {
  const r = gewichtsReihe();
  return r.length ? r[r.length - 1].trend : S.profil.startgewicht;
}

/* ---------- Pille & Tagesform ---------- */

function pille(tag) {
  return pillenInfo(S.zyklus, tag);
}

/** Tagesstufe (normal | sanft | ruhe) aus Tagesform und Pillenpause. */
function stufeFuer(tag) {
  return tagesStufe(S.eintraege[tag]?.form, pille(tag));
}

function bausteine() {
  return meineBausteine(S.bausteine);
}
function zieleTag(tag) {
  return zieleFuer(stufeFuer(tag).stufe, Object.fromEntries(bausteine().map(b => [b.id, b.ziel])));
}

/** Wohlfühl-Rezepte an Pausentagen und an Tagen mit Beschwerden. */
function istWohlTag(tag) {
  return stufeFuer(tag).stufe !== 'normal' || (S.eintraege[tag]?.form?.beschwerden || []).includes('heisshunger');
}

function setzeForm(tag, fn) {
  aendern(z => {
    const e = z.eintraege[tag] = { ...(z.eintraege[tag] || {}) };
    e.form = { beschwerden: [], ...(e.form || {}) };
    e.form.beschwerden = [...(e.form.beschwerden || [])];
    fn(e.form);
  });
}

/** Tage am Stück mit irgendeinem Eintrag (bis heute; ist heute noch leer, zählt bis gestern). */
function serie() {
  let tag = tagKey();
  if (!S.eintraege[tag]) tag = plusTage(tag, -1);
  let n = 0;
  while (S.eintraege[tag]) { n++; tag = plusTage(tag, -1); }
  return n;
}

/* ---------- Health-Übernahme (Kurzbefehl) ---------- */

function healthAnwenden(text) {
  const r = leseHealthText(text);
  if (!r) { toast('Keine Hosenbund-Daten gefunden. Erst den Kurzbefehl ausführen.'); return false; }
  if (!Object.keys(r.werte).length) { toast('Der Kurzbefehl hat heute noch keine Werte geliefert.'); return false; }
  const tag = r.datum || tagKey();
  aendern(z => { z.eintraege[tag] = uebernehmen(z.eintraege[tag] || {}, r.werte); });
  toast(`Aus Health: ${beschreibe(r.werte)}`);
  return true;
}

async function ausZwischenablage() {
  let text = null;
  try { text = await navigator.clipboard.readText(); } catch { /* nicht erlaubt → Einfügefeld */ }
  if (text === null) text = prompt('Füge hier den Text aus dem Kurzbefehl ein:');
  if (text) healthAnwenden(text);
}

function istIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function istInstalliert() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}
function merker(name, wert) {
  try { if (wert === undefined) return localStorage.getItem(name); localStorage.setItem(name, wert); } catch { return null; }
  return null;
}

/* ---------- Navigation ---------- */

const ANSICHTEN = [
  { id: 'heute',   label: 'Heute' },
  { id: 'verlauf', label: 'Verlauf' },
  { id: 'training', label: 'Training' },
  { id: 'rezepte',  label: 'Rezepte' },
  { id: 'ich',     label: 'Ich' },
];

function zeichneNav() {
  if (!S.profil) { nav.hidden = true; return; }
  nav.hidden = false;
  fill(nav, ANSICHTEN.map(a => h('button', {
    class: 'nav-knopf' + (ui.ansicht === a.id ? ' aktiv' : ''),
    'aria-current': ui.ansicht === a.id ? 'page' : null,
    'data-ansicht': a.id,
    onclick: () => {
      if (a.id === 'heute') { ui.tag = tagKey(); ui.essenDialog = null; ui.essenWahl = null; }   // „Heute“ heißt immer heute, auch nach dem Nachtragen
      if (a.id === 'rezepte') ui.rezept = null;  // Tab-Tipp führt aus einem Rezept zurück zur Übersicht
      if (location.hash === `#${a.id}`) zeichnen(); else location.hash = a.id;
    },
  }, h('span', { class: `nav-icon ic-${a.id}`, 'aria-hidden': 'true', html: ICONS[a.id] }), h('span', {}, a.label))));
}

window.addEventListener('hashchange', () => {
  let id = location.hash.slice(1);
  if (id.startsWith('health=')) { healthAusAdresse(id); return; }
  if (id === 'woche') { id = 'verlauf'; ui.verlaufTab = 'woche'; }   // alte Adresse aus Phase 0
  if (ANSICHTEN.some(a => a.id === id)) { ui.ansicht = id; zeichnen(); window.scrollTo(0, 0); }
});

function zeichnen() {
  zeichneNav();
  if (!S.profil) return fill(haupt, ansichtStart());
  const ansicht = { heute: ansichtHeute, verlauf: ansichtVerlauf, training: () => ansichtTraining(kontext()), rezepte: () => ansichtRezepte(kontext()), ich: ansichtIch }[ui.ansicht];
  fill(haupt, ansicht());
  // Diagramme brauchen die echte Breite, daher erst nach dem Einhängen zeichnen
  haupt.querySelectorAll('[data-chart]').forEach(box => box._zeichne?.());
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  // Nur neu zeichnen, wenn sich die Breite wirklich ändert (iOS meldet „resize“ auch beim Scrollen)
  resizeTimer = setTimeout(() => haupt.querySelectorAll('[data-chart]').forEach(box => {
    if (box.clientWidth !== box._breite) box._zeichne?.();
  }), 150);
});

/** Was ausgelagerte Ansichten (training-ansicht.js …) brauchen. */
function einheitName(id) {
  return einheitenAlle(S.training)[id]?.name || 'Training';
}

function kontext() {
  return { S, ui, aendern, zeichnen, karte, kachel, feld, zahl, komma, stufe: stufeFuer, istWohlTag, pille, einheiten: () => einheitenAlle(S.training) };
}

/* ---------- Bausteine der Oberfläche ---------- */

function karte(titel, ...inhalt) {
  return h('section', { class: 'karte' }, titel ? h('h2', {}, titel) : null, ...inhalt);
}

function feld(label, input, hinweis) {
  return h('label', { class: 'feld' }, h('span', { class: 'feld-label' }, label), input, hinweis ? h('small', {}, hinweis) : null);
}

function zahl(str) {
  const n = parseFloat(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Zahl für ein Eingabefeld mit deutschem Komma (leer bei fehlendem Wert). */
function komma(wert) {
  return Number.isFinite(wert) ? String(wert).replace('.', ',') : '';
}

function kachel(label, wert, zusatz) {
  return h('div', { class: 'kachel' },
    h('div', { class: 'kachel-label' }, label),
    h('div', { class: 'kachel-wert' }, wert),
    zusatz ? h('div', { class: 'kachel-zusatz' }, zusatz) : null);
}

/* ---------- Ansicht: Start (Profil anlegen) ---------- */

function ansichtStart() {
  const f = {
    name: h('input', { type: 'text', autocomplete: 'given-name', placeholder: 'optional' }),
    groesse: h('input', { type: 'number', inputmode: 'numeric', min: 130, max: 220, placeholder: 'z. B. 168', required: true }),
    geburtsjahr: h('input', { type: 'number', inputmode: 'numeric', min: 1930, max: new Date().getFullYear() - 14, placeholder: 'z. B. 1996', required: true }),
    gewicht: h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.1, min: 35, max: 250, placeholder: 'z. B. 66,5', required: true }),
    ziel: h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.1, min: 35, max: 250, placeholder: 'z. B. 62,5', required: true }),
    aktivitaet: h('select', {}, Object.entries(AKTIVITAET).map(([id, a]) => h('option', { value: id }, a.label))),
    bauch: h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.5, min: 40, max: 200, placeholder: 'optional, in cm' }),
  };
  const vorschau = h('div', { class: 'vorschau', 'aria-live': 'polite' });

  const lese = () => ({
    name: f.name.value.trim(),
    groesse: zahl(f.groesse.value), geburtsjahr: zahl(f.geburtsjahr.value),
    gewicht: zahl(f.gewicht.value), ziel: zahl(f.ziel.value),
    aktivitaet: f.aktivitaet.value, bauch: zahl(f.bauch.value),
  });

  const pruefe = d => {
    if (!d.groesse || !d.geburtsjahr || !d.gewicht || !d.ziel) return 'Bitte Größe, Geburtsjahr, Gewicht und Wunschgewicht ausfüllen.';
    if (d.ziel >= d.gewicht) return 'Das Wunschgewicht sollte unter deinem aktuellen Gewicht liegen.';
    const bmiZiel = d.ziel / (d.groesse / 100) ** 2;
    if (bmiZiel < 18.5) return `Das Wunschgewicht läge unter dem Normalgewicht (BMI ${kg(bmiZiel)}). Dabei hilft Hosenbund nicht. Magst du ein höheres Ziel wählen?`;
    return null;
  };

  const aktualisiere = () => {
    const d = lese();
    if (!d.groesse || !d.geburtsjahr || !d.gewicht || !d.ziel || d.ziel >= d.gewicht) { fill(vorschau); return; }
    const fehler = pruefe(d);
    if (fehler) { fill(vorschau, h('p', { class: 'warnung' }, fehler)); return; }
    const e = energie({ gewicht: d.gewicht, groesse: d.groesse, alter: alterAus(d.geburtsjahr), aktivitaet: d.aktivitaet });
    const dauer = realistischeDauer(d.gewicht, d.ziel);
    fill(vorschau,
      h('p', {}, `${kg(d.gewicht - d.ziel)} kg in ca. `, h('strong', {}, `${dauer.minWochen}–${dauer.maxWochen} Wochen`), '. Bedarf ca. ', h('strong', {}, `${e.bedarf} kcal`), ' am Tag.'));
  };
  const meldung = h('p', { class: 'warnung', hidden: true });
  Object.values(f).forEach(el => el.addEventListener('input', () => { meldung.hidden = true; aktualisiere(); }));
  const los = ev => {
    ev.preventDefault();
    const d = lese();
    const fehler = pruefe(d);
    if (fehler) { meldung.textContent = fehler; meldung.hidden = false; return; }
    const heute = tagKey();
    aendern(z => {
      z.profil = {
        name: d.name, groesse: d.groesse, geburtsjahr: d.geburtsjahr, startgewicht: d.gewicht,
        zielgewicht: d.ziel, aktivitaet: d.aktivitaet, startdatum: heute,
      };
      z.eintraege[heute] = { ...(z.eintraege[heute] || {}), gewicht: d.gewicht, ...(d.bauch ? { bauch: d.bauch } : {}) };
    }, { neuZeichnen: false });
    location.hash = 'heute';
    ui.ansicht = 'heute';
    zeichnen();
    toast('Los geht’s!');
  };

  return h('div', { class: 'start' },
    h('div', { class: 'start-kopf' },
      h('div', { class: 'logo', 'aria-hidden': 'true' }, h('img', { src: 'icons/icon.svg', alt: '' })),
      h('h1', {}, 'Hosenbund'),
      h('p', { class: 'unterzeile' }, 'Bausteine statt Kalorien. Alles bleibt auf deinem Gerät.')),
    karte('Erzähl kurz von dir',
      h('form', { class: 'formular', onsubmit: los, novalidate: true },
        feld('Vorname', f.name),
        h('div', { class: 'zweier' }, feld('Größe (cm)', f.groesse), feld('Geburtsjahr', f.geburtsjahr)),
        h('div', { class: 'zweier' }, feld('Gewicht heute (kg)', f.gewicht), feld('Wunschgewicht (kg)', f.ziel)),
        feld('Alltag', f.aktivitaet),
        feld('Bauchumfang (cm)', f.bauch, 'optional, auf Nabelhöhe'),
        vorschau, meldung,
        h('button', { class: 'knopf haupt-knopf', type: 'submit' }, 'Los geht’s'))));
}

/* ---------- Ansicht: Heute ---------- */

const TIPPS = [
  'Morgens vor dem Frühstück wiegen.',
  'Der Trend zählt, nicht der Tageswert.',
  'Eiweiß und Gemüse zuerst essen.',
  'Zuckergetränke machen nicht satt.',
  'Langsam essen. Satt wird man nach 20 Minuten.',
  'Wenig Schlaf macht Hunger.',
  'Treppe statt Aufzug.',
  'Genuss bewusst, nicht nebenbei.',
  'Kleinere Teller wirken.',
  'Wasser ist kein Fett.',
];

function ansichtHeute() {
  if (ui.essenDialog) return essenDialog(kontext());
  const tag = ui.tag, e = eintrag(tag), heute = tagKey();
  const istHeute = tag === heute;
  const ziele = zieleTag(tag);
  const stufe = stufeFuer(tag);
  const pi = pille(tag);
  const liste = bausteine();
  const punkte = tagesPunkte(e, ziele, liste);

  const tagWahl = h('div', { class: 'tagwahl' },
    h('button', { class: 'rund', 'aria-label': 'Vorheriger Tag', onclick: () => { ui.tag = plusTage(tag, -1); zeichnen(); } }, '‹'),
    h('div', { class: 'tagwahl-text' },
      h('h1', {}, istHeute ? (S.profil.name ? `Hallo ${S.profil.name}!` : 'Heute') : datumLang(tag)),
      h('div', { class: 'unterzeile' }, istHeute ? datumLang(tag) : h('button', { class: 'link', onclick: () => { ui.tag = heute; zeichnen(); } }, 'Zurück zu heute')),
      istHeute && serie() >= 2 ? h('div', { class: 'serie' }, ic('serie'), `${serie()} Tage am Stück`) : null),
    h('button', { class: 'rund', 'aria-label': 'Nächster Tag', disabled: istHeute, onclick: () => { ui.tag = plusTage(tag, 1); zeichnen(); } }, '›'));

  // Waage
  const gewicht = h('input', { id: 'eingabe-gewicht', type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.1, min: 30, max: 300,
    value: komma(e.gewicht), placeholder: kg(aktuellesGewicht()) });
  gewicht.addEventListener('change', () => {
    const w = zahl(gewicht.value);
    if (w !== null && (w < 30 || w > 300)) { toast('Der Wert sieht komisch aus. Tippfehler?'); return; }
    setzeWert(tag, 'gewicht', w);
    if (w !== null) toast('Gewicht gespeichert');
  });
  const bauch = h('input', { id: 'eingabe-bauch', type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.5, min: 40, max: 200, value: komma(e.bauch), placeholder: 'cm' });
  bauch.addEventListener('change', () => { setzeWert(tag, 'bauch', zahl(bauch.value)); if (zahl(bauch.value)) toast('Bauchumfang gespeichert'); });

  const reihe = gewichtsReihe();
  const vorher = reihe.filter(p => p.tag < tag).pop();
  const waage = karte('Waage',
    h('div', { class: 'zweier' },
      feld('Gewicht (kg)', gewicht),
      feld('Bauchumfang (cm)', bauch)),
    vorher && Number.isFinite(e.gewicht)
      ? h('p', { class: 'hinweis' }, schwankungsText(e.gewicht, vorher.trend, pi?.phase === 'pause' || (e.form?.beschwerden || []).includes('wasser')))
      : null);

  // Bausteine
  const bausteinKarte = karte(null,
    h('div', { class: 'karten-kopf' },
      h('h2', {}, 'Bausteine'),
      h('div', { class: 'punkte', 'aria-label': `${punkte} von ${liste.length} erfüllt` },
        liste.map((b, i) => h('span', { class: 'punkt-mini' + (i < punkte ? ' an' : '') })),
        h('span', { class: 'punkte-text' }, `${punkte}/${liste.length}`))),
    stufe.stufe !== 'normal' ? h('p', { class: 'angepasst' }, ic('wohl'), 'Ziele heute angepasst.') : null,
    h('ul', { class: 'bausteine' }, liste.map(b => bausteinZeile(tag, b, e[b.id], ziele[b.id]))),
    liste.length && punkte === liste.length ? h('p', { class: 'lob' }, ic('stern'), 'Alle geschafft. Stark!') : null);

  // Genuss
  const genuss = e.genuss || 0;
  const genussKarte = karte(null,
    h('div', { class: 'baustein genuss' },
      h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic(GENUSS.icon)),
      h('div', { class: 'b-text' },
        h('div', { class: 'b-label' }, GENUSS.label),
        h('small', {}, 'Ohne Wertung')),
      stepper(genuss, 1, 0, 20, w => setzeWert(tag, 'genuss', w), 'genuss')));

  // Notiz
  const notiz = h('textarea', { id: 'eingabe-notiz', rows: 2, placeholder: 'Wie war der Tag? Zyklus, Stress, Schlaf …' }, e.notiz || '');
  notiz.addEventListener('change', () => setzeWert(tag, 'notiz', notiz.value.trim()));

  const tipp = TIPPS[(tageZwischen('2026-01-01', tag) % TIPPS.length + TIPPS.length) % TIPPS.length];

  const homescreenTipp = istIOS() && !istInstalliert() && !merker('hb-tipp-homescreen')
    ? h('aside', { class: 'tipp mit-zu' },
        h('button', { class: 'zu', 'aria-label': 'Hinweis schließen', onclick: () => { merker('hb-tipp-homescreen', '1'); zeichnen(); } }, '×'),
        h('strong', {}, 'Als App installieren: '), ic('teilen'), ' Teilen → „Zum Home-Bildschirm“')
    : null;

  const healthKnopf = istHeute
    ? h('button', { class: 'knopf health-knopf', onclick: ausZwischenablage }, ic('health'), 'Aus Health übernehmen')
    : null;

  const plan = S.plan || standardPlan();
  let trainingKarte = null;
  if (e.training?.fertig) {
    trainingKarte = h('a', { class: 'karte training-hinweis erledigt', href: '#training' }, ic('haken'), `${einheitenAlle(S.training)[e.training.einheit]?.name || e.training.name || 'Training'} erledigt`);
  } else if (istHeute && (istTrainingstag(plan, tag) || e.training)) {
    const einheit = e.training?.einheit || naechsteEinheit(S.eintraege, tag);
    trainingKarte = h('a', { class: 'karte training-hinweis', href: '#training' },
      h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic('training')),
      h('div', { class: 'b-text' },
        h('div', { class: 'b-label' }, e.training ? 'Training läuft' : 'Heute ist Trainingstag'),
        h('small', {}, `${einheitName(einheit)} · ${ORTE[e.training?.ort || plan.ort]} · ca. 45 Min.`)),
      h('span', { class: 'pfeil', 'aria-hidden': 'true' }, '›'));
  }

  const abend = abendFuer(tag, t => istTrainingstag(plan, t), { ...standardEssen(), ...(S.essen || {}) }.wahl, istWohlTag);
  const abendKarte = h('button', { class: 'karte training-hinweis essen-hinweis', id: 'heute-abend', onclick: () => oeffneRezept(kontext(), abend.id) },
    h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic('essen')),
    h('div', { class: 'b-text' },
      h('div', { class: 'b-label' }, `${istHeute ? 'Heute' : 'An dem Tag'} Abend: ${abend.name}`),
      h('small', {}, `${abend.minuten} Min. · ca. ${abend.kcal} kcal · ${abend.eiweiss} g Eiweiß`)),
    h('span', { class: 'pfeil', 'aria-hidden': 'true' }, '›'));

  const heisshunger = (e.form?.beschwerden || []).includes('heisshunger');
  const snack = heisshunger ? h('button', { class: 'karte training-hinweis essen-hinweis', id: 'heisshunger-snack', onclick: () => oeffneRezept(kontext(), 'skyr-kakao') },
    h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic('genuss')),
    h('div', { class: 'b-text' },
      h('div', { class: 'b-label' }, 'Gegen Heißhunger: Schoko-Skyr'),
      h('small', {}, `2 Min. · ca. ${rezept('skyr-kakao').kcal} kcal · ${rezept('skyr-kakao').eiweiss} g Eiweiß `)),
    h('span', { class: 'pfeil', 'aria-hidden': 'true' }, '›')) : null;

  return h('div', { class: 'ansicht' },
    tagWahl, homescreenTipp, zyklusEinrichtung(), tagesformKarte(tag, e, stufe, pi), healthKnopf, trainingKarte, waage, bausteinKarte, essenKarte(kontext(), tag, { gewicht: aktuellesGewicht() }), abendKarte, snack, genussKarte,
    karte('Notiz', notiz),
    h('aside', { class: 'tipp' }, h('strong', {}, 'Tipp: '), tipp));
}

function tagesformKarte(tag, e, stufe, pi) {
  const form = e.form || {};
  const b = form.beschwerden || [];
  const texte = stufenText(stufe.stufe, form);
  const pillenChip = pi ? h('span', { class: 'pillen-chip' + (pi.phase === 'pause' ? ' pause' : ''), id: 'pillen-chip' },
    ic('pille'), pi.phase === 'pause' ? `Pause · Tag ${pi.pausenTag}/${pi.pauseLaenge}` : `Pille · Tag ${pi.einnahmeTag}/${pi.einnahmeLaenge}`) : null;
  return h('section', { class: 'karte tagesform', id: 'tagesform' },
    h('div', { class: 'karten-kopf' }, h('h2', {}, 'Wie geht’s dir heute?'), pillenChip),
    pi?.neuePackungHeute ? h('p', { class: 'angepasst' }, ic('pille'), 'Heute neue Packung.') : null,
    h('div', { class: 'energie', role: 'group', 'aria-label': 'Energie' }, ENERGIE.map(x => h('button', {
      class: 'energie-knopf' + (form.energie === x.wert ? ' an' : ''), 'aria-pressed': String(form.energie === x.wert), 'data-energie': x.wert,
      onclick: () => setzeForm(tag, f => { f.energie = f.energie === x.wert ? null : x.wert; }),
    }, ic(x.icon, 'energie-icon'), x.label))),
    h('div', { class: 'beschwerden', role: 'group', 'aria-label': 'Beschwerden' }, BESCHWERDEN.map(x => {
      const an = b.includes(x.id);
      return h('button', { class: 'chip klein-chip' + (an ? ' an' : ''), 'aria-pressed': String(an), 'data-beschwerde': x.id,
        onclick: () => setzeForm(tag, f => { f.beschwerden = an ? f.beschwerden.filter(y => y !== x.id) : [...f.beschwerden, x.id]; }),
      }, ic(x.icon), x.label);
    })),
    stufe.stufe !== 'normal' || texte.length
      ? h('div', { class: 'stufe stufe-' + stufe.stufe, id: 'tagesstufe' },
          stufe.stufe !== 'normal' ? h('strong', {}, stufe.stufe === 'ruhe' ? 'Ruhetag' : 'Sanfter Tag') : null,
          texte.map(x => h('p', {}, x)))
      : null);
}

function zyklusEinrichtung() {
  if (S.zyklus || merker('hb-tipp-zyklus')) return null;
  const datum = h('input', { type: 'date', id: 'packung-start', max: tagKey(), value: '' });
  return h('aside', { class: 'tipp mit-zu', id: 'zyklus-einrichten' },
    h('button', { class: 'zu', 'aria-label': 'Hinweis schließen', onclick: () => { merker('hb-tipp-zyklus', '1'); zeichnen(); } }, '×'),
    h('strong', {}, ic('pille'), ' Pillenpause einplanen? '), 'Start der aktuellen Packung:',
    h('div', { class: 'zeile' }, datum,
      h('button', { class: 'knopf', id: 'zyklus-speichern', onclick: () => {
        if (!datum.value) { toast('Bitte ein Datum wählen'); return; }
        aendern(z => { z.zyklus = { modus: 'pille-21-7', packungStart: datum.value }; });
        toast('Gespeichert');
      } }, 'Speichern')));
}

function schwankungsText(heute, trendVorher, wasserZeit = false) {
  const d = heute - trendVorher;
  if (Math.abs(d) < 0.3) return 'Im Trend.';
  if (d > 0 && wasserZeit) return `${kg(d)} kg über dem Trend. Pause = Wasser, geht wieder weg.`;
  if (d > 0) return `${kg(d)} kg über dem Trend. Meist nur Wasser.`;
  return `${kg(-d)} kg unter dem Trend.`;
}

function bausteinZeile(tag, b, wert, ziel = b.ziel) {
  const erfuellt = bausteinErfuellt(b, wert, ziel);
  let steuerung;
  if (b.typ === 'janein') {
    steuerung = h('button', {
      class: 'haken' + (erfuellt ? ' an' : ''), role: 'switch', 'aria-checked': String(erfuellt), 'aria-label': b.label,
      'data-baustein': b.id,
      onclick: () => setzeWert(tag, b.id, erfuellt ? null : 1),
    }, erfuellt ? ic('haken') : '');
  } else if (b.id === 'schritte') {
    const inp = h('input', { type: 'number', inputmode: 'numeric', class: 'klein', min: 0, max: b.max, step: 100, value: wert ?? '', placeholder: '0', 'aria-label': 'Schritte', 'data-baustein': b.id });
    inp.addEventListener('change', () => setzeWert(tag, b.id, zahl(inp.value)));
    steuerung = inp;
  } else {
    steuerung = stepper(wert || 0, b.schritt, 0, b.max, w => setzeWert(tag, b.id, w), b.id);
  }
  return h('li', { class: 'baustein' + (erfuellt ? ' erfuellt' : '') },
    h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic(b.icon)),
    h('div', { class: 'b-text' },
      h('div', { class: 'b-label' }, b.label),
      h('small', {}, b.typ === 'janein' ? b.tipp : `Ziel: ${ziel.toLocaleString('de-DE')} ${b.einheit}${ziel !== b.ziel ? ' (heute angepasst)' : ''}`.trim())),
    steuerung);
}

function stepper(wert, schritt, min, max, setze, id) {
  return h('div', { class: 'stepper', 'data-baustein': id },
    h('button', { class: 'rund klein', 'aria-label': 'weniger', disabled: wert <= min, onclick: () => setze(Math.max(min, wert - schritt)) }, '−'),
    h('output', { 'aria-live': 'polite' }, String(wert)),
    h('button', { class: 'rund klein', 'aria-label': 'mehr', disabled: wert >= max, onclick: () => setze(Math.min(max, wert + schritt)) }, '+'));
}

/* ---------- Ansicht: Verlauf ---------- */

function verlaufSegment() {
  return h('div', { class: 'segment gross', role: 'group', 'aria-label': 'Ansicht', 'data-segment': 'verlauf' },
    [['gewicht', 'Gewicht'], ['woche', 'Woche'], ['zyklus', 'Zyklus']].map(([id, l]) => h('button', {
      class: ui.verlaufTab === id ? 'an' : null, 'aria-pressed': String(ui.verlaufTab === id), 'data-wert': id,
      onclick: () => { ui.verlaufTab = id; zeichnen(); },
    }, l)));
}

function ansichtVerlauf() {
  if (ui.verlaufTab === 'woche') return ansichtWoche();
  if (ui.verlaufTab === 'zyklus') {
    const trend = new Map(gewichtsReihe().map(q => [q.tag, q.trend]));
    return h('div', { class: 'ansicht' }, h('h1', {}, 'Verlauf'), verlaufSegment(),
      ansichtZyklus(kontext(), { pille, eintrag, trend, punkte: t => tagesPunkte(eintrag(t), zieleTag(t), bausteine()) }));
  }
  const p = S.profil, heute = tagKey();
  const reihe = gewichtsReihe();
  const trend = reihe.length ? reihe[reihe.length - 1].trend : p.startgewicht;
  const tempo = tempoProWoche(reihe);
  const prog = prognose(trend, p.zielgewicht, tempo, heute);
  const seitStart = trend - p.startgewicht;
  const nochBis = trend - p.zielgewicht;

  const progText = prog.status === 'erreicht' ? 'Ziel erreicht'
    : prog.status === 'unterwegs' ? `ca. ${datumKurz(prog.tag)}`
    : 'braucht noch Daten';
  const tempoText = tempo === null ? '–' : `${tempo > 0 ? '+' : tempo < 0 ? '−' : '±'}${kg(Math.abs(tempo), 2)} kg`;

  const kacheln = h('div', { class: 'kacheln' },
    kachel('Trend heute', `${kg(trend)} kg`, Math.abs(seitStart) < 0.05 ? 'wie zum Start' : `${seitStart < 0 ? '−' : '+'}${kg(Math.abs(seitStart))} kg seit Start`),
    kachel('Noch bis zum Ziel', nochBis > 0 ? `${kg(nochBis)} kg` : 'geschafft', `Ziel ${kg(p.zielgewicht)} kg`),
    kachel('Tempo pro Woche', tempoText, tempo !== null && tempo < -1 ? 'sehr schnell, lieber etwas sanfter' : 'gesund: 0,25–0,5 kg'),
    kachel('Ziel erreicht', progText, prog.status === 'unterwegs' ? `in etwa ${kg(prog.wochen)} Wochen` : null));

  const ab = ui.zeitraum ? plusTage(heute, -ui.zeitraum) : '0000-00-00';
  const sichtbar = reihe.filter(q => q.tag >= ab);

  const zeitraum = h('div', { class: 'chips', role: 'group', 'aria-label': 'Zeitraum' },
    [[30, '30 Tage'], [90, '90 Tage'], [0, 'Alles']].map(([n, l]) => h('button', {
      class: 'chip' + (ui.zeitraum === n ? ' an' : ''), 'aria-pressed': String(ui.zeitraum === n),
      onclick: () => { ui.zeitraum = n; zeichnen(); },
    }, l)));

  // Pillenpausen im sichtbaren Zeitraum als Bänder
  const baender = [];
  if (S.zyklus?.modus && S.zyklus.modus !== 'aus' && sichtbar.length) {
    for (let t = sichtbar[0].tag; t <= heute; t = plusTage(t, 1)) {
      if (pille(t)?.phase !== 'pause') continue;
      const letztes = baender[baender.length - 1];
      if (letztes && plusTage(letztes.bis, 1) === t) letztes.bis = t; else baender.push({ von: t, bis: t });
    }
  }
  const gewichtBox = h('div', { 'data-chart': 'gewicht' });
  gewichtBox._zeichne = () => zeichneVerlauf(gewichtBox, sichtbar, { ziel: p.zielgewicht, einheit: 'kg', trendName: 'Trend', wertName: 'Gewogen', baender });

  const bauch = bauchReihe().filter(q => q.tag >= ab);
  const bauchBox = h('div', { 'data-chart': 'bauch' });
  bauchBox._zeichne = () => zeichneVerlauf(bauchBox, bauch, { einheit: 'cm', trendName: 'Trend', wertName: 'Gemessen' });

  return h('div', { class: 'ansicht' },
    h('h1', {}, 'Verlauf'),
    verlaufSegment(),
    kacheln,
    zeitraum,
    karte('Gewicht',
      h('p', { class: 'legende' }, h('span', { class: 'key punkt' }), 'gewogen', h('span', { class: 'key linie' }), 'Trend (geglättet)',
        baender.length ? [h('span', { class: 'key band-key' }), 'Pillenpause'] : null),
      gewichtBox,
      tabelle(sichtbar, 'kg')),
    bauch.length
      ? karte('Bauchumfang', h('p', { class: 'legende' }, h('span', { class: 'key punkt' }), 'gemessen', h('span', { class: 'key linie' }), 'Trend'), bauchBox, tabelle(bauch, 'cm'))
      : karte('Bauchumfang', h('p', { class: 'hinweis' }, 'Noch keine Messung.')),
    h('details', { class: 'karte info' },
      h('summary', {}, 'Warum ein Trend statt des Tageswerts?'),
      h('p', {}, 'Das Gewicht schwankt täglich um 1–2 kg durch Wasser. Der Trend glättet das.')));
}

function tabelle(reihe, einheit) {
  if (!reihe.length) return null;
  return h('details', { class: 'tabelle' },
    h('summary', {}, 'Als Tabelle'),
    h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Datum'), h('th', {}, `Gemessen (${einheit})`), h('th', {}, `Trend (${einheit})`))),
      h('tbody', {}, [...reihe].reverse().map(q => h('tr', {}, h('td', {}, datumKurz(q.tag)), h('td', {}, kg(q.wert)), h('td', {}, kg(q.trend)))))));
}

/* ---------- Ansicht: Woche ---------- */

function ansichtWoche() {
  const heute = tagKey();
  const tage = letzteTage(heute, 7);
  const vorwoche = letzteTage(plusTage(heute, -7), 7);
  const liste = bausteine();
  const summe = ts => ts.reduce((s, t) => s + tagesPunkte(eintrag(t), zieleTag(t), liste), 0);
  const diese = summe(tage), letzte = summe(vorwoche), max = 7 * liste.length;
  const genuss = tage.reduce((s, t) => s + (eintrag(t).genuss || 0), 0);

  const wochentag = t => keyZuDatum(t).toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');

  const raster = h('div', { class: 'raster-scroll' }, h('table', { class: 'raster' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Baustein')),
      tage.map(t => h('th', { scope: 'col', class: t === heute ? 'heute' : null },
        h('button', { class: 'link', title: datumLang(t), onclick: () => { ui.tag = t; location.hash = 'heute'; } }, wochentag(t)))))),
    h('tbody', {},
      liste.map(b => h('tr', {},
        h('th', { scope: 'row' }, ic(b.icon), b.label),
        tage.map(t => {
          const an = bausteinErfuellt(b, eintrag(t)[b.id], zieleTag(t)[b.id]);
          return h('td', {}, h('span', { class: 'kreis' + (an ? ' an' : ''), role: 'img', 'aria-label': an ? 'geschafft' : 'nicht geschafft' }));
        }))),
      h('tr', { class: 'summe' }, h('th', { scope: 'row' }, 'Bausteine'), tage.map(t => h('td', {}, String(tagesPunkte(eintrag(t), zieleTag(t), liste))))),
      S.zyklus?.modus && S.zyklus.modus !== 'aus' ? h('tr', {}, h('th', { scope: 'row' }, ic('pille'), 'Pillenpause'), tage.map(t => h('td', { class: 'leise' }, pille(t)?.phase === 'pause' ? '●' : '·'))) : null,
      tage.some(t => eintrag(t).gegessen?.length) ? h('tr', {}, h('th', { scope: 'row' }, ic('kcal'), 'kcal'), tage.map(t => h('td', { class: 'leise' }, eintrag(t).gegessen?.length ? String(essenSumme(eintrag(t).gegessen).kcal) : '·'))) : null,
      h('tr', {}, h('th', { scope: 'row' }, ic(GENUSS.icon), GENUSS.label), tage.map(t => h('td', { class: 'leise' }, String(eintrag(t).genuss || '·')))))));

  let vergleich;
  if (letzte === 0) vergleich = 'Vergleich ab nächster Woche';
  else if (diese > letzte) vergleich = `${diese - letzte} mehr als letzte Woche`;
  else if (diese === letzte) vergleich = 'wie letzte Woche';
  else vergleich = `${letzte - diese} weniger als letzte Woche`;

  // Welcher Baustein klappt am wenigsten? → sanfter Fokus-Vorschlag
  const schwach = liste.filter(b => b.tipp).map(b => ({ b, n: tage.filter(t => bausteinErfuellt(b, eintrag(t)[b.id], zieleTag(t)[b.id])).length })).sort((a, c) => a.n - c.n)[0];

  return h('div', { class: 'ansicht' },
    h('h1', {}, 'Verlauf'),
    verlaufSegment(),
    h('div', { class: 'kacheln' },
      kachel('Bausteine (7 Tage)', `${diese} von ${max}`, vergleich),
      kachel('Genuss-Momente', String(genuss), 'ohne Wertung')),
    karte('Letzte 7 Tage', raster),
    schwach && schwach.n < 5
      ? h('aside', { class: 'tipp' }, ic(schwach.b.icon), h('strong', {}, `Fokus: ${schwach.b.label}. `), schwach.b.tipp)
      : null);
}

/* ---------- Ansicht: Ich ---------- */

function ansichtIch() {
  const p = S.profil;
  const aktuell = aktuellesGewicht();
  const e = energie({ gewicht: aktuell, groesse: p.groesse, alter: alterAus(p.geburtsjahr), aktivitaet: p.aktivitaet });
  const bmi = aktuell / (p.groesse / 100) ** 2;

  const ziel = h('input', { id: 'eingabe-ziel', type: 'text', inputmode: 'decimal', autocomplete: 'off', step: 0.1, value: komma(p.zielgewicht) });
  ziel.addEventListener('change', () => {
    const w = zahl(ziel.value);
    if (!w || w / (p.groesse / 100) ** 2 < 18.5) { toast('Das Ziel läge unter dem Normalgewicht.'); ziel.value = komma(p.zielgewicht); return; }
    aendern(z => { z.profil.zielgewicht = w; }); toast('Ziel gespeichert');
  });
  const akt = h('select', {}, Object.entries(AKTIVITAET).map(([id, a]) => h('option', { value: id, selected: id === p.aktivitaet }, a.label)));
  akt.addEventListener('change', () => aendern(z => { z.profil.aktivitaet = akt.value; }));
  const name = h('input', { type: 'text', value: p.name || '' });

  // Größe und Geburtsjahr fließen in BMI und Kalorienbedarf ein
  const groesse = h('input', { id: 'eingabe-groesse', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: p.groesse });
  groesse.addEventListener('change', () => {
    const cm = Math.round(zahl(groesse.value) ?? NaN);
    if (!(cm >= 130 && cm <= 220)) { toast('Bitte eine Größe zwischen 130 und 220 cm eingeben.'); groesse.value = p.groesse; return; }
    aendern(z => { z.profil.groesse = cm; });
    const bmiZiel = p.zielgewicht / (cm / 100) ** 2;
    toast(bmiZiel < 18.5 ? 'Größe gespeichert. Dein Wunschgewicht läge jetzt unter dem Normalgewicht, bitte anpassen.' : 'Größe gespeichert');
  });
  const geburtsjahr = h('input', { id: 'eingabe-geburtsjahr', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: p.geburtsjahr });
  geburtsjahr.addEventListener('change', () => {
    const j = Math.round(zahl(geburtsjahr.value) ?? NaN), jetzt = new Date().getFullYear();
    if (!(j >= 1930 && j <= jetzt - 14)) { toast('Das Geburtsjahr sieht nicht richtig aus.'); geburtsjahr.value = p.geburtsjahr; return; }
    aendern(z => { z.profil.geburtsjahr = j; });
    toast('Geburtsjahr gespeichert');
  });
  name.addEventListener('change', () => aendern(z => { z.profil.name = name.value.trim(); }));

  const dateiwahl = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  dateiwahl.addEventListener('change', async () => {
    const datei = dateiwahl.files[0];
    if (!datei) return;
    try {
      const neu = await importieren(datei);
      if (!confirm(`Sicherung mit ${Object.keys(neu.eintraege).length} Tagen laden? Deine aktuellen Daten werden ersetzt.`)) return;
      S = neu; speichern(S); zeichnen(); toast('Sicherung geladen');
    } catch (err) { toast(err.message || 'Datei konnte nicht gelesen werden.'); }
  });

  return h('div', { class: 'ansicht' },
    h('h1', {}, 'Ich'),
    karte('Profil',
      feld('Vorname', name),
      h('div', { class: 'zweier' }, feld('Größe (cm)', groesse), feld('Geburtsjahr', geburtsjahr)),
      feld('Wunschgewicht (kg)', ziel),
      feld('Alltag', akt),
      h('p', { class: 'hinweis' }, `Gestartet am ${datumLang(p.startdatum)} mit ${kg(p.startgewicht)} kg.`)),
    bausteineKarte(),
    zyklusKarte(),
    karte('Health & Erinnerung', anleitungIPhone()),
    karte('Energie zur Orientierung',
      h('div', { class: 'kacheln drei' },
        kachel('Grundumsatz', `${e.grundumsatz} kcal`, 'in völliger Ruhe'),
        kachel('Tagesbedarf', `${e.bedarf} kcal`, 'mit deinem Alltag'),
        kachel('Sanft abnehmen', `≈ ${e.ziel} kcal`, e.bedarf - e.ziel < 380
          ? 'untere Grenze'
          : `etwa ${Math.round((e.bedarf - e.ziel) / 10) * 10} kcal weniger`)),
      h('p', { class: 'hinweis' }, `BMI ${kg(bmi)} · Schätzwerte, zählen musst du nichts.`)),
    karte('Deine Daten',
      h('p', { class: 'hinweis' }, 'Nur auf diesem Gerät gespeichert.'),
      h('div', { class: 'knopfreihe' },
        h('button', { class: 'knopf', onclick: () => exportieren(S) }, 'Sicherung speichern'),
        h('button', { class: 'knopf', onclick: () => dateiwahl.click() }, 'Sicherung laden'),
        h('button', { class: 'knopf gefahr', onclick: () => {
          if (confirm('Wirklich alle Daten löschen? Das lässt sich nicht rückgängig machen.')) { S = leererZustand(); loeschen(); location.hash = ''; zeichnen(); }
        } }, 'Alles löschen')),
      dateiwahl),
    h('p', { class: 'fuss' }, `Hosenbund ${VERSION}`));
}

function bausteineKarte() {
  const einst = S.bausteine || { ziele: {}, aus: [], eigene: [] };
  const setze = fn => aendern(z => { z.bausteine ||= { ziele: {}, aus: [], eigene: [] }; fn(z.bausteine); });

  const standard = BAUSTEINE.map(b => {
    const an = !einst.aus.includes(b.id);
    let ziel = null;
    if (b.typ !== 'janein' && an) {
      const inp = h('input', { type: 'text', inputmode: 'numeric', class: 'klein', 'data-ziel': b.id, value: einst.ziele[b.id] ?? b.ziel, 'aria-label': `Ziel ${b.label}` });
      inp.addEventListener('change', () => {
        const w = Math.round(zahl(inp.value) ?? NaN);
        if (!(w >= 1 && w <= b.max)) { toast(`Bitte 1 bis ${b.max.toLocaleString('de-DE')}`); inp.value = einst.ziele[b.id] ?? b.ziel; return; }
        setze(x => { if (w === b.ziel) delete x.ziele[b.id]; else x.ziele[b.id] = w; });
        toast('Ziel gespeichert');
      });
      ziel = inp;
    }
    return h('li', { class: 'baustein' + (an ? '' : ' aus') },
      h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic(b.icon)),
      h('div', { class: 'b-text' }, h('div', { class: 'b-label' }, b.label), b.einheit && an && ziel ? h('small', {}, b.einheit) : null),
      ziel,
      h('button', { class: 'haken' + (an ? ' an' : ''), role: 'switch', 'aria-checked': String(an), 'aria-label': `${b.label} anzeigen`, 'data-baustein-an': b.id,
        onclick: () => setze(x => { x.aus = an ? [...x.aus, b.id] : x.aus.filter(i => i !== b.id); }) }, an ? ic('haken') : ''));
  });

  const eigene = einst.eigene.map(x => h('li', { class: 'baustein' },
    h('span', { class: 'b-icon', 'aria-hidden': 'true' }, ic('stern')),
    h('div', { class: 'b-text' }, h('div', { class: 'b-label' }, x.label), h('small', {}, x.typ === 'zaehler' ? `Ziel: ${x.ziel}` : 'Abhaken')),
    h('button', { class: 'rund klein', 'aria-label': `${x.label} löschen`, 'data-eigen-weg': x.id,
      onclick: () => { if (confirm(`„${x.label}“ löschen?`)) setze(b => { b.eigene = b.eigene.filter(y => y.id !== x.id); }); } }, '×')));

  const name = h('input', { type: 'text', id: 'eigener-name', maxlength: 30, placeholder: 'z. B. Vitamine, Dehnen, Obst' });
  const typ = h('select', { id: 'eigener-typ' }, h('option', { value: 'janein' }, 'Abhaken'), h('option', { value: 'zaehler' }, 'Zählen'));
  const ziel = h('input', { type: 'text', inputmode: 'numeric', id: 'eigener-ziel', value: '3', 'aria-label': 'Ziel' });
  const zielFeld = feld('Ziel', ziel);
  zielFeld.hidden = true;
  typ.addEventListener('change', () => { zielFeld.hidden = typ.value !== 'zaehler'; });
  const dazu = () => {
    const label = name.value.trim();
    if (!label) { toast('Bitte einen Namen eingeben'); return; }
    if (einst.eigene.length >= 10) { toast('Höchstens 10 eigene Bausteine'); return; }
    const w = Math.round(zahl(ziel.value) ?? NaN);
    if (typ.value === 'zaehler' && !(w >= 1 && w <= 50)) { toast('Ziel: 1 bis 50'); return; }
    setze(b => { b.eigene = [...b.eigene, { id: `e-${Date.now().toString(36)}`, label, typ: typ.value, ziel: typ.value === 'zaehler' ? w : 1 }]; });
    toast('Baustein hinzugefügt');
  };

  return karte('Meine Bausteine',
    h('ul', { class: 'bausteine einstellungen' }, standard, eigene),
    h('div', { class: 'formular eigener' },
      h('div', { class: 'zweier' }, feld('Eigener Baustein', name), feld('Art', typ)),
      zielFeld,
      h('button', { class: 'knopf', id: 'eigener-dazu', onclick: dazu }, '+ Hinzufügen')));
}

function zyklusKarte() {
  const z = S.zyklus || { modus: 'aus' };
  const modus = h('select', { id: 'zyklus-modus' },
    h('option', { value: 'aus', selected: z.modus === 'aus' }, 'Nicht berücksichtigen'),
    Object.entries(PILLEN_SCHEMATA).map(([id, s]) => h('option', { value: id, selected: z.modus === id }, s.label)));
  const start = h('input', { type: 'date', id: 'zyklus-start', value: z.packungStart || '', max: tagKey() });
  const speichern = () => aendern(x => {
    x.zyklus = modus.value === 'aus' ? { modus: 'aus' } : { modus: modus.value, packungStart: start.value || x.zyklus?.packungStart || tagKey() };
  });
  modus.addEventListener('change', speichern);
  start.addEventListener('change', speichern);
  const pi = pille(tagKey());
  return karte('Pille & Tagesform',
    h('div', { class: 'zweier' }, feld('Pille', modus), z.modus !== 'aus' ? feld('Packungsbeginn', start) : h('span')),
    pi ? h('p', { class: 'hinweis' }, pi.phase === 'pause'
      ? `Pause, Tag ${pi.pausenTag}/${pi.pauseLaenge} · neue Packung ${datumKurz(pi.naechstePackung)}`
      : `Pillentag ${pi.einnahmeTag}/${pi.einnahmeLaenge} · Pause ab ${datumKurz(pi.naechstePause)}`) : null,
    h('p', { class: 'hinweis' }, 'Pause und Tagesform machen Training, Ziele und Rezepte sanfter. Bei starken Beschwerden: Frauenärztin.'));
}

// Der Kurzbefehl „Hosenbund-Health“ wird einmalig über den Mac eingerichtet (tools/kurzbefehl.py, dann
// per iCloud oder AirDrop aufs iPhone). Ein Download-Knopf in der App klappt auf iOS nicht:
// Die Home-Bildschirm-App bleibt weiß, shortcuts://import-shortcut lehnt Direktlinks ab, und Safari tut nichts.
function anleitungIPhone() {
  const schritt = (...k) => h('li', {}, ...k);
  return [
    h('div', { class: 'schnellstart' },
      h('ol', {},
        schritt('In Kurzbefehle ', h('strong', {}, '„Hosenbund-Health“'), ' einmal antippen, Health ', h('strong', {}, 'erlauben'), '.'),
        schritt('Erinnerung: ', h('strong', {}, 'Automation'), ' → ', h('strong', {}, 'Tageszeit'), ' → „Sofort ausführen“ → Hosenbund-Health.'),
        schritt('Abends: ', h('strong', {}, '„Aus Health übernehmen“'), ' → „Einsetzen“.'),
        schritt('Morgens wiegen: ', h('strong', {}, 'Automation'), ' → Tageszeit 7:00 → Aktion ', h('strong', {}, '„Mitteilung anzeigen“'), ': „Wiegen“.'))),
    h('details', { class: 'anleitung' },
      h('summary', {}, 'Klappt nicht? Text einfügen'),
      (() => {
        const feld = h('textarea', { rows: 2, placeholder: 'hosenbund;schritte=8234;gewicht=64,2' });
        return h('div', { class: 'formular' }, feld, h('button', { class: 'knopf', onclick: () => { if (healthAnwenden(feld.value)) feld.value = ''; } }, 'Übernehmen'));
      })()),
  ];
}

/* ---------- Start ---------- */

const startHash = location.hash.slice(1);
if (startHash === 'woche' || startHash === 'zyklus') { ui.ansicht = 'verlauf'; ui.verlaufTab = startHash; }
if (ANSICHTEN.some(a => a.id === startHash)) ui.ansicht = startHash;
zeichnen();

// Übernahme über die Adresse: …/#health=hosenbund;schritte=…  (z. B. zum Testen in Safari)
function healthAusAdresse(hash) {
  if (S.profil) healthAnwenden(decodeURIComponent(hash.slice(7)));
  history.replaceState(null, '', location.pathname + location.search + '#heute');
  ui.ansicht = 'heute';
  ui.tag = tagKey();
  zeichnen();
}
if (startHash.startsWith('health=')) healthAusAdresse(startHash);

// Bleibt die App über Nacht offen (iPhone), beim Zurückkehren auf den neuen Tag springen
let heuteBeimZeichnen = tagKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const jetzt = tagKey();
  if (jetzt !== heuteBeimZeichnen) {
    if (ui.tag === heuteBeimZeichnen) ui.tag = jetzt;
    heuteBeimZeichnen = jetzt;
    zeichnen();
  }
});

// Offline-Fähigkeit und dauerhafter Speicher
if ('serviceWorker' in navigator && !params.has('nosw')) {
  const hatteSteuerung = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(reg => document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); }))
    .catch(e => console.warn('Service Worker nicht registriert', e));
  // Neue Version aktiv → einmal neu laden, damit sie sofort zu sehen ist (Daten liegen sicher in localStorage)
  let neuGeladen = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hatteSteuerung || neuGeladen) return;
    neuGeladen = true;
    location.reload();
  });
}
navigator.storage?.persist?.().catch(() => {});

window.addEventListener('error', ev => toast(`Fehler: ${ev.message}`));
