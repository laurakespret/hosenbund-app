// Essen & Kalorien: Karte in „Heute“ und die Ansicht zum Eintragen (Suche, Schnell, Scannen).

import { h, fill, toast, ic } from './ui.js';
import { tagKey, datumLang } from './rechner.js';
import { MAHLZEITEN, REZEPTE } from './rezepte.js';
import { sucheLebensmittel, naehrwerte } from './lebensmittel.js';
import { summe, richtwerte, mahlzeitJetzt, ladeProdukt, zuletztGegessen } from './kalorien.js';
import { leseBild } from './barcode.js';
import { suche } from './bibliothek.js';

const KURZ = { fruehstueck: 'Frühstück', mittag: 'Mittag', abend: 'Abend', snack: 'Snack' };

/** Neuen Eintrag speichern. */
function eintragen(ctx, tag, x) {
  ctx.aendern(z => {
    const e = z.eintraege[tag] ||= {};
    e.gegessen = [...(e.gegessen || []), {
      name: String(x.name).slice(0, 60), kcal: Math.max(0, Math.round(Number(x.kcal) || 0)),
      eiweiss: Math.max(0, Math.round((Number(x.eiweiss) || 0) * 10) / 10), mahlzeit: MAHLZEITEN[x.mahlzeit] ? x.mahlzeit : 'snack',
    }];
  });
}

/* ---------- Karte in „Heute“ ---------- */

/** @param {object} hilfe { gewicht } */
export function essenKarte(ctx, tag, hilfe) {
  const { S, ui, aendern, karte } = ctx;
  const liste = S.eintraege[tag]?.gegessen || [];
  const s = summe(liste);
  const rw = richtwerte(S.profil, hilfe.gewicht);
  const anteil = Math.min(1, s.kcal / rw.kcal);
  const balken = (wert, ziel, klasse) => h('div', { class: `essen-balken ${klasse}`, role: 'img', 'aria-label': `${wert} von ca. ${ziel}` },
    h('div', { style: { width: `${Math.min(100, (wert / ziel) * 100)}%` } }));

  return karte(null,
    h('div', { class: 'karten-kopf' },
      h('h2', {}, 'Essen'),
      h('button', { class: 'knopf klein-knopf', id: 'essen-eintragen', onclick: () => { ui.essenDialog = { tag, tab: 'suche', mahlzeit: mahlzeitJetzt() }; ctx.zeichnen(); window.scrollTo(0, 0); } }, '+ Eintragen')),
    h('div', { class: 'essen-summen' },
      h('div', {},
        h('div', { class: 'essen-zahl' }, h('strong', { id: 'essen-kcal' }, s.kcal.toLocaleString('de-DE')), ` / ca. ${rw.kcal.toLocaleString('de-DE')} kcal`),
        balken(s.kcal, rw.kcal, 'kcal')),
      h('div', {},
        h('div', { class: 'essen-zahl' }, h('strong', { id: 'essen-eiweiss' }, s.eiweiss.toLocaleString('de-DE')), ` / ca. ${rw.eiweiss} g Eiweiß`),
        balken(s.eiweiss, rw.eiweiss, 'eiweiss'))),
    anteil >= 1 && s.kcal > rw.kcal ? h('p', { class: 'hinweis' }, `${(s.kcal - rw.kcal).toLocaleString('de-DE')} kcal über dem Richtwert. Nur zur Info.`) : null,
    liste.length ? h('ul', { class: 'essen-liste' }, Object.keys(MAHLZEITEN).flatMap(m => liste.map((x, i) => [x, i]).filter(([x]) => x.mahlzeit === m).map(([x, i]) =>
      h('li', { 'data-gegessen': i },
        h('span', { class: 'essen-mz' }, KURZ[m]),
        h('span', { class: 'essen-name' }, x.name),
        h('span', { class: 'essen-wert' }, `${x.kcal} kcal`),
        h('button', { class: 'rund klein', 'aria-label': `${x.name} entfernen`, 'data-gegessen-weg': i,
          onclick: () => aendern(z => { const e = z.eintraege[tag]; e.gegessen = e.gegessen.filter((_, j) => j !== i); if (!e.gegessen.length) delete e.gegessen; }) }, '×'))))) : null);
}

/* ---------- Eintragen ---------- */

let kamera = null, scanTakt = null;
function scanStoppen() {
  clearInterval(scanTakt); scanTakt = null;
  kamera?.getTracks().forEach(t => t.stop()); kamera = null;
}

export function essenDialog(ctx) {
  const { S, ui, karte } = ctx;
  const d = ui.essenDialog;
  const schliessen = () => { scanStoppen(); ui.essenDialog = null; ui.essenWahl = null; ctx.zeichnen(); };
  const neu = () => ctx.zeichnen();

  const kopf = [
    h('div', { class: 'detail-kopf' }, h('button', { class: 'link', id: 'essen-zurueck', onclick: schliessen }, '‹ Zurück')),
    h('h1', {}, 'Essen eintragen'),
    d.tag !== tagKey() ? h('p', { class: 'unterzeile' }, datumLang(d.tag)) : null,
    h('div', { class: 'segment essen-mahlzeit', role: 'group', 'aria-label': 'Mahlzeit', 'data-segment': 'mahlzeit' },
      Object.keys(MAHLZEITEN).map(m => h('button', { class: d.mahlzeit === m ? 'an' : null, 'aria-pressed': String(d.mahlzeit === m), 'data-wert': m,
        onclick: () => { d.mahlzeit = m; neu(); } }, KURZ[m]))),
  ];

  // Ausgewähltes Lebensmittel: Menge wählen
  if (ui.essenWahl) return h('div', { class: 'ansicht' }, kopf, mengeKarte(ctx, d, ui.essenWahl));

  const tabs = h('div', { class: 'segment gross', role: 'group', 'aria-label': 'Art', 'data-segment': 'essen-tab' },
    [['suche', 'Suchen'], ['schnell', 'Schnell'], ['scan', 'Scannen']].map(([id, l]) => h('button', {
      class: d.tab === id ? 'an' : null, 'aria-pressed': String(d.tab === id), 'data-wert': id,
      onclick: () => { if (id !== 'scan') scanStoppen(); d.tab = id; neu(); } }, l)));

  const inhalt = d.tab === 'schnell' ? schnellKarte(ctx, d) : d.tab === 'scan' ? scanKarte(ctx, d) : sucheKarte(ctx, d);
  return h('div', { class: 'ansicht' }, kopf, tabs, inhalt);
}

/** Alles Wählbare: Lebensmittel, gescannte Produkte, Rezepte (je Portion). */
function auswahl(S) {
  const produkte = Object.values(S.kalorien?.produkte || {});
  const rezepte = REZEPTE.map(r => ({ id: `rz-${r.id}`, name: r.name, fest: true, kcal: r.kcal, eiweiss: r.eiweiss, portion: '1 Portion', stichworte: 'rezept', rezept: true }));
  return { produkte, rezepte };
}

function sucheKarte(ctx, d) {
  const { S, ui, karte } = ctx;
  const { produkte, rezepte } = auswahl(S);
  const ergebnis = h('div', { class: 'essen-treffer' });
  const zeile = x => h('button', { class: 'treffer-zeile', 'data-essen-wahl': x.id || x.name,
    onclick: () => { ui.essenWahl = x; ui.essenMenge = 1; ctx.zeichnen(); window.scrollTo(0, 0); } },
    h('span', {}, h('strong', {}, x.name), x.rezept ? h('span', { class: 'leise' }, ' · Rezept') : null),
    h('span', { class: 'muskeln' }, x.fest ? `${x.kcal} kcal · ${x.eiweiss} g Eiweiß` : `${x.portion} · ${naehrwerte(x, x.portionG).kcal} kcal`));
  const zeige = text => {
    if (!text.trim()) {
      const zuletzt = zuletztGegessen(S.eintraege, d.tag).map(x => ({ ...x, id: `zl-${x.name}`, fest: true, portion: '1×' }));
      fill(ergebnis, zuletzt.length ? [h('div', { class: 'feld-label' }, 'Zuletzt gegessen'), zuletzt.map(zeile)] : h('p', { class: 'hinweis' }, 'Tippe, was du gegessen hast.'));
      return;
    }
    const treffer = [...sucheLebensmittel(text, produkte), ...suche(text, rezepte)].slice(0, 15);
    fill(ergebnis, treffer.length ? treffer.map(zeile) : h('p', { class: 'hinweis' }, 'Nichts gefunden. Unter „Schnell“ kannst du es frei eintragen.'));
  };
  const feld = h('input', { type: 'search', id: 'essen-suche', placeholder: 'z. B. Brötchen, Apfel, Pizza', value: ui.essenSuche || '', 'aria-label': 'Lebensmittel suchen' });
  feld.addEventListener('input', () => { ui.essenSuche = feld.value; zeige(feld.value); });
  zeige(ui.essenSuche || '');
  return karte(null, feld, ergebnis);
}

function mengeKarte(ctx, d, x) {
  const { ui, karte, zahl } = ctx;
  ui.essenMenge ??= 1;
  const fest = !!x.fest;
  const gramm = fest ? null : Math.round(x.portionG * ui.essenMenge);
  const w = fest ? { kcal: Math.round(x.kcal * ui.essenMenge), eiweiss: Math.round(x.eiweiss * ui.essenMenge * 10) / 10 } : naehrwerte(x, gramm);
  const setze = m => { ui.essenMenge = Math.max(0.25, Math.min(20, Math.round(m * 4) / 4)); ctx.zeichnen(); };
  const grammFeld = fest ? null : h('input', { type: 'text', inputmode: 'numeric', class: 'klein', id: 'essen-gramm', value: gramm, 'aria-label': 'Gramm' });
  grammFeld?.addEventListener('change', () => { const g = zahl(grammFeld.value); if (g > 0) setze(g / x.portionG); });
  return karte(x.name,
    h('div', { class: 'menge-zeile' },
      h('div', { class: 'stepper' },
        h('button', { class: 'rund klein', 'aria-label': 'weniger', onclick: () => setze(ui.essenMenge - 0.5) }, '−'),
        h('output', { id: 'essen-menge' }, `${ui.essenMenge.toLocaleString('de-DE')} × ${x.portion}`),
        h('button', { class: 'rund klein', 'aria-label': 'mehr', onclick: () => setze(ui.essenMenge + 0.5) }, '+')),
      grammFeld ? h('label', { class: 'satz-feld' }, grammFeld, h('span', {}, /getraenk/.test(x.stichworte || '') ? 'ml' : 'g')) : null),
    h('p', { class: 'essen-vorschau' }, h('strong', { id: 'essen-vorschau-kcal' }, `${w.kcal} kcal`), ` · ${w.eiweiss.toLocaleString('de-DE')} g Eiweiß`),
    h('div', { class: 'knopfreihe' },
      h('button', { class: 'link', onclick: () => { ui.essenWahl = null; ui.essenMenge = null; ctx.zeichnen(); } }, '‹ Andere Auswahl'),
      h('button', { class: 'knopf haupt-knopf', id: 'essen-hinzu', onclick: () => {
        eintragen(ctx, d.tag, { name: fest || ui.essenMenge === 1 ? x.name : `${x.name} (${gramm} g)`, kcal: w.kcal, eiweiss: w.eiweiss, mahlzeit: d.mahlzeit });
        toast(`${x.name}: ${w.kcal} kcal`);
        ui.essenWahl = null; ui.essenMenge = null; ui.essenSuche = ''; ui.essenDialog = null; ctx.zeichnen();
      } }, 'Hinzufügen')));
}

function schnellKarte(ctx, d) {
  const { ui, karte, zahl } = ctx;
  const name = h('input', { type: 'text', id: 'schnell-name', maxlength: 60, placeholder: 'z. B. Kuchen bei Oma' });
  const kcal = h('input', { type: 'text', inputmode: 'numeric', id: 'schnell-kcal', placeholder: 'kcal' });
  const ew = h('input', { type: 'text', inputmode: 'decimal', id: 'schnell-eiweiss', placeholder: 'optional' });
  const feld = (l, el) => h('label', { class: 'feld' }, h('span', { class: 'feld-label' }, l), el);
  return karte(null,
    h('div', { class: 'formular' },
      feld('Was?', name),
      h('div', { class: 'zweier' }, feld('kcal', kcal), feld('Eiweiß (g)', ew)),
      h('button', { class: 'knopf haupt-knopf', id: 'schnell-hinzu', onclick: () => {
        const k = Math.round(zahl(kcal.value) ?? NaN);
        if (!(k >= 0 && k <= 5000)) { toast('Bitte kcal eingeben'); return; }
        eintragen(ctx, d.tag, { name: name.value.trim() || 'Eintrag', kcal: k, eiweiss: zahl(ew.value) || 0, mahlzeit: d.mahlzeit });
        toast('Eingetragen');
        ui.essenDialog = null; ctx.zeichnen();
      } }, 'Hinzufügen')));
}

function scanKarte(ctx, d) {
  const { S, ui, aendern, karte } = ctx;
  const status = h('p', { class: 'hinweis', id: 'scan-status', 'aria-live': 'polite' }, 'Strichcode waagerecht ins Bild halten.');
  const video = h('video', { class: 'scan-video', playsinline: true, muted: true, autoplay: true, hidden: true });
  const leinwand = document.createElement('canvas');

  const gefunden = async ean => {
    scanStoppen(); video.hidden = true;
    const gespeichert = S.kalorien?.produkte?.[ean];
    if (gespeichert) { ui.essenWahl = gespeichert; ctx.zeichnen(); return; }
    status.textContent = `${ean} gefunden, lade Nährwerte …`;
    try {
      const p = await ladeProdukt(ean);
      if (!p) { status.textContent = `${ean}: nicht in der Datenbank. Unter „Schnell“ eintragen.`; return; }
      aendern(z => { z.kalorien ||= { produkte: {} }; z.kalorien.produkte = { ...z.kalorien.produkte, [ean]: p }; }, { neuZeichnen: false });
      ui.essenWahl = p; ctx.zeichnen();
    } catch (e) {
      status.textContent = navigator.onLine === false ? 'Keine Internetverbindung.' : 'Datenbank gerade nicht erreichbar.';
    }
  };

  const starten = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { status.textContent = 'Kamera wird hier nicht unterstützt. Nummer unten eintippen.'; return; }
    try {
      kamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
    } catch {
      status.textContent = 'Kein Kamerazugriff. Nummer unten eintippen.'; return;
    }
    video.srcObject = kamera; video.hidden = false;
    await video.play().catch(() => {});
    status.textContent = 'Suche Strichcode …';
    let letzterCode = null;
    const nativ = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['ean_13', 'ean_8'] }) : null;
    scanTakt = setInterval(async () => {
      if (!video.isConnected) { scanStoppen(); return; }
      if (!video.videoWidth) return;
      if (nativ) {
        const r = await nativ.detect(video).catch(() => []);
        if (r[0]?.rawValue) { gefunden(r[0].rawValue); return; }
      }
      const w = Math.min(1280, video.videoWidth), hh = Math.round((video.videoHeight / video.videoWidth) * w);
      leinwand.width = w; leinwand.height = hh;
      const c = leinwand.getContext('2d', { willReadFrequently: true });
      c.drawImage(video, 0, 0, w, hh);
      const code = leseBild(c.getImageData(0, 0, w, hh));
      // Erst übernehmen, wenn zwei Bilder hintereinander denselben Code zeigen
      if (code && code === letzterCode) gefunden(code);
      letzterCode = code;
    }, 200);
  };

  const nummer = h('input', { type: 'text', inputmode: 'numeric', id: 'ean-eingabe', maxlength: 13, placeholder: 'Nummer unter dem Strichcode' });
  return karte(null,
    h('button', { class: 'knopf haupt-knopf breit', id: 'scan-start', onclick: starten }, ic('kamera'), 'Kamera starten'),
    video, status,
    h('div', { class: 'sport-zeile' }, nummer,
      h('button', { class: 'knopf', id: 'ean-suchen', onclick: () => {
        const ean = nummer.value.replace(/\D/g, '');
        if (!/^\d{8}$|^\d{13}$/.test(ean)) { toast('8 oder 13 Ziffern'); return; }
        gefunden(ean);
      } }, 'Suchen')),
    h('p', { class: 'hinweis' }, 'Nährwerte von Open Food Facts. Übertragen wird nur die Nummer.'));
}
