// Trainingsplan: 2× pro Woche Ganzkörper, ca. 45 Minuten, jede Übung als Gym- und Zuhause-Variante.
// Reine Daten + Logik ohne DOM (wird im Browser-Test direkt geprüft).

import { plusTage, keyZuDatum, letzteTage } from './rechner.js';

export const ORTE = { gym: 'Gym', zuhause: 'Zuhause' };

export const DAUER_MIN = 45;
export const PAUSE_SEK = 75;

/**
 * Übung: wdh = [min, max] Wiederholungen ODER sek = [min, max] Sekunden.
 * proSeite: Wiederholungen gelten je Seite. gewicht: ob ein kg-Feld angezeigt wird.
 */
export const EINHEITEN = {
  A: {
    name: 'Ganzkörper A',
    fokus: 'Beine, Po, Brust, Rücken',
    aufwaermen: {
      gym: '5 Min. Crosstrainer oder Rad locker, dann 10 Kniebeugen ohne Gewicht und 10 Armkreise vorwärts/rückwärts.',
      zuhause: '5 Min. Marschieren auf der Stelle mit Armschwung, 10 Kniebeugen, 10 Armkreise, 10 Hüftkreise.',
    },
    uebungen: [
      { id: 'kniebeuge', saetze: 3,
        gym:     { name: 'Goblet Squat', wdh: [10, 12], gewicht: true, start: 'Start: 6–8 kg', tipp: 'Kurzhantel oder Kettlebell vor der Brust halten, Füße schulterbreit, Po nach hinten unten, Knie zeigen über die Zehen. Rücken gerade.' },
        zuhause: { name: 'Kniebeuge', wdh: [12, 15], gewicht: false, tipp: '3 Sekunden langsam runter, zügig hoch. Fersen bleiben am Boden. Zu leicht? Rucksack mit Büchern umschnallen.' } },
      { id: 'druecken', saetze: 3,
        gym:     { name: 'Brustpresse (Maschine)', wdh: [10, 12], gewicht: true, start: 'Start: 10–15 kg', tipp: 'Griffe auf Brusthöhe, Schulterblätter nach hinten unten ziehen, kontrolliert drücken und langsam zurück.' },
        zuhause: { name: 'Liegestütz erhöht', wdh: [8, 12], gewicht: false, tipp: 'Hände auf Sofa, Tisch oder Fensterbank. Körper bildet eine Linie. Je tiefer die Fläche, desto schwerer.' } },
      { id: 'huefte', saetze: 3,
        gym:     { name: 'Hip Thrust', wdh: [10, 12], gewicht: true, start: 'Start: 20 kg (Langhantel mit Polster) oder Maschine', tipp: 'Oberer Rücken an der Bank, Kinn zur Brust, Hüfte strecken bis Oberkörper und Oberschenkel eine Linie bilden. Oben 1 Sekunde Po anspannen.' },
        zuhause: { name: 'Glute Bridge', wdh: [15, 20], gewicht: false, tipp: 'Rückenlage, Füße nah am Po, Hüfte hoch und oben 2 Sekunden halten. Zu leicht? Einbeinig oder mit Rucksack auf der Hüfte.' } },
      { id: 'ziehen', saetze: 3,
        gym:     { name: 'Latzug', wdh: [10, 12], gewicht: true, start: 'Start: 15–20 kg', tipp: 'Stange zur oberen Brust ziehen, Brust raus, Ellbogen nach unten. Nicht mit Schwung zurücklehnen.' },
        zuhause: { name: 'Rudern mit Rucksack', wdh: [12, 15], gewicht: false, tipp: 'Oberkörper vorgebeugt, Rücken gerade, Rucksack (oder 2 Wasserflaschen) zum Bauchnabel ziehen. Schulterblätter zusammen.' } },
      { id: 'rumpf', saetze: 3,
        gym:     { name: 'Unterarmstütz (Plank)', sek: [30, 45], gewicht: false, tipp: 'Ellbogen unter den Schultern, Po in Linie, Bauch und Po anspannen. Gleichmäßig atmen.' },
        zuhause: { name: 'Unterarmstütz (Plank)', sek: [30, 45], gewicht: false, tipp: 'Ellbogen unter den Schultern, Po in Linie, Bauch und Po anspannen. Gleichmäßig atmen. Zu schwer? Auf den Knien.' } },
    ],
    finisher: {
      gym: '6 Min. Rudergerät: 30 Sek. zügig, 30 Sek. locker.',
      zuhause: '6 Runden: 30 Sek. Hampelmann (oder Step-Touch), 30 Sek. Pause.',
    },
  },
  B: {
    name: 'Ganzkörper B',
    fokus: 'Po, Beine hinten, Schultern, Rumpf',
    aufwaermen: {
      gym: '5 Min. Laufband zügig gehen mit leichter Steigung, dann 10 Ausfallschritte und 10 Good Mornings ohne Gewicht.',
      zuhause: '5 Min. zügig Treppe steigen oder Marschieren, 10 Ausfallschritte, 10 Good Mornings (Hände an die Hüfte, Oberkörper vorneigen).',
    },
    uebungen: [
      { id: 'kreuzheben', saetze: 3,
        gym:     { name: 'Rumänisches Kreuzheben (Kurzhanteln)', wdh: [10, 12], gewicht: true, start: 'Start: 2× 6–8 kg', tipp: 'Knie leicht gebeugt, Hüfte nach hinten schieben, Hanteln nah an den Beinen bis knapp unter die Knie. Rücken bleibt gerade. Dehnung hinten im Oberschenkel spüren.' },
        zuhause: { name: 'Rumänisches Kreuzheben mit Rucksack', wdh: [12, 15], gewicht: false, tipp: 'Wie im Gym, mit Rucksack oder Wasserkanister. Zu leicht? Einbeinig, mit der Hand an der Wand.' } },
      { id: 'ausfall', saetze: 3,
        gym:     { name: 'Ausfallschritt rückwärts (Kurzhanteln)', wdh: [8, 10], proSeite: true, gewicht: true, start: 'Start: 2× 4–6 kg', tipp: 'Großer Schritt nach hinten, hinteres Knie Richtung Boden, Oberkörper aufrecht. Über die vordere Ferse hochdrücken.' },
        zuhause: { name: 'Ausfallschritt rückwärts', wdh: [10, 12], proSeite: true, gewicht: false, tipp: 'Großer Schritt nach hinten, hinteres Knie Richtung Boden. Zum Festhalten neben eine Wand stellen.' } },
      { id: 'schulter', saetze: 3,
        gym:     { name: 'Schulterdrücken sitzend (Kurzhanteln)', wdh: [10, 12], gewicht: true, start: 'Start: 2× 4–5 kg', tipp: 'Rücken an der Lehne, Hanteln von Ohrhöhe nach oben drücken. Kein Hohlkreuz, Bauch fest.' },
        zuhause: { name: 'Schulterdrücken mit Wasserflaschen', wdh: [12, 15], gewicht: false, tipp: 'Zwei volle 1,5-l-Flaschen (je 1,5 kg). Von Ohrhöhe nach oben drücken, Bauch fest.' } },
      { id: 'rudern', saetze: 3,
        gym:     { name: 'Rudern am Kabelzug sitzend', wdh: [10, 12], gewicht: true, start: 'Start: 15–20 kg', tipp: 'Aufrecht sitzen, Griff zum Bauch ziehen, Schulterblätter zusammen, langsam nach vorne lassen ohne rund zu werden.' },
        zuhause: { name: 'Y-T-Heben in Bauchlage', wdh: [10, 12], gewicht: false, tipp: 'Auf dem Bauch, Stirn auf einem Handtuch. Arme abwechselnd als Y und als T leicht anheben, Daumen zeigen nach oben. Langsam.' } },
      { id: 'rumpf2', saetze: 3,
        gym:     { name: 'Pallof Press am Kabel', wdh: [10, 12], proSeite: true, gewicht: true, start: 'Start: 5 kg', tipp: 'Seitlich zum Kabelzug, Griff vor der Brust, Arme gerade nach vorne drücken und dem Zug nicht nachgeben.' },
        zuhause: { name: 'Dead Bug', wdh: [8, 10], proSeite: true, gewicht: false, tipp: 'Rückenlage, Arme hoch, Knie 90°. Gegenüberliegenden Arm und Bein langsam strecken, unterer Rücken bleibt am Boden.' } },
    ],
    finisher: {
      gym: '8 Min. Laufband: zügig gehen mit 8–10 % Steigung.',
      zuhause: '6 Runden: 20 Sek. Mountain Climber (langsam ist okay), 40 Sek. Pause.',
    },
  },
};

// Sanfte Einheit für Pausenwoche, Krämpfe oder wenig Energie: Spaziergang + Mobility, ca. 30 Min.
// Gym und Zuhause identisch. Zählt als Bewegung, aber nicht für den A/B-Wechsel und nicht für die Steigerung.
const sanft = (name, tipp, rest) => ({ name, tipp, gewicht: false, ...rest });
const beide = v => ({ gym: v, zuhause: v });
EINHEITEN.S = {
  name: 'Sanft & Mobility',
  fokus: 'Spaziergang, Rücken, Hüfte, Entspannung',
  sanft: true,
  aufwaermen: beide('10–15 Min. lockerer Spaziergang, am besten draußen (oder ganz locker auf Laufband/Crosstrainer).'),
  uebungen: [
    { id: 'katze-kuh', saetze: 2, ...beide(sanft('Katze-Kuh', 'Vierfüßlerstand. Mit dem Ausatmen den Rücken rund machen, mit dem Einatmen sanft durchhängen lassen. Entspannt den unteren Rücken.', { wdh: [8, 10] })) },
    { id: 'kindhaltung', saetze: 2, ...beide(sanft('Kindhaltung mit Bauchatmung', 'Knie auseinander, Po zu den Fersen, Arme lang nach vorne. Tief in den Bauch atmen. Das tut vielen bei Krämpfen gut.', { sek: [45, 60] })) },
    { id: 'beckenkreisen', saetze: 2, ...beide(sanft('Beckenkreisen im Stand', 'Hände an die Hüfte, große langsame Kreise, erst in die eine, dann in die andere Richtung.', { wdh: [8, 10], proSeite: true })) },
    { id: 'bruecke-sanft', saetze: 2, ...beide(sanft('Glute Bridge, ganz langsam', 'Rückenlage, Füße nah am Po, Hüfte langsam hoch und Wirbel für Wirbel wieder ablegen.', { wdh: [10, 12] })) },
    { id: 'drehdehnung', saetze: 2, ...beide(sanft('Liegende Drehdehnung', 'Rückenlage, beide Knie zur Seite sinken lassen, Blick zur anderen Seite, Schultern bleiben am Boden.', { sek: [30, 45], proSeite: true })) },
  ],
  finisher: beide('Optional: noch 10 Min. spazieren. Heute ist alles freiwillig.'),
};

/** Leichte Variante von A/B: 2 statt 3 Sätze, ca. 80 % vom letzten Gewicht, Finisher ersetzt. */
export const LEICHT = { saetze: 2, faktor: 0.8, finisher: 'Statt Finisher: 5 Min. locker gehen oder radeln.' };

export const ABKUEHLEN = 'Je 30 Sek. pro Seite dehnen: Hüftbeuger (Ausfallschritt-Position), Oberschenkel hinten, Brust an der Wand.';

/** Was jede Übung trainiert (für den Übungs-Katalog). */
export const MUSKELN = {
  kniebeuge: 'Beine, Po', druecken: 'Brust, Arme', huefte: 'Po', ziehen: 'Rücken, Arme', rumpf: 'Bauch, Rücken',
  kreuzheben: 'Po, Beinrückseite', ausfall: 'Beine, Po, Gleichgewicht', schulter: 'Schultern, Arme', rudern: 'Rücken, Haltung', rumpf2: 'Bauch, seitlicher Rumpf',
  'katze-kuh': 'Rücken locker', kindhaltung: 'Entspannung, unterer Rücken', beckenkreisen: 'Hüfte, Becken', 'bruecke-sanft': 'Po, Rücken', drehdehnung: 'Rücken, Hüfte',
};

export const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function standardPlan() {
  return { tage: [2, 6], ort: 'gym' };   // Dienstag und Samstag
}

/** Schlüssel für die Sätze einer Übung, getrennt nach Ort (Gym-Kilos ≠ Zuhause-Variante). */
export function satzKey(uebung, ort) {
  return `${uebung.id}-${ort}`;
}

export function istTrainingstag(plan, tag) {
  return (plan?.tage || []).includes(keyZuDatum(tag).getDay());
}

/** Alle abgeschlossenen Trainings, neueste zuerst. */
export function trainings(eintraege) {
  return Object.entries(eintraege)
    .filter(([, e]) => e.training?.fertig)
    .map(([tag, e]) => ({ tag, ...e.training }))
    .sort((a, b) => b.tag.localeCompare(a.tag));
}

/** A/B im Wechsel: nach A kommt B und umgekehrt. Ohne Training bisher: A. Sanfte Einheiten zählen nicht mit. */
export function naechsteEinheit(eintraege, vorTag = '9999-12-31') {
  const letzte = trainings(eintraege).find(t => t.tag < vorTag && (t.einheit === 'A' || t.einheit === 'B'));
  return letzte?.einheit === 'A' ? 'B' : 'A';
}

/** Sätze der letzten abgeschlossenen Einheit vor `vorTag` für eine Übung/Ort. */
export function letzteSaetze(eintraege, key, vorTag) {
  // Leichte Einheiten (Pausenwoche) nicht als Maßstab nehmen
  const t = trainings(eintraege).find(x => x.tag < vorTag && !x.leicht && x.saetze?.[key]?.some(s => s.ok));
  return t ? { tag: t.tag, saetze: t.saetze[key] } : null;
}

/**
 * Doppelte Progression: Wurden beim letzten Mal alle Sätze am oberen Ende der Spanne geschafft,
 * ist es Zeit für mehr Gewicht (Gym) bzw. eine schwerere Variante (Zuhause).
 */
export function steigern(variante, saetze, anzahl = 3) {
  if (!saetze) return false;
  const oben = (variante.wdh || variante.sek)[1];
  const fertig = saetze.filter(s => s.ok);
  return fertig.length >= anzahl && fertig.every(s => Number(s.wdh) >= oben);
}

/** Wie viele Trainingstage liegen in der Kalenderwoche (Mo–So) von `tag`, wie viele sind erledigt? */
export function wochenStand(eintraege, plan, tag) {
  const wochentag = (keyZuDatum(tag).getDay() + 6) % 7;      // Mo = 0
  const montag = plusTage(tag, -wochentag);
  const woche = letzteTage(plusTage(montag, 6), 7);
  const erledigt = woche.filter(t => eintraege[t]?.training?.fertig).length;
  return { geplant: (plan?.tage || []).length, erledigt, woche };
}

/** Leere Satzliste mit Vorschlägen aus dem letzten Mal. leicht: weniger Sätze, ca. 80 % Gewicht (auf 0,5 kg gerundet). */
export function satzVorlage(variante, anzahl, letzte, leicht = false) {
  return Array.from({ length: leicht ? Math.min(anzahl, LEICHT.saetze) : anzahl }, (_, i) => {
    const alt = letzte?.saetze?.[i];
    let kg = variante.gewicht ? (alt?.kg ?? null) : null;
    if (leicht && kg) kg = Math.max(0.5, Math.round(kg * LEICHT.faktor * 2) / 2);
    return { wdh: alt?.wdh ?? (variante.wdh || variante.sek)[0], kg, ok: false };
  });
}

/* ---------- Trainings-Tagebuch: Auswertung ---------- */

export const GEFUEHL = [
  { wert: 1, label: 'Leicht' },
  { wert: 2, label: 'Passend' },
  { wert: 3, label: 'Schwer' },
];

/** Alle Übungsvarianten: satzKey → { uebung, ort, variante, einheit } (für Namen und Ziele). */
export function uebungsLexikon(einheiten = EINHEITEN) {
  const lex = {};
  for (const [eid, e] of Object.entries(einheiten)) {
    for (const u of e.uebungen) for (const ort of Object.keys(ORTE)) {
      const key = satzKey(u, ort);
      if (!lex[key]) lex[key] = { uebung: u, ort, variante: u[ort], einheit: eid };
    }
  }
  return lex;
}

/** Bester Wert einer Übung in einer Einheit: höchstes Gewicht (mit kg) bzw. meiste Wiederholungen/Sekunden. Nur geschaffte Sätze. */
export function besterWert(saetze, variante) {
  const ok = (saetze || []).filter(s => s.ok);
  if (!ok.length) return null;
  if (variante.gewicht) {
    const kg = ok.map(s => Number(s.kg)).filter(Number.isFinite);
    if (kg.length) return { wert: Math.max(...kg), einheit: 'kg' };
  }
  const wdh = ok.map(s => Number(s.wdh)).filter(Number.isFinite);
  return wdh.length ? { wert: Math.max(...wdh), einheit: variante.sek ? 'Sek.' : 'Wdh.' } : null;
}

/**
 * Jede abgeschlossene Einheit, älteste zuerst, mit geplanten/geschafften Sätzen und Ereignissen:
 * - 'mehr':    besserer Bestwert als beim letzten Mal (mehr kg bzw. mehr Wdh./Sek.)
 * - 'weniger': schlechterer Bestwert
 * - 'saetze':  weniger Sätze geschafft als geplant
 * Leichte und sanfte Einheiten werden nicht verglichen (sie sind absichtlich leichter).
 */
export function trainingsTagebuch(eintraege, einheiten = EINHEITEN) {
  const lex = uebungsLexikon(einheiten);
  const zuletzt = {};   // satzKey → letzter Bestwert aus normaler Einheit
  return trainings(eintraege).reverse().map(t => {
    const e = einheiten[t.einheit];
    let geplant = 0, geschafft = 0;
    const ereignisse = [];
    if (!e) {   // Einheit wurde inzwischen gelöscht: nur zählen
      const alle = Object.values(t.saetze || {}).flat();
      return { tag: t.tag, einheit: t.einheit, name: t.name || 'Gelöschte Einheit', ort: t.ort, leicht: !!t.leicht, sanft: false, geplant: alle.length, geschafft: alle.filter(s => s.ok).length,
        gefuehl: t.gefuehl || null, notiz: t.notiz || '', ereignisse };
    }
    for (const u of e?.uebungen || []) {
      const key = satzKey(u, t.ort);
      const v = lex[key]?.variante || u[t.ort];
      const soll = t.leicht ? Math.min(u.saetze, LEICHT.saetze) : u.saetze;
      const ist = (t.saetze?.[key] || []).filter(s => s.ok).length;
      geplant += soll; geschafft += Math.min(ist, soll);
      if (e.sanft) continue;
      if (!t.leicht && ist < soll) ereignisse.push({ typ: 'saetze', key, name: v.name, ist, soll });
      const best = besterWert(t.saetze?.[key], v);
      if (!best || t.leicht) continue;
      const vorher = zuletzt[key];
      if (vorher && vorher.einheit === best.einheit && best.wert !== vorher.wert) {
        ereignisse.push({ typ: best.wert > vorher.wert ? 'mehr' : 'weniger', key, name: v.name, von: vorher.wert, bis: best.wert, einheit: best.einheit });
      }
      zuletzt[key] = best;
    }
    return { tag: t.tag, einheit: t.einheit, name: e.name, ort: t.ort, leicht: !!t.leicht, sanft: !!e?.sanft, geplant, geschafft, gefuehl: t.gefuehl || null, notiz: t.notiz || '', ereignisse };
  });
}

/** Verlauf einer Übung (satzKey): Bestwert je Einheit, älteste zuerst. Leichte Einheiten sind markiert. */
export function uebungsVerlauf(eintraege, key, einheiten = EINHEITEN) {
  const v = uebungsLexikon(einheiten)[key]?.variante;
  if (!v) return [];
  return trainings(eintraege).reverse()
    .map(t => ({ tag: t.tag, leicht: !!t.leicht, ...besterWert(t.saetze?.[key], v) }))
    .filter(p => Number.isFinite(p.wert));
}
