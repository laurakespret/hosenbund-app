// Reine Rechenlogik ohne DOM. Wird auch vom Browser-Test direkt importiert.

/** Datum als 'JJJJ-MM-TT' in lokaler Zeit. */
export function tagKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'JJJJ-MM-TT' → Date (12 Uhr mittags, damit Sommerzeit nicht stört). */
export function keyZuDatum(key) {
  const [j, m, t] = key.split('-').map(Number);
  return new Date(j, m - 1, t, 12);
}

export function tageZwischen(a, b) {
  return Math.round((keyZuDatum(b) - keyZuDatum(a)) / 86400000);
}

export function plusTage(key, n) {
  const d = keyZuDatum(key);
  d.setDate(d.getDate() + n);
  return tagKey(d);
}

export const AKTIVITAET = {
  buero:   { faktor: 1.2,   label: 'Überwiegend sitzend (Büro, wenig Sport)' },
  leicht:  { faktor: 1.375, label: 'Leicht aktiv (viel zu Fuß oder 1–2× Sport pro Woche)' },
  mittel:  { faktor: 1.55,  label: 'Mittel aktiv (3–4× Sport pro Woche)' },
  hoch:    { faktor: 1.725, label: 'Sehr aktiv (fast täglich Sport)' },
};

/** Grundumsatz nach Mifflin-St Jeor (Formel für Frauen). */
export function grundumsatz({ gewicht, groesse, alter }) {
  return 10 * gewicht + 6.25 * groesse - 5 * alter - 161;
}

/**
 * Tagesbedarf und sanftes Kalorienziel.
 * Defizit standardmäßig 400 kcal; nie unter 1400 kcal (Untergrenze, damit es nachhaltig bleibt).
 */
export function energie({ gewicht, groesse, alter, aktivitaet = 'buero', defizit = 400 }) {
  const bmr = grundumsatz({ gewicht, groesse, alter });
  const bedarf = bmr * (AKTIVITAET[aktivitaet]?.faktor ?? 1.2);
  const ziel = Math.max(1400, bedarf - defizit);
  return { grundumsatz: Math.round(bmr), bedarf: Math.round(bedarf), ziel: Math.round(ziel / 10) * 10 };
}

export const UNTERGRENZE_KCAL = 1400;

/**
 * Geglättete Trendlinie (exponentiell, wie in „The Hacker's Diet“).
 * Lücken werden zeitgewichtet: nach d Tagen Pause zählt der neue Wert stärker.
 * @param {Array<{tag:string, wert:number}>} punkte  beliebig sortiert
 * @param {number} alpha  Glättung pro Tag (0.1 ≈ Wirkung über ~10 Tage)
 * @returns {Array<{tag, wert, trend}>} nach Datum sortiert
 */
export function trendlinie(punkte, alpha = 0.1) {
  const sortiert = punkte.filter(p => Number.isFinite(p.wert)).sort((a, b) => a.tag.localeCompare(b.tag));
  let trend = null, vorher = null;
  return sortiert.map(p => {
    if (trend === null) trend = p.wert;
    else {
      const d = Math.max(1, tageZwischen(vorher, p.tag));
      const a = 1 - Math.pow(1 - alpha, d);
      trend = trend + a * (p.wert - trend);
    }
    vorher = p.tag;
    return { tag: p.tag, wert: p.wert, trend: Math.round(trend * 100) / 100 };
  });
}

/**
 * Tempo in kg pro Woche: lineare Regression über die Trendwerte der letzten `tage` Tage.
 * null, wenn zu wenig Daten (mind. 3 Messungen über mind. 6 Tage).
 */
export function tempoProWoche(trendPunkte, tage = 21) {
  if (trendPunkte.length < 3) return null;
  const letzter = trendPunkte[trendPunkte.length - 1].tag;
  const fenster = trendPunkte.filter(p => tageZwischen(p.tag, letzter) <= tage);
  if (fenster.length < 3) return null;
  const xs = fenster.map(p => tageZwischen(fenster[0].tag, p.tag));
  if (xs[xs.length - 1] < 6) return null;
  const ys = fenster.map(p => p.trend);
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let zaehler = 0, nenner = 0;
  for (let i = 0; i < n; i++) { zaehler += (xs[i] - mx) * (ys[i] - my); nenner += (xs[i] - mx) ** 2; }
  if (nenner === 0) return null;
  return Math.round((zaehler / nenner) * 7 * 100) / 100;
}

/**
 * Wann ist das Ziel beim aktuellen Tempo erreicht?
 * @returns {{status:'erreicht'|'unterwegs'|'unklar', tag?:string, wochen?:number}}
 */
export function prognose(trendAktuell, zielgewicht, tempo, heute) {
  if (trendAktuell <= zielgewicht) return { status: 'erreicht' };
  if (tempo === null || tempo >= -0.05) return { status: 'unklar' };
  const wochen = (trendAktuell - zielgewicht) / -tempo;
  if (wochen > 104) return { status: 'unklar' };
  return { status: 'unterwegs', wochen: Math.round(wochen * 10) / 10, tag: plusTage(heute, Math.round(wochen * 7)) };
}

/** Realistische Dauer bei einem gesunden Tempo (0,25–0,5 kg pro Woche). */
export function realistischeDauer(startgewicht, zielgewicht) {
  const diff = Math.max(0, startgewicht - zielgewicht);
  return { minWochen: Math.ceil(diff / 0.5), maxWochen: Math.ceil(diff / 0.25) };
}

/* ---------- Bausteine (tägliche Gewohnheiten) ---------- */

export const BAUSTEINE = [
  { id: 'schritte', label: 'Schritte',   einheit: '',          ziel: 8000, schritt: 500, max: 40000, typ: 'zahl',  icon: 'schritte', tipp: 'Mittags eine Runde gehen.' },
  { id: 'wasser',   label: 'Wasser',     einheit: 'Gläser',    ziel: 8,    schritt: 1,   max: 20,    typ: 'zaehler', icon: 'wasser', tipp: 'Ein Glas vor jeder Mahlzeit.' },
  { id: 'gemuese',  label: 'Gemüse & Obst', einheit: 'Hände voll', ziel: 4, schritt: 1,  max: 15,    typ: 'zaehler', icon: 'gemuese', tipp: 'Eine Handvoll ist eine Portion.' },
  { id: 'eiweiss',  label: 'Eiweiß zu jeder Mahlzeit', einheit: '', ziel: 1, typ: 'janein', icon: 'eiweiss', tipp: 'Quark, Eier, Linsen, Fisch, Tofu' },
  { id: 'bewegung', label: 'Bewegung',   einheit: 'Minuten',   ziel: 20,   schritt: 5,   max: 300,   typ: 'zahl',  icon: 'bewegung', tipp: 'Alles zählt, auch Tanzen.' },
  { id: 'kueche',   label: 'Küche zu nach dem Abendessen', einheit: '', ziel: 1, typ: 'janein', icon: 'kueche', tipp: 'Danach Zähne putzen' },
];

/** Genuss ist kein Baustein mit Ziel: wird nur gezählt, nicht bewertet. */
export const GENUSS = { id: 'genuss', label: 'Genuss-Momente', icon: 'genuss' };

/** ziel: angepasstes Tagesziel (z. B. sanfter Tag), sonst das Standardziel des Bausteins. */
export function bausteinErfuellt(b, wert, ziel = b.ziel) {
  if (wert === undefined || wert === null || wert === '') return false;
  return Number(wert) >= ziel;
}

/** Anzahl erfüllter Bausteine an einem Tag. `ziele` = { bausteinId: ziel } für angepasste Tage. */
export function tagesPunkte(eintrag = {}, ziele = {}, liste = BAUSTEINE) {
  return liste.filter(b => bausteinErfuellt(b, eintrag[b.id], ziele[b.id] ?? b.ziel)).length;
}

/**
 * Die Bausteine, wie Laura sie eingestellt hat: eigene Ziele, ausgeblendete weg, eigene Bausteine hinten dran.
 * @param {{ziele?:object, aus?:string[], eigene?:Array<{id,label,typ,ziel}>}} einst
 */
export function meineBausteine(einst = {}) {
  const aus = einst.aus || [];
  const standard = BAUSTEINE.filter(b => !aus.includes(b.id)).map(b => ({ ...b, ziel: einst.ziele?.[b.id] ?? b.ziel }));
  const eigene = (einst.eigene || []).map(x => ({
    id: x.id, label: x.label, typ: x.typ, ziel: x.typ === 'zaehler' ? x.ziel : 1, einheit: '', schritt: 1, max: 50,
    icon: 'stern', tipp: x.typ === 'janein' ? 'Eigener Baustein' : '', eigen: true,
  }));
  return [...standard, ...eigene];
}

/** Die letzten n Tage bis einschließlich `bis`, älteste zuerst. */
export function letzteTage(bis, n = 7) {
  return Array.from({ length: n }, (_, i) => plusTage(bis, i - n + 1));
}

/* ---------- Formatierung ---------- */

export function kg(wert, stellen = 1) {
  if (!Number.isFinite(wert)) return '–';
  return wert.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

export function datumKurz(key) {
  return keyZuDatum(key).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

export function datumLang(key) {
  return keyZuDatum(key).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function alterAus(geburtsjahr, heute = new Date()) {
  return heute.getFullYear() - geburtsjahr;
}
