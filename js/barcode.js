// Eigener kleiner Barcode-Leser für EAN-13 und EAN-8, ohne Bibliothek.
// Safari auf dem iPhone hat keine eingebaute Barcode-Erkennung (BarcodeDetector), deshalb lesen wir
// mehrere waagerechte Linien aus dem Kamerabild, messen die Strichbreiten und prüfen die Prüfziffer.

const L = ['3211', '2221', '2122', '1411', '1132', '1231', '1114', '1312', '1213', '3112'];
const G = L.map(s => [...s].reverse().join(''));
const PARITAET = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** Stimmt die letzte Ziffer (Prüfziffer) einer EAN? */
export function pruefzifferOk(code) {
  if (!/^\d{8}$|^\d{13}$/.test(code)) return false;
  const z = [...code].map(Number);
  const pruef = z.pop();
  const summe = z.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (summe % 10)) % 10 === pruef;
}

/** 4 Breiten → Muster aus 7 Modulen, z. B. „3211“. */
function ziffernMuster(w) {
  const t = w.reduce((a, b) => a + b, 0);
  const genau = w.map(x => (x * 7) / t);
  const m = genau.map(x => Math.max(1, Math.round(x)));
  let diff = 7 - m.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const s = Math.sign(diff);
    let best = -1, bestFehler = -Infinity;
    m.forEach((x, i) => { const f = (genau[i] - x) * s; if (f > bestFehler && x + s >= 1) { bestFehler = f; best = i; } });
    if (best < 0) return null;
    m[best] += s; diff -= s;
  }
  return m.join('');
}

// Kante-zu-gleicher-Kante-Abstände (t1 = e1+e2, t2 = e2+e3): Standardverfahren für Strichcodes,
// unempfindlich gegen Unschärfe und „verlaufende“ Striche. 1/7 und 2/8 unterscheidet die Strichbreite.
const kandidaten = (codes, typ) => codes.map((p, d) => { const a = [...p].map(Number); return { d, typ, a, t1: a[0] + a[1], t2: a[1] + a[2] }; });
const LINKS13 = [...kandidaten(L, 'L'), ...kandidaten(G, 'G')];
const NUR_L = kandidaten(L, 'L');

function ziffer(w, liste, dunkel) {
  const t = w.reduce((a, b) => a + b, 0);
  const e = w.map(x => (x * 7) / t);
  const t1 = Math.round(e[0] + e[1]), t2 = Math.round(e[1] + e[2]);
  const passend = liste.filter(k => k.t1 === t1 && k.t2 === t2);
  if (passend.length) {
    const balken = e[dunkel[0]] + e[dunkel[1]];
    return passend.reduce((b, k) => Math.abs(k.a[dunkel[0]] + k.a[dunkel[1]] - balken) < Math.abs(b.a[dunkel[0]] + b.a[dunkel[1]] - balken) ? k : b);
  }
  // Rückfall: einzelne Breiten runden
  const m = ziffernMuster(w);
  return liste.find(k => k.a.join('') === m) || null;
}

function waechterOk(breiten, modul) {
  return breiten.every(b => b > modul * 0.45 && b < modul * 1.9);
}

/** Läufe (abwechselnd dunkel/hell, beginnend mit dunkel) → EAN oder null. */
function dekodiere(r) {
  if (r.length >= 59) {
    const w = r.slice(0, 59), modul = w.reduce((a, b) => a + b, 0) / 95;
    if (waechterOk(w.slice(0, 3), modul) && waechterOk(w.slice(27, 32), modul) && waechterOk(w.slice(56, 59), modul)) {
      let links = '', par = '', rechts = '', ok = true;
      for (let i = 0; i < 6 && ok; i++) {
        const z = ziffer(w.slice(3 + i * 4, 7 + i * 4), LINKS13, [1, 3]);   // Lücke, Strich, Lücke, Strich
        if (z) { links += z.d; par += z.typ; } else ok = false;
      }
      for (let i = 0; i < 6 && ok; i++) {
        const z = ziffer(w.slice(32 + i * 4, 36 + i * 4), NUR_L, [0, 2]);   // Strich, Lücke, Strich, Lücke
        if (z) rechts += z.d; else ok = false;
      }
      const erste = PARITAET.indexOf(par);
      if (ok && erste >= 0) {
        const code = `${erste}${links}${rechts}`;
        if (pruefzifferOk(code)) return code;
      }
    }
  }
  if (r.length >= 43) {
    const w = r.slice(0, 43), modul = w.reduce((a, b) => a + b, 0) / 67;
    if (waechterOk(w.slice(0, 3), modul) && waechterOk(w.slice(19, 24), modul) && waechterOk(w.slice(40, 43), modul)) {
      let code = '';
      for (let i = 0; i < 4; i++) { const z = ziffer(w.slice(3 + i * 4, 7 + i * 4), NUR_L, [1, 3]); if (!z) return null; code += z.d; }
      for (let i = 0; i < 4; i++) { const z = ziffer(w.slice(24 + i * 4, 28 + i * 4), NUR_L, [0, 2]); if (!z) return null; code += z.d; }
      if (pruefzifferOk(code)) return code;
    }
  }
  return null;
}

/** Eine Bildzeile (Helligkeiten 0–255) lesen. Versucht zwei Schwellen und beide Leserichtungen. */
export function leseZeile(grau) {
  return leseZeileKanten(grau) || leseZeileMit(grau, 0.5) || leseZeileMit(grau, 1);
}

/** Läufe → Code, beide Leserichtungen, ab jedem dunklen Lauf. */
function versuche(laeufe) {
  for (const reihe of [laeufe, [...laeufe].reverse()]) {
    for (let i = 0; i < reihe.length; i++) {
      if (!reihe[i].d) continue;
      const code = dekodiere(reihe.slice(i, i + 59).map(x => x.b));
      if (code) return code;
    }
  }
  return null;
}

/**
 * Kanten-Methode: Kanten liegen dort, wo sich die Helligkeit am stärksten ändert (Maximum der Steigung).
 * Unabhängig von einer Schwelle, deshalb robust bei Unschärfe und hellen Rändern.
 */
function leseZeileKanten(grau) {
  const n = grau.length;
  if (n < 50) return null;
  // Steigung, leicht geglättet
  const s = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) s[i] = (grau[i + 1] - grau[i - 1]) / 2;
  const g = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) g[i] = (s[i - 1] + 2 * s[i] + s[i + 1]) / 4;
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(g[i]));
  if (max < 10) return null;
  const schwelle = max * 0.12;
  // Lokale Extrema der Steigung → Kanten (negativ: hell→dunkel, positiv: dunkel→hell)
  const roh = [];
  for (let i = 2; i < n - 2; i++) {
    const v = g[i];
    if (Math.abs(v) < schwelle) continue;
    if (v < 0 ? (v <= g[i - 1] && v < g[i + 1]) : (v >= g[i - 1] && v > g[i + 1])) {
      const a = g[i - 1], b = g[i + 1], nenner = a - 2 * v + b;
      roh.push({ pos: i + (nenner ? (a - b) / (2 * nenner) : 0), neg: v < 0, staerke: Math.abs(v) });
    }
  }
  // Gleiche Richtung hintereinander: nur die stärkste Kante behalten
  const kanten = [];
  for (const k of roh) {
    const letzte = kanten[kanten.length - 1];
    if (letzte && letzte.neg === k.neg) { if (k.staerke > letzte.staerke) kanten[kanten.length - 1] = k; }
    else kanten.push(k);
  }
  if (kanten.length < 44) return null;
  // Zwischen hell→dunkel und dunkel→hell liegt ein Strich, sonst eine Lücke
  const laeufe = [];
  for (let i = 0; i < kanten.length - 1; i++) laeufe.push({ d: kanten[i].neg ? 1 : 0, b: kanten[i + 1].pos - kanten[i].pos });
  return versuche(laeufe);
}

/** gewichtGlobal: 0 = nur lokaler Durchschnitt, 1 = halb lokal, halb globale Mitte */
function leseZeileMit(grau, gewichtGlobal) {
  const n = grau.length;
  let min = 255, max = 0;
  for (const g of grau) { if (g < min) min = g; if (g > max) max = g; }
  if (max - min < 40) return null;
  // Schwelle: Mittel aus lokalem Durchschnitt und globaler Mitte (hilft bei ungleichmäßigem Licht)
  const k = Math.max(8, Math.round(n / 30));
  const summe = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) summe[i + 1] = summe[i] + grau[i];
  const mitte = (min + max) / 2;
  // Schwelle je Pixel; Kanten mit Subpixel-Genauigkeit (lineare Interpolation), damit auch
  // schmale Striche (2 px) genau genug gemessen werden.
  const diff = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - k), b = Math.min(n, i + k + 1);
    const lokal = (summe[b] - summe[a]) / (b - a);
    diff[i] = grau[i] - (lokal * (1 - gewichtGlobal / 2) + mitte * (gewichtGlobal / 2));   // < 0 = dunkel
  }
  const laeufe = [];
  let kante = 0, dunkelJetzt = diff[0] < 0;
  for (let i = 1; i < n; i++) {
    const d = diff[i] < 0;
    if (d !== dunkelJetzt) {
      const pos = i - 1 + diff[i - 1] / (diff[i - 1] - diff[i]);   // Nulldurchgang zwischen i-1 und i
      laeufe.push({ d: dunkelJetzt ? 1 : 0, b: pos - kante });
      kante = pos; dunkelJetzt = d;
    }
  }
  laeufe.push({ d: dunkelJetzt ? 1 : 0, b: n - kante });
  return versuche(laeufe);
}

/** Aus ImageData mehrere Zeilen um die Mitte lesen. Ergebnis: EAN oder null. */
export function leseBild(bild, zeilen = 21) {
  const { width: w, height: h, data } = bild;
  const treffer = {};
  for (let z = 0; z < zeilen; z++) {
    const y = Math.round(h * (0.3 + (0.4 * z) / Math.max(1, zeilen - 1)));
    // 5 benachbarte Zeilen mitteln: glättet Rauschen, die Striche sind ja senkrecht
    const grau = new Float32Array(w);
    const ys = [-2, -1, 0, 1, 2].map(d => Math.min(h - 1, Math.max(0, y + d)));
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (const yy of ys) { const o = (yy * w + x) * 4; s += (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000; }
      grau[x] = s / ys.length;
    }
    const code = leseZeile(grau);
    if (code) { treffer[code] = (treffer[code] || 0) + 1; if (treffer[code] >= 2) return code; }
  }
  return null;   // nur bestätigte Treffer (mind. 2 Zeilen gleich), damit nichts Falsches eingetragen wird
}

/** Modulfolge ('1' = Strich) für Tests: EAN-13 oder EAN-8 zeichnen. */
export function muster(code) {
  const R = d => L[d].split('').map(Number);
  const bits = (breiten, startDunkel) => breiten.map((b, i) => String((i % 2 === 0) === startDunkel ? 1 : 0).repeat(b)).join('');
  if (code.length === 8) {
    let s = '101';
    for (let i = 0; i < 4; i++) s += bits(R(+code[i]), false);
    s += '01010';
    for (let i = 4; i < 8; i++) s += bits(R(+code[i]), true);
    return s + '101';
  }
  const par = PARITAET[+code[0]];
  let s = '101';
  for (let i = 0; i < 6; i++) {
    const d = +code[i + 1];
    s += bits(par[i] === 'L' ? R(d) : G[d].split('').map(Number), false);
  }
  s += '01010';
  for (let i = 7; i < 13; i++) s += bits(R(+code[i]), true);
  return s + '101';
}
