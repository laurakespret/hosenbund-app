import { BAUSTEINE } from './rechner.js';
// Speichern und Laden. Alles bleibt im Browser (localStorage), kein Server, kein Konto.

const SCHLUESSEL = 'hosenbund';
export const FORMAT_VERSION = 1;

export function leererZustand() {
  return {
    v: FORMAT_VERSION,
    profil: null,       // { name, groesse, geburtsjahr, startgewicht, zielgewicht, aktivitaet, startdatum, hosenbund? }
    bausteine: { ziele: {}, aus: [], eigene: [] },
    training: { uebungen: [], einheiten: {} },
    kalorien: { produkte: {} },                     // gescannte Produkte (EAN → Nährwerte), damit sie offline wieder da sind       // eigene Übungen und eigene/angepasste Einheiten   // Meine Bausteine: eigene Ziele, ausgeblendete, selbst angelegte
    eintraege: {},      // 'JJJJ-MM-TT' → { gewicht, bauch, schritte, wasser, gemuese, eiweiss, bewegung, kueche, genuss, notiz, training }
    essen: null,        // Rezepte { wahl: {tag: rezeptId}, personen: 1|2, favoriten: [ids], einkauf: { woche: Montag, haken: [keys] } }
    zyklus: null,       // { modus: 'pille-21-7'|'aus', packungStart: 'JJJJ-MM-TT' }, null = noch nicht gefragt
    plan: null,         // Trainingsplan { tage: [0–6, So = 0], ort: 'gym'|'zuhause' }, null = Standard (Di + Sa, Gym)
  };
}

/** Repariert und migriert geladene Daten. Neue Formatversionen hier nachziehen. */
export function normalisiere(roh) {
  const z = leererZustand();
  if (!roh || typeof roh !== 'object') return z;
  if (roh.profil && typeof roh.profil === 'object') z.profil = { ...roh.profil };
  if (roh.plan && Array.isArray(roh.plan.tage)) {
    z.plan = { tage: roh.plan.tage.filter(d => Number.isInteger(d) && d >= 0 && d <= 6), ort: roh.plan.ort === 'zuhause' ? 'zuhause' : 'gym' };
  }
  if (roh.zyklus && typeof roh.zyklus === 'object') {
    z.zyklus = { modus: roh.zyklus.modus === 'pille-21-7' ? 'pille-21-7' : 'aus' };
    if (z.zyklus.modus !== 'aus' && /^\d{4}-\d{2}-\d{2}$/.test(roh.zyklus.packungStart || '')) z.zyklus.packungStart = roh.zyklus.packungStart;
    if (z.zyklus.modus !== 'aus' && !z.zyklus.packungStart) z.zyklus = { modus: 'aus' };
  }
  if (roh.essen && typeof roh.essen === 'object') {
    const e = roh.essen;
    z.essen = {
      wahl: e.wahl && typeof e.wahl === 'object' ? { ...e.wahl } : {},
      personen: e.personen === 2 ? 2 : 1,
      favoriten: Array.isArray(e.favoriten) ? e.favoriten.filter(f => typeof f === 'string') : [],
      einkauf: e.einkauf && Array.isArray(e.einkauf.haken) ? { woche: e.einkauf.woche || null, haken: [...e.einkauf.haken] } : { woche: null, haken: [] },
    };
  }
  z.bausteine = normalisiereBausteine(roh.bausteine);
  z.training = normalisiereTraining(roh.training);
  z.kalorien = normalisiereKalorien(roh.kalorien);
  if (roh.eintraege && typeof roh.eintraege === 'object') {
    for (const [tag, e] of Object.entries(roh.eintraege)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(tag) && e && typeof e === 'object') z.eintraege[tag] = { ...e };
    }
  }
  return z;
}

export function laden() {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return normalisiere(text ? JSON.parse(text) : null);
  } catch (e) {
    console.warn('Laden fehlgeschlagen', e);
    return leererZustand();
  }
}

export function speichern(zustand) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand));
    return true;
  } catch (e) {
    console.warn('Speichern fehlgeschlagen', e);
    return false;
  }
}

export function loeschen() {
  try { localStorage.removeItem(SCHLUESSEL); } catch { /* egal */ }
}

/** Sicherung als Datei herunterladen. */
export function exportieren(zustand) {
  const blob = new Blob([JSON.stringify(zustand, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hosenbund-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Sicherung aus Datei lesen. Wirft bei ungültiger Datei. */
export async function importieren(datei) {
  const roh = JSON.parse(await datei.text());
  if (!roh || typeof roh !== 'object' || !('eintraege' in roh)) throw new Error('Das ist keine Hosenbund-Sicherung.');
  return normalisiere(roh);
}

/** Meine Bausteine prüfen. Fehlt das Feld (ältere Daten), gibt es die Standardwerte. */
export function normalisiereBausteine(roh) {
  const erg = { ziele: {}, aus: [], eigene: [] };
  if (!roh || typeof roh !== 'object') return erg;
  for (const b of BAUSTEINE) {
    const w = Number(roh.ziele?.[b.id]);
    if (b.typ !== 'janein' && Number.isFinite(w) && w >= 1 && w <= b.max) erg.ziele[b.id] = Math.round(w);
  }
  if (Array.isArray(roh.aus)) erg.aus = roh.aus.filter(id => BAUSTEINE.some(b => b.id === id));
  if (Array.isArray(roh.eigene)) {
    erg.eigene = roh.eigene
      .filter(x => x && /^e-[a-z0-9]+$/.test(x.id) && typeof x.label === 'string' && x.label.trim())
      .map(x => ({ id: x.id, label: x.label.trim().slice(0, 30), typ: x.typ === 'zaehler' ? 'zaehler' : 'janein',
        ziel: x.typ === 'zaehler' ? Math.min(50, Math.max(1, Math.round(Number(x.ziel) || 1))) : 1 }))
      .slice(0, 10);
  }
  return erg;
}

/** Eigene Übungen und Einheiten prüfen. Fehlt das Feld, gibt es leere Standardwerte. */
export function normalisiereTraining(roh) {
  const erg = { uebungen: [], einheiten: {} };
  if (!roh || typeof roh !== 'object') return erg;
  const spanne = (x, lo, hi) => Array.isArray(x) && x.length === 2 && x.every(n => Number.isInteger(n) && n >= lo && n <= hi) && x[0] <= x[1];
  if (Array.isArray(roh.uebungen)) {
    erg.uebungen = roh.uebungen
      .filter(x => x && /^u-[a-z0-9]+$/.test(x.id) && typeof x.name === 'string' && x.name.trim() && ['kraft-kg', 'kraft', 'zeit'].includes(x.art))
      .map(x => ({ id: x.id, name: x.name.trim().slice(0, 40), art: x.art })).slice(0, 50);
  }
  if (roh.einheiten && typeof roh.einheiten === 'object') {
    for (const [id, d] of Object.entries(roh.einheiten)) {
      if (!/^(A|B|x-[a-z0-9]+)$/.test(id) || !d || !Array.isArray(d.uebungen)) continue;
      const uebungen = d.uebungen.filter(u => u && typeof u.ref === 'string').slice(0, 12).map(u => {
        const n = { ref: u.ref, saetze: Math.min(6, Math.max(1, Math.round(Number(u.saetze) || 3))) };
        if (spanne(u.wdh, 1, 100)) n.wdh = u.wdh;
        if (spanne(u.sek, 5, 600)) n.sek = u.sek;
        return n;
      });
      if (!uebungen.length) continue;
      erg.einheiten[id] = { name: typeof d.name === 'string' ? d.name.trim().slice(0, 30) : '', uebungen };
    }
  }
  return erg;
}

/** Gescannte Produkte prüfen (höchstens 300). */
export function normalisiereKalorien(roh) {
  const erg = { produkte: {} };
  const p = roh?.produkte;
  if (!p || typeof p !== 'object') return erg;
  for (const [ean, x] of Object.entries(p).slice(-300)) {
    if (!/^\d{8}$|^\d{13}$/.test(ean) || !x || typeof x.name !== 'string') continue;
    const kcal = Number(x.kcal100), ew = Number(x.ew100), g = Number(x.portionG);
    if (!(kcal >= 0 && kcal <= 1000)) continue;
    erg.produkte[ean] = { id: `ean-${ean}`, ean, name: x.name.slice(0, 60), kcal100: Math.round(kcal), ew100: ew >= 0 && ew <= 100 ? ew : 0,
      portion: typeof x.portion === 'string' ? x.portion.slice(0, 30) : '100 g', portionG: g > 0 && g <= 2000 ? g : 100, stichworte: '', marke: typeof x.marke === 'string' ? x.marke.slice(0, 40) : '' };
  }
  return erg;
}
