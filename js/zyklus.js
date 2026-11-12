// Pille & Tagesform: Pausenwoche berechnen und daraus ableiten, wie „sanft“ ein Tag sein darf.
// Wichtig: Mit kombinierter Pille gibt es keine natürlichen Zyklusphasen. Es zählt die Pause (Abbruchblutung) und wie es dir geht.
// Reine Logik ohne DOM.

import { tageZwischen, plusTage, BAUSTEINE } from './rechner.js';

export const PILLEN_SCHEMATA = {
  'pille-21-7': { label: '21 + 7 Tage', einnahme: 21, pause: 7 },
};

export const BESCHWERDEN = [
  { id: 'kraempfe',    label: 'Krämpfe',      icon: 'kraempfe' },
  { id: 'wasser',      label: 'Blähbauch',    icon: 'blaehbauch' },
  { id: 'heisshunger', label: 'Heißhunger',   icon: 'genuss' },
  { id: 'blutung',     label: 'Blutung',      icon: 'blutung' },
];

export const ENERGIE = [
  { wert: 1, label: 'Schlapp', icon: 'energie1' },
  { wert: 2, label: 'Okay',    icon: 'energie2' },
  { wert: 3, label: 'Fit',     icon: 'energie3' },
];

/**
 * Wo im Pillenzyklus liegt `tag`?
 * @param {{modus, packungStart}} zyklus  packungStart = erster Pillentag einer (beliebigen) Packung
 * @returns {null | {tagImZyklus, phase: 'einnahme'|'pause', pausenTag?, einnahmeTag?, naechstePause, naechstePackung, neuePackungHeute}}
 */
export function pillenInfo(zyklus, tag) {
  const schema = PILLEN_SCHEMATA[zyklus?.modus];
  if (!schema || !zyklus.packungStart) return null;
  const laenge = schema.einnahme + schema.pause;
  const d = tageZwischen(zyklus.packungStart, tag);
  const imZyklus = ((d % laenge) + laenge) % laenge;            // 0-basiert, auch für Tage vor dem Start
  const packungsBeginn = plusTage(tag, -imZyklus);
  const info = {
    tagImZyklus: imZyklus + 1,
    phase: imZyklus < schema.einnahme ? 'einnahme' : 'pause',
    naechstePause: plusTage(packungsBeginn, schema.einnahme),
    naechstePackung: plusTage(packungsBeginn, laenge),
    neuePackungHeute: imZyklus === 0,
  };
  if (info.phase === 'pause') {
    info.pausenTag = imZyklus - schema.einnahme + 1;
    info.pauseLaenge = schema.pause;
  } else {
    info.einnahmeTag = imZyklus + 1;
    info.einnahmeLaenge = schema.einnahme;
    if (info.naechstePause <= info.naechstePackung) info.tageBisPause = tageZwischen(tag, info.naechstePause);
  }
  return info;
}

/**
 * Wie sanft soll der Tag sein?
 * - 'normal': alles wie geplant
 * - 'sanft':  leichteres Training, etwas niedrigere Bewegungsziele, Wohlfühl-Rezepte
 * - 'ruhe':   Erholung zuerst: Spaziergang/Mobility statt Krafttraining
 * Tagesform schlägt Kalender: Wer sich in der Pause fit fühlt, trainiert normal.
 * @param {{energie?:1|2|3, beschwerden?:string[]}} form
 * @param {object|null} pille  Ergebnis von pillenInfo()
 * @returns {{stufe, gruende: string[], ausForm: boolean}}
 */
export function tagesStufe(form = {}, pille = null) {
  const b = form.beschwerden || [];
  const e = form.energie;
  const gruende = [];
  if (pille?.phase === 'pause') gruende.push(`Pillenpause, Tag ${pille.pausenTag} von ${pille.pauseLaenge}`);
  if (b.includes('kraempfe')) gruende.push('Krämpfe');
  if (e === 1) gruende.push('wenig Energie');
  if (b.includes('blutung') && pille?.phase !== 'pause') gruende.push('Blutung');

  let stufe = 'normal';
  if (e === 3) stufe = 'normal';                                        // fit → keine Bremse
  else if (b.includes('kraempfe') && e === 1) stufe = 'ruhe';
  else if (b.includes('kraempfe') || e === 1) stufe = 'sanft';
  else if (pille?.phase === 'pause' || b.includes('blutung')) stufe = 'sanft';
  return { stufe, gruende: stufe === 'normal' && e === 3 && gruende.length ? ['du fühlst dich fit'] : gruende, ausForm: !!e || b.length > 0 };
}

/** Bausteinziele für den Tag. Nur Bewegung und Schritte werden angepasst, der Rest bleibt. */
export function zieleFuer(stufe, basis = Object.fromEntries(BAUSTEINE.map(b => [b.id, b.ziel]))) {
  const ziele = { ...basis };
  const senke = (id, wert) => { if (ziele[id] !== undefined) ziele[id] = Math.min(ziele[id], wert); };
  if (stufe === 'sanft') { senke('schritte', 6000); senke('bewegung', 15); }
  if (stufe === 'ruhe') { senke('schritte', 4000); senke('bewegung', 10); }
  return ziele;
}

/** Kurze, freundliche Erklärung für die Tageskarte. */
export function stufenText(stufe, form = {}) {
  const b = form.beschwerden || [];
  const teile = [];
  if (stufe === 'ruhe') teile.push('Spaziergang oder Mobility reicht. Wärme hilft.');
  if (stufe === 'sanft') teile.push('Leichteres Training, 6.000 Schritte reichen.');
  if (stufe === 'normal' && form.energie === 3) teile.push('Alles wie geplant.');
  if (b.includes('wasser')) teile.push('Wasser ist kein Fett. Viel trinken, wenig Salz.');
  if (b.includes('heisshunger')) teile.push('Ganz normal. Schoko-Snack mit Eiweiß hilft.');
  return teile;
}

/** Bewegungsminuten der sanften Einheit (zählt für den Baustein Bewegung). */
export const SANFT_MINUTEN = 30;

/* ---------- Statistik nach Pillenphasen ---------- */

/** Abschnitte einer 21+7-Packung. Ohne natürliche Phasen sind das Pillenwochen und die Pause. */
export const PILLEN_PHASEN = [
  { id: 'w1',    label: 'Woche 1', kurz: 'W1',    von: 1,  bis: 7 },
  { id: 'w2',    label: 'Woche 2', kurz: 'W2',    von: 8,  bis: 14 },
  { id: 'w3',    label: 'Woche 3', kurz: 'W3',    von: 15, bis: 21 },
  { id: 'pause', label: 'Pause',   kurz: 'Pause', von: 22, bis: 28 },
];

/** Phase (id aus PILLEN_PHASEN) für das Ergebnis von pillenInfo(), sonst null. */
export function phaseVon(pi) {
  if (!pi) return null;
  return PILLEN_PHASEN.find(p => pi.tagImZyklus >= p.von && pi.tagImZyklus <= p.bis)?.id ?? null;
}

/** Was in der Statistik gezählt wird: Beschwerden plus „wenig Energie“. */
export const MERKMALE = [
  ...BESCHWERDEN.map(b => ({ id: b.id, label: b.label, icon: b.icon, hat: f => (f.beschwerden || []).includes(b.id) })),
  { id: 'schlapp', label: 'Wenig Energie', icon: 'energie1', hat: f => f.energie === 1 },
];

/** Hat der Tag eine Tagesform-Eingabe? Nur solche Tage zählen als „erfasst“. */
export function formErfasst(f) {
  return !!f && (!!f.energie || (f.beschwerden || []).length > 0);
}

/**
 * Vergleich der Pillenphasen über eine Liste von Tagen.
 * @param {string[]} tage
 * @param {(tag:string)=>string|null} phase   Phase des Tages (phaseVon(pillenInfo(...)))
 * @param {(tag:string)=>{form?:object, gewichtDiff?:number|null, punkte?:number, training?:boolean}} daten
 * @returns {Object<string,{tage, erfasst, gewichtDiff, punkte, training, merkmale:Object<string,number>}>}
 *          gewichtDiff/punkte als Durchschnitt (null ohne Daten), training und merkmale als Anzahl Tage
 */
export function phasenVergleich(tage, phase, daten) {
  const erg = Object.fromEntries(PILLEN_PHASEN.map(p => [p.id, {
    tage: 0, erfasst: 0, training: 0, _g: [], _p: [], merkmale: Object.fromEntries(MERKMALE.map(m => [m.id, 0])),
  }]));
  for (const t of tage) {
    const ph = phase(t);
    if (!ph || !erg[ph]) continue;
    const z = erg[ph], d = daten(t) || {};
    z.tage++;
    if (Number.isFinite(d.gewichtDiff)) z._g.push(d.gewichtDiff);
    if (Number.isFinite(d.punkte)) z._p.push(d.punkte);
    if (d.training) z.training++;
    if (formErfasst(d.form)) {
      z.erfasst++;
      for (const m of MERKMALE) if (m.hat(d.form)) z.merkmale[m.id]++;
    }
  }
  const schnitt = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length * 100) / 100 : null;
  for (const z of Object.values(erg)) { z.gewichtDiff = schnitt(z._g); z.punkte = schnitt(z._p); delete z._g; delete z._p; }
  return erg;
}
