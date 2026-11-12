// Kalorien & Eiweiß: Tagessumme, Richtwerte, Produkte aus Open Food Facts.
// Nur zur Orientierung: keine Wertung, kein Rot. Die Bausteine bleiben die Hauptsache.

import { energie, alterAus } from './rechner.js';

/** Einträge eines Tages: e.gegessen = [{ name, kcal, eiweiss, mahlzeit }] */
export function summe(liste = []) {
  return liste.reduce((s, x) => ({
    kcal: s.kcal + (Number(x.kcal) || 0),
    eiweiss: Math.round((s.eiweiss + (Number(x.eiweiss) || 0)) * 10) / 10,
  }), { kcal: 0, eiweiss: 0 });
}

/** Richtwerte aus dem Profil: sanftes Kalorienziel (≥ 1400) und ca. 1,2 g Eiweiß pro kg. */
export function richtwerte(profil, gewicht) {
  const e = energie({ gewicht, groesse: profil.groesse, alter: alterAus(profil.geburtsjahr), aktivitaet: profil.aktivitaet });
  return { kcal: e.ziel, eiweiss: Math.round(gewicht * 1.2) };
}

/** Passende Mahlzeit zur Uhrzeit (für die Vorauswahl). */
export function mahlzeitJetzt(stunde = new Date().getHours()) {
  if (stunde < 11) return 'fruehstueck';
  if (stunde < 15) return 'mittag';
  if (stunde < 17) return 'snack';
  return 'abend';
}

/** Antwort von Open Food Facts → Lebensmittel im eigenen Format, oder null. */
export function ausOpenFoodFacts(ean, json) {
  const p = json?.product;
  if (!p || json.status === 0) return null;
  const n = p.nutriments || {};
  let kcal = Number(n['energy-kcal_100g']);
  if (!Number.isFinite(kcal) && Number.isFinite(Number(n.energy_100g))) kcal = Number(n.energy_100g) / 4.184;
  if (!Number.isFinite(kcal)) return null;
  const name = [p.product_name_de || p.product_name, p.brands?.split(',')[0]].filter(Boolean).join(' · ').slice(0, 60) || `Produkt ${ean}`;
  const portionG = Number(p.serving_quantity);
  return {
    id: `ean-${ean}`, ean, name, kcal100: Math.round(kcal), ew100: Math.round((Number(n.proteins_100g) || 0) * 10) / 10,
    portion: portionG > 0 ? (p.serving_size || '1 Portion').slice(0, 30) : '100 g', portionG: portionG > 0 ? Math.round(portionG) : 100,
    stichworte: '', marke: p.brands || '',
  };
}

/** Produkt per Barcode laden. Es wird nur die Nummer übertragen. */
export async function ladeProdukt(ean) {
  const felder = 'product_name,product_name_de,brands,nutriments,serving_quantity,serving_size';
  const antwort = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=${felder}`);
  if (antwort.status === 404) return null;
  if (!antwort.ok) throw new Error(`Open Food Facts antwortet nicht (${antwort.status})`);
  return ausOpenFoodFacts(ean, await antwort.json());
}

/** Zuletzt gegessene, verschiedene Einträge (neueste zuerst) für schnelles Wiederholen. */
export function zuletztGegessen(eintraege, bisTag, anzahl = 8) {
  const gesehen = new Set(), erg = [];
  for (const tag of Object.keys(eintraege).filter(t => t <= bisTag).sort().reverse()) {
    for (const x of [...(eintraege[tag].gegessen || [])].reverse()) {
      const k = `${x.name}|${x.kcal}`;
      if (gesehen.has(k)) continue;
      gesehen.add(k); erg.push(x);
      if (erg.length >= anzahl) return erg;
    }
  }
  return erg;
}
