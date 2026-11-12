// Beispieldaten für ?demo (zum Ausprobieren und für den Browser-Test).
// Deterministisch (fester Zufallsgenerator), damit Screenshots vergleichbar bleiben.

import { plusTage, keyZuDatum } from './rechner.js';
import { leererZustand } from './store.js';
import { EINHEITEN, standardPlan, satzKey, satzVorlage } from './training.js';

export function erzeugeDemo(heute, tage = 60) {
  let saat = 42;
  let saatForm = 7;
  let saatTraining = 11;
  let saatSport = 23;
  const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
  const start = plusTage(heute, -tage);
  const z = leererZustand();
  z.profil = { name: 'Demo', groesse: 168, geburtsjahr: 1996, startgewicht: 66.5, zielgewicht: 62.5, aktivitaet: 'buero', startdatum: start };
  z.plan = standardPlan();
  z.zyklus = { modus: 'pille-21-7', packungStart: plusTage(heute, -10) };   // heute Pillentag 11, Pausen im Verlauf sichtbar
  let einheit = 'B';
  for (let i = 0; i <= tage; i++) {
    const tag = plusTage(start, i);
    const e = {};
    // ca. 0,35 kg pro Woche runter, ±0,6 kg Wasserschwankung, alle 28 Tage ein kleiner Zyklusbuckel
    if (zufall() < 0.8) {
      // Wasserbuckel in der Pillenpause (passend zu z.zyklus unten: Packungsbeginn = heute − 10)
      const imZyklus = (((i - (tage - 10)) % 28) + 28) % 28;
      const zyklus = imZyklus >= 21 ? 0.5 + (imZyklus === 22 || imZyklus === 23 ? 0.4 : 0) : 0;
      e.gewicht = Math.round((66.5 - i * 0.05 + (zufall() - 0.5) * 1.2 + zyklus) * 10) / 10;
    }
    if (i % 7 === 0) e.bauch = Math.round((84 - i * 0.06 + (zufall() - 0.5)) * 2) / 2;
    if (zufall() < 0.7) e.schritte = Math.round((4000 + zufall() * 8000) / 100) * 100;
    e.wasser = Math.floor(3 + zufall() * 7);
    e.gemuese = Math.floor(1 + zufall() * 5);
    if (zufall() < 0.6) e.eiweiss = 1;
    if (zufall() < 0.5) e.bewegung = 10 + Math.floor(zufall() * 6) * 5;
    if (zufall() < 0.55) e.kueche = 1;
    if (zufall() < 0.5) e.genuss = 1 + Math.floor(zufall() * 2);
    // Trainings an den Plantagen (Di + Sa), A/B im Wechsel, nicht heute (damit „Heute ist Trainingstag“ testbar bleibt)
    if (i < tage && z.plan.tage.includes(keyZuDatum(tag).getDay()) && zufall() < 0.85) {
      einheit = einheit === 'A' ? 'B' : 'A';
      const saetze = {};
      for (const u of EINHEITEN[einheit].uebungen) {
        const v = u.gym;
        saetze[satzKey(u, 'gym')] = satzVorlage(v, u.saetze, null).map((s, k) => ({
          wdh: (v.wdh || v.sek)[1] - (zufall() < 0.3 && k === 2 ? 1 : 0), kg: v.gewicht ? 8 + Math.floor(i / 14) * 2 : null, ok: true }));
      }
      // Tagebuch: Gefühl, ab und zu ein nicht geschaffter letzter Satz (eigener Zufall, damit die übrigen Werte gleich bleiben)
      const r2 = () => (saatTraining = (saatTraining * 69621) % 2147483647) / 2147483647;
      if (r2() < 0.35) { const k = Object.keys(saetze)[Math.floor(r2() * 5)]; saetze[k][saetze[k].length - 1].ok = false; }
      e.training = { einheit, ort: 'gym', fertig: true, saetze, gefuehl: 1 + Math.floor(r2() * 3) };
      if (r2() < 0.25) e.training.notiz = 'Gut geschlafen, lief rund.';
      e.bewegung = Math.max(e.bewegung || 0, 45);
    }
    // Tagesform mit eigenem Zufall, damit die übrigen Demo-Werte gleich bleiben
    const imZ = (((i - (tage - 10)) % 28) + 28) % 28;   // 0-basiert, ab 21 = Pause
    const r = () => (saatForm = (saatForm * 48271) % 2147483647) / 2147483647;
    if (i < tage && r() < 0.75) {
      const b = [];
      if (imZ >= 21 && imZ <= 23 && r() < 0.6) b.push('kraempfe');
      if (imZ >= 22 && imZ <= 25) b.push('blutung');
      if ((imZ >= 19 || imZ <= 1) && r() < 0.45) b.push('wasser');
      if (imZ >= 18 && imZ <= 24 && r() < 0.4) b.push('heisshunger');
      const energie = imZ >= 21 && imZ <= 23 && r() < 0.5 ? 1 : r() < 0.5 ? 2 : 3;
      e.form = { energie, beschwerden: b };
    }
    // Ab und zu Sport (eigener Zufall)
    const r3 = () => (saatSport = (saatSport * 16807) % 2147483647) / 2147483647;
    if (i < tage && !e.training && r3() < 0.15) {
      const art = [['Joggen', 30], ['Yoga', 45], ['Radfahren', 40], ['Schwimmen', 30]][Math.floor(r3() * 4)];
      e.sport = [{ name: art[0], minuten: art[1] }];
      e.bewegung = Math.max(e.bewegung || 0, art[1]);
    }
    z.eintraege[tag] = e;
  }
  return z;
}
