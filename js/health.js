// Übernahme von Daten aus der Apple-Health-App über einen Kurzbefehl.
// Web-Apps dürfen nicht direkt auf Health zugreifen. Der Kurzbefehl liest die Werte und kopiert einen Text wie
//   hosenbund;schritte=8.234;gewicht=64,2 kg;bewegung=35
// in die Zwischenablage. Hosenbund liest ihn per Knopfdruck ein (oder über #health=… in der Adresse).

const FELDER = {
  schritte: { ganz: true,  min: 0,  max: 100000, namen: ['schritte', 'steps'] },
  gewicht:  { ganz: false, min: 30, max: 300,    namen: ['gewicht', 'weight', 'kg'] },
  bewegung: { ganz: true,  min: 0,  max: 600,    namen: ['bewegung', 'training', 'trainingsminuten', 'minuten', 'exercise'] },
};

/**
 * Zahl aus einem Text holen, tolerant gegenüber deutschem Format und Einheiten.
 * ganz=true: Punkte/Leerzeichen gelten als Tausendertrenner ("8.234" → 8234).
 */
export function leseZahl(text, ganz) {
  if (text === undefined || text === null) return null;
  const roh = String(text).trim().match(/-?\d[\d.,\s'  ]*/);
  if (!roh) return null;
  let s = roh[0].replace(/[\s'  ]/g, '');
  if (ganz) {
    s = s.split(',')[0];                                   // "8234,0" → "8234"
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');   // "8.234" → "8234"
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');  // "1.064,2" → "1064.2"
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

/**
 * Text aus dem Kurzbefehl auswerten.
 * @returns {{werte: {schritte?, gewicht?, bewegung?}, datum?: string, verworfen: string[]} | null}
 *          null, wenn es kein Hosenbund-Text ist.
 */
export function leseHealthText(text) {
  if (!text || !/hosenbund/i.test(text)) return null;
  const werte = {}, verworfen = [];
  let datum;
  for (const teil of text.split(/[;\n&|]+/)) {
    const m = teil.match(/^\s*([a-zäöüß]+)\s*[=:]\s*(.*)$/i);
    if (!m) continue;
    const schluessel = m[1].toLowerCase(), wert = m[2].trim();
    if (schluessel === 'datum' || schluessel === 'date') {
      const d = wert.match(/(\d{4})-(\d{2})-(\d{2})/) || wert.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (d) datum = d[1].length === 4 ? `${d[1]}-${d[2]}-${d[3]}` : `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}`;
      continue;
    }
    const [feld, def] = Object.entries(FELDER).find(([, f]) => f.namen.includes(schluessel)) || [];
    if (!feld || wert === '') continue;
    const n = leseZahl(wert, def.ganz);
    if (n === null) continue;                 // leer, z. B. heute nicht gewogen
    if (n < def.min || n > def.max) { verworfen.push(feld); continue; }
    werte[feld] = n;
  }
  return { werte, datum, verworfen };
}

/**
 * Werte in einen bestehenden Tageseintrag übernehmen.
 * Schritte: Health ist maßgeblich (überschreibt). Gewicht: überschreibt. Bewegung: das Größere zählt
 * (Training ohne Uhr wird von Hand eingetragen und soll nicht verloren gehen).
 */
export function uebernehmen(eintrag, werte) {
  const neu = { ...eintrag };
  if (werte.schritte !== undefined) neu.schritte = werte.schritte;
  if (werte.gewicht !== undefined) neu.gewicht = werte.gewicht;
  if (werte.bewegung !== undefined) neu.bewegung = Math.max(neu.bewegung || 0, werte.bewegung);
  return neu;
}

/** Kurze Beschreibung für den Hinweis nach der Übernahme. */
export function beschreibe(werte) {
  const teile = [];
  if (werte.schritte !== undefined) teile.push(`${werte.schritte.toLocaleString('de-DE')} Schritte`);
  if (werte.gewicht !== undefined) teile.push(`${String(werte.gewicht).replace('.', ',')} kg`);
  if (werte.bewegung !== undefined) teile.push(`${werte.bewegung} Min. Bewegung`);
  return teile.join(', ');
}

/** Der Text, den der Kurzbefehl erzeugen soll (für die Anleitung). */
export const VORLAGE = 'hosenbund;schritte=[Schritte];gewicht=[Gewicht];bewegung=[Trainingsminuten]';
