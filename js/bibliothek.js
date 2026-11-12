// Bibliothek: bekannte Übungen und Sportarten, Suche und eigene/angepasste Einheiten.
// Reine Logik ohne DOM.

import { EINHEITEN, MUSKELN } from './training.js';

const v = (name, tipp, rest) => ({ name, tipp, gewicht: false, wdh: [10, 12], ...rest });

/** Zusätzliche gängige Übungen (gleiche Variante für Gym und Zuhause). */
export const UEBUNGEN_EXTRA = [
  { id: 'bankdruecken', muskeln: 'Brust, Arme, Schultern', ...v('Bankdrücken (Kurzhanteln)', 'Rückenlage auf der Bank, Hanteln über der Brust, kontrolliert bis Brusthöhe senken.', { gewicht: true }) },
  { id: 'langhantel-kniebeuge', muskeln: 'Beine, Po, Rumpf', ...v('Kniebeuge mit Langhantel', 'Stange auf dem oberen Rücken, Füße schulterbreit, Po nach hinten unten, Rücken gerade.', { gewicht: true, wdh: [8, 10] }) },
  { id: 'beinpresse', muskeln: 'Beine, Po', ...v('Beinpresse', 'Füße hüftbreit auf der Platte, Knie zeigen nach außen, unten nicht den Po abheben.', { gewicht: true }) },
  { id: 'beinstrecker', muskeln: 'Oberschenkel vorne', ...v('Beinstrecker (Maschine)', 'Langsam strecken, oben kurz halten, kontrolliert zurück.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'beinbeuger', muskeln: 'Beinrückseite', ...v('Beinbeuger (Maschine)', 'Fersen zum Po ziehen, Hüfte bleibt auf dem Polster.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'abduktoren', muskeln: 'Po seitlich, Hüfte', ...v('Abduktoren-Maschine', 'Knie gegen den Widerstand nach außen drücken, langsam zurück.', { gewicht: true, wdh: [15, 20] }) },
  { id: 'adduktoren', muskeln: 'Innenseite Oberschenkel', ...v('Adduktoren-Maschine', 'Knie zusammendrücken, kontrolliert öffnen.', { gewicht: true, wdh: [15, 20] }) },
  { id: 'wadenheben', muskeln: 'Waden', ...v('Wadenheben', 'Auf einer Stufe stehen, Fersen langsam senken und ganz hoch drücken.', { wdh: [15, 20] }) },
  { id: 'bulgarian', muskeln: 'Beine, Po, Gleichgewicht', ...v('Bulgarian Split Squat', 'Hinterer Fuß auf der Bank, vorderes Bein beugen bis der Oberschenkel waagerecht ist.', { wdh: [8, 10], proSeite: true }) },
  { id: 'sumo', muskeln: 'Po, Innenseite Oberschenkel', ...v('Sumo-Kniebeuge', 'Breiter Stand, Fußspitzen nach außen, Hantel zwischen den Beinen halten.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'step-up', muskeln: 'Beine, Po', ...v('Step-ups', 'Auf Bank oder Stufe steigen, über die vordere Ferse hochdrücken.', { wdh: [10, 12], proSeite: true }) },
  { id: 'ausfall-gehend', muskeln: 'Beine, Po', ...v('Ausfallschritte gehend', 'Große Schritte nach vorne, hinteres Knie Richtung Boden, Oberkörper aufrecht.', { wdh: [10, 12], proSeite: true }) },
  { id: 'kettlebell-swing', muskeln: 'Po, Rücken, Puls', ...v('Kettlebell Swing', 'Hüfte kraftvoll nach vorne strecken, die Arme schwingen nur mit.', { gewicht: true, wdh: [15, 20] }) },
  { id: 'hyperextension', muskeln: 'unterer Rücken, Po', ...v('Hyperextensions', 'Oberkörper langsam senken und bis zur geraden Linie heben, nicht überstrecken.', { wdh: [12, 15] }) },
  { id: 'klimmzug-assist', muskeln: 'Rücken, Arme', ...v('Klimmzüge (unterstützt)', 'Mit Maschine oder Band, Brust zur Stange, langsam ablassen.', { gewicht: true, wdh: [6, 10] }) },
  { id: 'rudern-kabel', muskeln: 'Rücken, Haltung', ...v('Rudern am Kabel', 'Griff zum Bauch ziehen, Schulterblätter zusammen, Rücken gerade.', { gewicht: true }) },
  { id: 'face-pull', muskeln: 'Schultern hinten, Haltung', ...v('Face Pulls', 'Seil Richtung Stirn ziehen, Ellbogen hoch und nach außen.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'seitheben', muskeln: 'Schultern', ...v('Seitheben', 'Arme leicht gebeugt seitlich bis Schulterhöhe heben, langsam senken.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'bizeps', muskeln: 'Bizeps', ...v('Bizepscurls', 'Ellbogen bleiben am Körper, Hanteln ohne Schwung heben.', { gewicht: true }) },
  { id: 'trizeps-kabel', muskeln: 'Trizeps', ...v('Trizepsdrücken am Kabel', 'Ellbogen fest am Körper, Unterarme nach unten strecken.', { gewicht: true, wdh: [12, 15] }) },
  { id: 'dips-bank', muskeln: 'Trizeps, Brust', ...v('Dips an der Bank', 'Hände hinter dir auf der Bank, Ellbogen nach hinten beugen.', { wdh: [8, 12] }) },
  { id: 'liegestuetz', muskeln: 'Brust, Arme, Rumpf', ...v('Liegestütz', 'Körper in einer Linie, Brust Richtung Boden. Leichter: auf den Knien.', { wdh: [6, 12] }) },
  { id: 'crunch', muskeln: 'Bauch', ...v('Crunches', 'Schultern leicht vom Boden lösen, unterer Rücken bleibt unten.', { wdh: [15, 20] }) },
  { id: 'dead-bug', muskeln: 'Bauch, Rumpf', ...v('Dead Bug', 'Rückenlage, gegengleich Arm und Bein strecken, Rücken bleibt am Boden.', { wdh: [8, 10], proSeite: true }) },
  { id: 'bird-dog', muskeln: 'Rücken, Rumpf', ...v('Bird Dog', 'Vierfüßlerstand, gegengleich Arm und Bein lang machen, kurz halten.', { wdh: [8, 10], proSeite: true }) },
  { id: 'seitstuetz', muskeln: 'seitlicher Rumpf', ...v('Seitstütz', 'Ellbogen unter der Schulter, Hüfte hoch, Körper in einer Linie.', { sek: [20, 40], proSeite: true, wdh: undefined }) },
  { id: 'russian-twist', muskeln: 'seitlicher Bauch', ...v('Russian Twist', 'Sitzend, Oberkörper leicht zurück, von Seite zu Seite drehen.', { wdh: [16, 20] }) },
  { id: 'mountain-climber', muskeln: 'Rumpf, Puls', ...v('Mountain Climbers', 'Liegestützposition, Knie abwechselnd zügig zur Brust.', { sek: [30, 45], wdh: undefined }) },
  { id: 'burpee', muskeln: 'Ganzkörper, Puls', ...v('Burpees', 'Hocke, in den Stütz springen, zurück und hochspringen. Leichter: ohne Sprung.', { wdh: [6, 10] }) },
  { id: 'hampelmann', muskeln: 'Puls, Ganzkörper', ...v('Hampelmann', 'Locker springen, Arme über den Kopf. Leiser: Step-Touch.', { sek: [30, 45], wdh: undefined }) },
];

/** Sportarten zum Eintragen mit Minuten. */
export const SPORTARTEN = [
  ['joggen', 'Joggen', 'laufen running'], ['walken', 'Walking', 'nordic walking gehen'], ['spazieren', 'Spazieren', 'gehen spaziergang'],
  ['wandern', 'Wandern', 'berg'], ['radfahren', 'Radfahren', 'fahrrad rad bike'], ['spinning', 'Spinning', 'indoor cycling rad'],
  ['schwimmen', 'Schwimmen', 'bahnen'], ['yoga', 'Yoga', 'dehnen'], ['pilates', 'Pilates', 'rumpf'],
  ['tanzen', 'Tanzen', 'dance'], ['zumba', 'Zumba', 'tanzen'], ['aerobic', 'Aerobic', 'step tanzen'],
  ['crosstrainer', 'Crosstrainer', 'ellipse'], ['rudergeraet', 'Rudergerät', 'rudern'], ['seilspringen', 'Seilspringen', 'springseil'],
  ['hiit', 'HIIT', 'intervall zirkel'], ['kurs', 'Fitnesskurs', 'bodypump kurs'], ['stretching', 'Stretching', 'dehnen mobility'],
  ['bouldern', 'Bouldern', 'klettern'], ['tennis', 'Tennis', ''], ['badminton', 'Badminton', 'federball'],
  ['volleyball', 'Volleyball', ''], ['fussball', 'Fußball', ''], ['inliner', 'Inlineskaten', 'skaten rollschuh'],
  ['reiten', 'Reiten', 'pferd'], ['skifahren', 'Skifahren', 'ski snowboard'], ['gartenarbeit', 'Gartenarbeit', 'garten'],
].map(([id, name, stichworte]) => ({ id, name, stichworte }));

/* ---------- Suche ---------- */

/** Kleinschreibung, Umlaute und ß vereinheitlicht: „Drücken“ und „druecken“ finden dasselbe. */
export function normalisiere(text) {
  return String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Einträge, deren Text alle Suchwörter enthält. Treffer am Namensanfang zuerst. */
export function suche(text, liste, felder = e => [e.name, e.alt, e.muskeln, e.stichworte]) {
  const woerter = normalisiere(text).split(' ').filter(Boolean);
  if (!woerter.length) return [];
  return liste
    .map(e => ({ e, t: normalisiere(felder(e).filter(Boolean).join(' ')), n: normalisiere(e.name) }))
    .filter(x => woerter.every(w => x.t.includes(w)))
    .sort((a, b) => (b.n.startsWith(woerter[0]) - a.n.startsWith(woerter[0])) || a.n.localeCompare(b.n))
    .map(x => x.e);
}

/* ---------- Übungskatalog ---------- */

const ARTEN = {
  'kraft-kg': { gewicht: true, wdh: [8, 12] },
  'kraft':    { gewicht: false, wdh: [10, 15] },
  'zeit':     { gewicht: false, sek: [30, 45] },
};
export const ART_LABEL = { 'kraft-kg': 'Wdh. mit Gewicht', 'kraft': 'Wdh. ohne Gewicht', 'zeit': 'Sekunden halten' };

/**
 * Alle wählbaren Übungen: Standardübungen (mit Gym- und Zuhause-Variante), Extra-Übungen und eigene.
 * @returns {Array<{id, name, alt?, muskeln, gym, zuhause, quelle}>}
 */
export function katalog(eigene = []) {
  const liste = [];
  const gesehen = new Set();
  for (const e of Object.values(EINHEITEN)) for (const u of e.uebungen) {
    if (gesehen.has(u.id)) continue;
    gesehen.add(u.id);
    liste.push({ id: u.id, name: u.gym.name, alt: u.zuhause.name !== u.gym.name ? u.zuhause.name : null, muskeln: MUSKELN[u.id] || '', gym: u.gym, zuhause: u.zuhause, saetze: u.saetze, quelle: 'standard' });
  }
  for (const x of UEBUNGEN_EXTRA) {
    const { id, muskeln, ...variante } = x;
    if (!variante.wdh) delete variante.wdh;
    liste.push({ id, name: variante.name, muskeln, gym: variante, zuhause: variante, saetze: 3, quelle: 'extra' });
  }
  for (const x of eigene) {
    const variante = { name: x.name, tipp: 'Eigene Übung', ...ARTEN[x.art] };
    liste.push({ id: x.id, name: x.name, muskeln: 'eigene Übung', gym: variante, zuhause: variante, saetze: 3, quelle: 'eigen' });
  }
  return liste;
}

/* ---------- Einheiten: Standard, angepasst, eigene ---------- */

const ALLGEMEIN = { aufwaermen: '5 Min. locker warm werden, z. B. zügig gehen, Arme und Hüfte kreisen.', finisher: 'Optional: 5 Min. locker ausradeln oder gehen.' };

/** Variante mit angepassten Wiederholungen/Sekunden. */
function angepasst(variante, def) {
  const n = { ...variante };
  if (def.wdh && n.wdh) n.wdh = def.wdh;
  if (def.sek && n.sek) n.sek = def.sek;
  return n;
}

/**
 * Alle Einheiten für die Oberfläche: Standard (A, B, S), angepasste A/B, eigene Einheiten (x-…).
 * @param {{uebungen?:Array, einheiten?:Object}} einst  S.training
 */
export function einheitenAlle(einst = {}) {
  const kat = Object.fromEntries(katalog(einst.uebungen || []).map(k => [k.id, k]));
  const alle = { ...EINHEITEN };
  for (const [id, def] of Object.entries(einst.einheiten || {})) {
    const basis = EINHEITEN[id];
    const uebungen = (def.uebungen || []).filter(x => kat[x.ref]).map(x => ({
      id: x.ref, saetze: x.saetze || kat[x.ref].saetze || 3,
      gym: angepasst(kat[x.ref].gym, x), zuhause: angepasst(kat[x.ref].zuhause, x),
    }));
    if (!uebungen.length) continue;
    const fokus = [...new Set(uebungen.flatMap(u => (kat[u.id].muskeln || '').split(', ')).filter(Boolean))].slice(0, 4).join(', ');
    alle[id] = basis
      ? { ...basis, uebungen, angepasst: true }
      : { name: def.name || 'Eigene Einheit', fokus, eigen: true, uebungen,
          aufwaermen: { gym: ALLGEMEIN.aufwaermen, zuhause: ALLGEMEIN.aufwaermen }, finisher: { gym: ALLGEMEIN.finisher, zuhause: ALLGEMEIN.finisher } };
  }
  return alle;
}

/** Entwurf zum Bearbeiten einer Einheit (aus den gespeicherten Daten oder dem Standard). */
export function entwurfFuer(id, einst = {}) {
  const gespeichert = einst.einheiten?.[id];
  if (gespeichert) return JSON.parse(JSON.stringify({ id, name: gespeichert.name || EINHEITEN[id]?.name || '', uebungen: gespeichert.uebungen }));
  const basis = EINHEITEN[id];
  if (basis) return { id, name: basis.name, uebungen: basis.uebungen.map(u => ({ ref: u.id, saetze: u.saetze })) };
  return { id, name: '', uebungen: [] };
}
