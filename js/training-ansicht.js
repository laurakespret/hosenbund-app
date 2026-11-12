// Ansicht „Training“: Wochenplan, Start einer Einheit und die laufende Einheit mit Sätzen und Pausentimer.

import { h, fill, toast, ic } from './ui.js';
import { tagKey, datumKurz } from './rechner.js';
import {
  EINHEITEN, ORTE, ABKUEHLEN, WOCHENTAGE, DAUER_MIN, PAUSE_SEK, LEICHT, standardPlan, satzKey, istTrainingstag,
  trainings, naechsteEinheit, letzteSaetze, steigern, wochenStand, satzVorlage, MUSKELN, GEFUEHL,
} from './training.js';
import { SANFT_MINUTEN } from './zyklus.js';
import { ansichtFortschritt } from './training-statistik.js';
import { katalog, suche, SPORTARTEN, einheitenAlle, entwurfFuer, ART_LABEL } from './bibliothek.js';

/**
 * @param {object} ctx  { S, ui, aendern, zeichnen, karte, kachel, zahl, komma, stufe(tag) }
 */
export function ansichtTraining(ctx) {
  const { S } = ctx;
  const heute = tagKey();
  const laufend = S.eintraege[heute]?.training;
  if (laufend && !laufend.fertig) return laufendeEinheit(ctx, heute, laufend);
  if (ctx.ui.editor) return editorAnsicht(ctx);
  const tab = ctx.ui.trainingTab || 'plan';
  const kopf = [
    h('h1', {}, 'Training'),
    h('div', { class: 'segment gross', role: 'group', 'aria-label': 'Ansicht', 'data-segment': 'training' },
      [['plan', 'Training'], ['fortschritt', 'Fortschritt']].map(([id, l]) => h('button', {
        class: tab === id ? 'an' : null, 'aria-pressed': String(tab === id), 'data-wert': id,
        onclick: () => { ctx.ui.trainingTab = id; ctx.zeichnen(); },
      }, l))),
  ];
  if (tab === 'fortschritt') return h('div', { class: 'ansicht' }, kopf, ansichtFortschritt(ctx, { pille: ctx.pille }));
  const ansicht = uebersicht(ctx, heute);
  ansicht.firstChild.replaceWith(...kopf);
  return ansicht;
}

/* ---------- Übersicht ---------- */

function uebersicht(ctx, heute) {
  const { S, ui, aendern, karte, kachel } = ctx;
  const alle = ctx.einheiten();
  const plan = S.plan || standardPlan();
  const stand = wochenStand(S.eintraege, plan, heute);
  const naechste = naechsteEinheit(S.eintraege, heute);
  const heuteFertig = S.eintraege[heute]?.training?.fertig ? S.eintraege[heute].training : null;
  ui.trainingWahl ||= {};
  const stufe = ctx.stufe(heute);
  // Vorauswahl nach Tagesform: Ruhe → Sanft & Mobility, sanft → leichte Variante. Eigene Wahl hat Vorrang.
  if (ui.trainingWahl.einheit && !alle[ui.trainingWahl.einheit]) delete ui.trainingWahl.einheit;
  const wahl = {
    einheit: ui.trainingWahl.einheit || (stufe.stufe === 'ruhe' ? 'S' : naechste),
    ort: ui.trainingWahl.ort || plan.ort,
    leicht: ui.trainingWahl.leicht ?? stufe.stufe !== 'normal',
  };

  // Wochenplan: Mo–So als Schalter
  const reihenfolge = [1, 2, 3, 4, 5, 6, 0];
  const wochenplan = karte('Dein Wochenplan',
    h('div', { class: 'tage-wahl', role: 'group', 'aria-label': 'Trainingstage' },
      reihenfolge.map(d => {
        const an = plan.tage.includes(d);
        return h('button', {
          class: 'tag-knopf' + (an ? ' an' : ''), 'aria-pressed': String(an), 'data-tag': d,
          onclick: () => aendern(z => {
            const p = z.plan || standardPlan();
            p.tage = an ? p.tage.filter(x => x !== d) : [...p.tage, d].sort();
            z.plan = p;
          }),
        }, WOCHENTAGE[d]);
      })),
    h('p', { class: 'hinweis' }, plan.tage.length === 2
      ? 'Am besten mit Ruhetag dazwischen.'
      : `${plan.tage.length} Tage gewählt, geplant sind 2.`),
    h('div', { class: 'feld-label', style: { marginTop: '12px' } }, 'Wo trainierst du meistens?'),
    segment(ORTE, plan.ort, ort => aendern(z => { z.plan = { ...(z.plan || standardPlan()), ort }; ui.trainingWahl.ort = ort; }), 'ort-standard'));

  let heuteKarte;
  if (heuteFertig) {
    heuteKarte = karte('Heute', h('p', { class: 'lob' }, ic('haken'), `${alle[heuteFertig.einheit]?.name || heuteFertig.name || 'Training'} erledigt. Stark!`),
      tagebuch(ctx, heute, heuteFertig));
  } else {
    const e = alle[wahl.einheit];
    const leicht = wahl.leicht && !e.sanft;
    heuteKarte = karte(istTrainingstag(plan, heute) ? 'Heute ist Trainingstag' : 'Training starten',
      stufe.stufe !== 'normal'
        ? h('div', { class: 'sanft-hinweis' }, ic('wohl'), h('strong', {}, stufe.stufe === 'ruhe' ? 'Heute zählt Erholung. ' : 'Heute darf es sanfter sein. '),
            stufe.stufe === 'ruhe' ? 'Tipp: „Sanft“.' : 'Tipp: leichte Variante oder „Sanft“.')
        : null,
      h('div', { class: 'auswahl-stapel' },
        h('div', {}, h('div', { class: 'feld-label' }, 'Einheit'),
          segment(Object.fromEntries(Object.entries(alle).map(([id, x]) => [id, id === 'S' ? 'Sanft' : x.eigen ? x.name : id])), wahl.einheit,
            x => { ui.trainingWahl.einheit = x; ctx.zeichnen(); }, 'einheit')),
        h('div', {}, h('div', { class: 'feld-label' }, 'Ort'),
          e.sanft ? h('p', { class: 'hinweis' }, 'Überall möglich') : segment(ORTE, wahl.ort, x => { ui.trainingWahl.ort = x; ctx.zeichnen(); }, 'ort'))),
      e.sanft ? null : h('label', { class: 'schalter' },
        h('input', { type: 'checkbox', id: 'leicht', checked: wahl.leicht, onchange: ev => { ui.trainingWahl.leicht = ev.target.checked; ctx.zeichnen(); } }),
        h('span', {}, h('strong', {}, 'Leichte Variante'), ` · ${LEICHT.saetze} Sätze, 80 % Gewicht`)),
      h('p', {}, h('strong', {}, e.name), ` · ${e.fokus} · ca. ${e.sanft ? SANFT_MINUTEN : leicht ? 30 : DAUER_MIN} Min.`),
      h('ol', { class: 'uebungsliste' }, e.uebungen.map(u => h('li', {}, u[wahl.ort].name, h('span', { class: 'leise' }, ` ${schema(u, wahl.ort, leicht)}`)))),
      h('button', { class: 'knopf haupt-knopf breit', id: 'training-starten', onclick: () => starten(ctx, heute, { ...wahl, leicht }, alle) }, `${e.name}${leicht ? ' (leicht)' : ''} starten`));
  }

  return h('div', { class: 'ansicht' },
    h('h1', {}, 'Training'),
    h('div', { class: 'kacheln' },
      kachel('Diese Woche', `${stand.erledigt} von ${stand.geplant}`, stand.erledigt >= stand.geplant && stand.geplant ? 'Wochenziel geschafft' : 'Einheiten (Mo–So)'),
      kachel('Als Nächstes', alle[naechste].name, alle[naechste].fokus)),
    heuteKarte,
    sportKarte(ctx, heute),
    einheitenKarte(ctx, alle),
    wochenplan,
    uebungsKatalog(ctx, plan),
    h('aside', { class: 'tipp' }, 'Technik vor Gewicht. Bei Schmerzen abbrechen.'));
}

function segment(optionen, aktiv, setze, name) {
  return h('div', { class: 'segment' + (Object.keys(optionen).length > 3 ? ' segment-scroll' : ''), role: 'group', 'data-segment': name },
    Object.entries(optionen).map(([id, label]) => h('button', {
      class: id === aktiv ? 'an' : null, 'aria-pressed': String(id === aktiv), 'data-wert': id, onclick: () => setze(id),
    }, label)));
}

function schema(u, ort, leicht = false) {
  const v = u[ort];
  const [a, b] = v.wdh || v.sek;
  const saetze = leicht ? Math.min(u.saetze, LEICHT.saetze) : u.saetze;
  return `${saetze} × ${a}–${b}${v.sek ? ' Sek.' : ''}${v.proSeite ? ' je Seite' : ''}`;
}

function starten(ctx, heute, wahl, alle) {
  const e = alle[wahl.einheit];
  ctx.aendern(z => {
    const saetze = {};
    for (const u of e.uebungen) {
      const key = satzKey(u, wahl.ort);
      saetze[key] = satzVorlage(u[wahl.ort], u.saetze, letzteSaetze(z.eintraege, key, heute), wahl.leicht);
    }
    const training = { einheit: wahl.einheit, ort: wahl.ort, fertig: false, saetze, start: Date.now() };
    if (e.eigen) training.name = e.name;   // bleibt lesbar, auch wenn die Einheit später gelöscht wird
    if (wahl.leicht) training.leicht = true;
    z.eintraege[heute] = { ...(z.eintraege[heute] || {}), training };
  });
  window.scrollTo(0, 0);
}

/* ---------- Laufende Einheit ---------- */

function laufendeEinheit(ctx, heute, t) {
  const { S, karte, aendern, zahl, komma } = ctx;
  const e = ctx.einheiten()[t.einheit];
  if (!e) return h('div', { class: 'ansicht' }, h('h1', {}, 'Training'), karte(null, h('p', {}, 'Diese Einheit gibt es nicht mehr.'),
    h('button', { class: 'knopf', onclick: () => aendern(z => { delete z.eintraege[heute].training; }) }, 'Training verwerfen')));

  const setzeT = (fn, neuZeichnen = true) => aendern(z => fn(z.eintraege[heute].training), { neuZeichnen });
  const haken = (feld, label, text) => h('div', { class: 'schritt' + (t[feld] ? ' erledigt' : '') },
    h('button', { class: 'haken' + (t[feld] ? ' an' : ''), role: 'switch', 'aria-checked': String(!!t[feld]), 'aria-label': label, 'data-schritt': feld,
      onclick: () => setzeT(x => { x[feld] = !x[feld]; }) }, t[feld] ? ic('haken') : ''),
    h('div', {}, h('div', { class: 'b-label' }, label), h('div', { class: 'schritt-text' }, text)));

  const uebungKarten = e.uebungen.map((u, nr) => {
    const v = u[t.ort], key = satzKey(u, t.ort);
    const saetze = t.saetze[key] || [];
    const letzte = letzteSaetze(S.eintraege, key, heute);
    const hoch = !t.leicht && !e.sanft && steigern(v, letzte?.saetze, u.saetze);
    const einheitWdh = v.sek ? 'Sek.' : 'Wdh.';
    return karte(null,
      h('div', { class: 'uebung-kopf' },
        h('span', { class: 'nummer' }, String(nr + 1)),
        h('div', {}, h('h2', {}, v.name), h('div', { class: 'leise' }, schema(u, t.ort)))),
      letzte
        ? h('p', { class: 'letztes-mal' }, `Letztes Mal (${datumKurz(letzte.tag)}): `,
            letzte.saetze.filter(s => s.ok).map(s => `${s.wdh}${v.gewicht && s.kg ? ` × ${komma(s.kg)} kg` : ''}`).join(' · '))
        : v.start ? h('p', { class: 'letztes-mal' }, v.start) : null,
      hoch ? h('p', { class: 'steigern' }, ic('hoch'), v.gewicht ? 'Heute 1–2 kg mehr probieren.' : 'Zeit für die schwerere Variante.') : null,
      h('details', { class: 'so-gehts' }, h('summary', {}, 'So geht’s'), h('p', {}, v.tipp)),
      h('div', { class: 'saetze' }, saetze.map((s, i) => {
        const wdh = h('input', { type: 'text', inputmode: 'numeric', class: 'klein', value: s.wdh ?? '', 'aria-label': `Satz ${i + 1} ${einheitWdh}`, 'data-satz': `${key}-${i}-wdh` });
        wdh.addEventListener('change', () => setzeT(x => { x.saetze[key][i].wdh = zahl(wdh.value); }, false));
        let kg = null;
        if (v.gewicht) {
          kg = h('input', { type: 'text', inputmode: 'decimal', class: 'klein', value: komma(s.kg), placeholder: 'kg', 'aria-label': `Satz ${i + 1} kg`, 'data-satz': `${key}-${i}-kg` });
          kg.addEventListener('change', () => setzeT(x => { x.saetze[key][i].kg = zahl(kg.value); }, false));
        }
        return h('div', { class: 'satz' + (s.ok ? ' ok' : '') },
          h('span', { class: 'satz-nr' }, `Satz ${i + 1}`),
          h('label', { class: 'satz-feld' }, wdh, h('span', {}, einheitWdh)),
          kg ? h('label', { class: 'satz-feld' }, kg, h('span', {}, 'kg')) : h('span', { class: 'satz-feld' }),
          h('button', { class: 'haken' + (s.ok ? ' an' : ''), 'aria-label': `Satz ${i + 1} geschafft`, 'data-ok': `${key}-${i}`,
            onclick: () => {
              const warOk = s.ok;   // vorher merken: setzeT ändert genau dieses Objekt
              // Werte aus den Feldern übernehmen (falls „change“ noch nicht gefeuert hat)
              setzeT(x => {
                const satz = x.saetze[key][i];
                satz.wdh = zahl(wdh.value) ?? satz.wdh;
                if (kg) satz.kg = zahl(kg.value);
                satz.ok = !warOk;
              });
              if (!warOk) pauseStarten();
            } }, s.ok ? ic('haken') : ''));
      })));
  });

  const fertigeSaetze = Object.values(t.saetze).flat().filter(s => s.ok).length;
  const alleSaetze = Object.values(t.saetze).flat().length;

  return h('div', { class: 'ansicht' },
    h('div', { class: 'einheit-kopf' },
      h('div', {}, h('h1', {}, e.name), h('div', { class: 'unterzeile' }, `${e.sanft ? 'Sanft' : ORTE[t.ort]}${t.leicht ? ' · leichte Variante' : ''} · ${fertigeSaetze} von ${alleSaetze} Sätzen`)),
      h('button', { class: 'link', onclick: () => {
        if (confirm('Training abbrechen? Die eingetragenen Sätze von heute werden verworfen.')) aendern(z => { delete z.eintraege[heute].training; });
      } }, 'Abbrechen')),
    h('div', { class: 'fortschritt', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': alleSaetze, 'aria-valuenow': fertigeSaetze },
      h('div', { style: { width: `${alleSaetze ? (fertigeSaetze / alleSaetze) * 100 : 0}%` } })),
    karte(null, haken('aufgewaermt', e.sanft ? 'Spaziergang · 10–15 Min.' : 'Aufwärmen · 5 Min.', e.aufwaermen[t.ort])),
    uebungKarten,
    karte(null, haken('finisher', e.sanft ? 'Zum Schluss' : t.leicht ? 'Ausklang' : 'Finisher · Puls hoch', t.leicht ? LEICHT.finisher : e.finisher[t.ort])),
    karte(null, haken('abgekuehlt', 'Dehnen · 3 Min.', ABKUEHLEN)),
    h('button', { class: 'knopf haupt-knopf breit', id: 'training-fertig', onclick: () => abschliessen(ctx, heute, fertigeSaetze) }, 'Training abschließen'));
}

function abschliessen(ctx, heute, fertigeSaetze) {
  if (fertigeSaetze === 0 && !confirm('Noch kein Satz abgehakt. Trotzdem abschließen?')) return;
  pauseStoppen();
  ctx.aendern(z => {
    const e = z.eintraege[heute];
    e.training.fertig = true;
    const minuten = e.training.start ? Math.round((Date.now() - e.training.start) / 60000) : DAUER_MIN;
    delete e.training.start;
    // Training zählt als Bewegung (mind. so viel wie gedauert, höchstens 120 Min.)
    e.bewegung = Math.max(e.bewegung || 0, Math.min(120, Math.max(20, minuten)));
  });
  toast('Training geschafft!');
  window.scrollTo(0, 0);
}

/* ---------- Pausentimer (unabhängig vom Neuzeichnen) ---------- */

let pauseBis = 0, pauseTakt = null;

function pauseStarten() {
  pauseBis = Date.now() + PAUSE_SEK * 1000;
  clearInterval(pauseTakt);
  pauseTakt = setInterval(pauseAnzeigen, 250);
  pauseAnzeigen();
}

function pauseStoppen() {
  pauseBis = 0;
  clearInterval(pauseTakt);
  pauseAnzeigen();
}

function pauseAnzeigen() {
  const el = document.getElementById('pause');
  if (!el) return;
  const rest = Math.ceil((pauseBis - Date.now()) / 1000);
  if (rest <= 0) {
    if (pauseBis) { toast('Pause vorbei, weiter geht’s!'); navigator.vibrate?.(200); }
    pauseBis = 0; clearInterval(pauseTakt);
    el.hidden = true;
    return;
  }
  el.hidden = false;
  fill(el,
    h('span', {}, ic('uhr'), 'Pause '), h('strong', {}, `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}`),
    h('button', { class: 'link', onclick: pauseStoppen }, 'Überspringen'));
}

/* ---------- Übungs-Katalog mit Suche ---------- */

function uebungsKarte(v, id, muskeln) {
  return h('details', { class: 'uebung-info', 'data-uebung': id },
    h('summary', {}, h('strong', {}, v.name), h('span', { class: 'muskeln' }, muskeln || '')),
    h('p', {}, v.tipp),
    v.start ? h('p', { class: 'leise' }, v.start) : null);
}

function uebungsKatalog(ctx, plan) {
  const { S, ui, karte } = ctx;
  ui.katalogOrt ||= plan.ort;
  const ort = ui.katalogOrt;
  const kat = katalog(S.training?.uebungen || []);
  const ergebnis = h('div', { class: 'katalog-ergebnis' });
  const zeige = text => {
    fill(ergebnis, text.trim()
      ? (() => { const treffer = suche(text, kat); return treffer.length
          ? treffer.slice(0, 20).map(k => uebungsKarte(k[ort], k.id, k.muskeln))
          : h('p', { class: 'hinweis' }, 'Nichts gefunden.'); })()
      : Object.values(EINHEITEN).map(e => [
          h('h3', { class: 'katalog-gruppe' }, e.name),
          e.uebungen.map(u => uebungsKarte(u[ort], u.id, MUSKELN[u.id])),
        ]));
  };
  const feld = h('input', { type: 'search', id: 'uebung-suche', placeholder: `${kat.length} Übungen durchsuchen`, value: ui.katalogSuche || '', 'aria-label': 'Übungen suchen' });
  feld.addEventListener('input', () => { ui.katalogSuche = feld.value; zeige(feld.value); });
  zeige(ui.katalogSuche || '');
  return karte('Alle Übungen',
    feld,
    segment(ORTE, ort, x => { ui.katalogOrt = x; ctx.zeichnen(); }, 'katalog-ort'),
    ergebnis);
}

/* ---------- Sport eintragen ---------- */

function sportKarte(ctx, heute) {
  const { S, ui, aendern, karte, zahl } = ctx;
  const liste = S.eintraege[heute]?.sport || [];
  const ergebnis = h('div', { class: 'chips sport-treffer' });
  const minuten = h('input', { type: 'text', inputmode: 'numeric', id: 'sport-minuten', value: '30', 'aria-label': 'Minuten' });
  const feld = h('input', { type: 'search', id: 'sport-suche', placeholder: 'z. B. Joggen, Yoga, Schwimmen', value: ui.sportSuche || '', 'aria-label': 'Sportart suchen' });

  const eintragen = name => {
    const min = Math.round(zahl(minuten.value) ?? NaN);
    if (!(min >= 1 && min <= 600)) { toast('Bitte Minuten eingeben'); return; }
    ui.sportSuche = '';
    aendern(z => {
      const e = z.eintraege[heute] ||= {};
      e.sport = [...(e.sport || []), { name: name.slice(0, 40), minuten: min }];
      e.bewegung = Math.min(300, (e.bewegung || 0) + min);
    });
    toast(`${name}: ${min} Min. eingetragen`);
  };
  const zeige = text => {
    const treffer = text.trim() ? suche(text, SPORTARTEN).slice(0, 6) : SPORTARTEN.slice(0, 6);
    fill(ergebnis,
      treffer.map(s => h('button', { class: 'chip', 'data-sport': s.id, onclick: () => eintragen(s.name) }, ic('bewegung'), s.name)),
      text.trim() && !treffer.some(s => s.name.toLowerCase() === text.trim().toLowerCase())
        ? h('button', { class: 'chip', id: 'sport-eigen', onclick: () => eintragen(text.trim()) }, `+ „${text.trim()}“`) : null);
  };
  feld.addEventListener('input', () => { ui.sportSuche = feld.value; zeige(feld.value); });
  zeige(ui.sportSuche || '');

  return karte('Sport eintragen',
    h('div', { class: 'sport-zeile' }, feld, h('label', { class: 'satz-feld' }, minuten, h('span', {}, 'Min.'))),
    ergebnis,
    liste.length ? h('ul', { class: 'sport-liste' }, liste.map((s, i) => h('li', {},
      ic('bewegung'), h('span', {}, `${s.name} · ${s.minuten} Min.`),
      h('button', { class: 'rund klein', 'aria-label': `${s.name} entfernen`, 'data-sport-weg': i, onclick: () => aendern(z => {
        const e = z.eintraege[heute];
        e.sport = e.sport.filter((_, j) => j !== i);
        e.bewegung = Math.max(0, (e.bewegung || 0) - (Number(s.minuten) || 0));
        if (!e.sport.length) delete e.sport;
      }) }, '×')))) : null);
}

/* ---------- Meine Einheiten ---------- */

function einheitenKarte(ctx, alle) {
  const { ui, karte } = ctx;
  const oeffne = id => { ui.editor = entwurfFuer(id, ctx.S.training); ui.editorSuche = ''; ctx.zeichnen(); window.scrollTo(0, 0); };
  return karte('Meine Einheiten',
    h('ul', { class: 'verlauf-liste einheiten-liste' }, Object.entries(alle).filter(([id]) => id !== 'S').map(([id, e]) => h('li', {},
      h('span', {}, h('strong', {}, e.name), e.angepasst ? h('span', { class: 'leise' }, ' · angepasst') : null),
      h('button', { class: 'link', 'data-bearbeiten': id, onclick: () => oeffne(id) }, 'Bearbeiten')))),
    h('button', { class: 'knopf breit', id: 'einheit-neu', onclick: () => oeffne(`x-${Date.now().toString(36)}`) }, '+ Neue Einheit'));
}

/* ---------- Editor für Einheiten ---------- */

function editorAnsicht(ctx) {
  const { S, ui, aendern, karte, zahl } = ctx;
  const d = ui.editor;
  const standard = EINHEITEN[d.id];
  const gespeichert = !!S.training?.einheiten?.[d.id];
  const kat = katalog(S.training?.uebungen || []);
  const katMap = Object.fromEntries(kat.map(k => [k.id, k]));
  const neu = () => ctx.zeichnen();
  const schliessen = () => { ui.editor = null; ctx.zeichnen(); window.scrollTo(0, 0); };

  const name = h('input', { type: 'text', id: 'editor-name', maxlength: 30, value: d.name, placeholder: 'z. B. Oberkörper, Po-Tag', disabled: !!standard });
  name.addEventListener('input', () => { d.name = name.value; });

  const zeilen = d.uebungen.map((x, i) => {
    const k = katMap[x.ref];
    if (!k) return null;
    const v = k.gym;
    const zeit = !!v.sek && !v.wdh;
    const spanne = x[zeit ? 'sek' : 'wdh'] || v[zeit ? 'sek' : 'wdh'];
    const von = h('input', { type: 'text', inputmode: 'numeric', class: 'klein', value: spanne[0], 'aria-label': `${k.name} von`, 'data-editor-von': i });
    const bis = h('input', { type: 'text', inputmode: 'numeric', class: 'klein', value: spanne[1], 'aria-label': `${k.name} bis`, 'data-editor-bis': i });
    const setzeSpanne = () => {
      const a = Math.round(zahl(von.value) ?? NaN), b = Math.round(zahl(bis.value) ?? NaN);
      if (a >= 1 && b >= a && b <= (zeit ? 600 : 100)) x[zeit ? 'sek' : 'wdh'] = [a, b];
      else { toast('Bitte eine gültige Spanne'); von.value = spanne[0]; bis.value = spanne[1]; }
    };
    von.addEventListener('change', setzeSpanne);
    bis.addEventListener('change', setzeSpanne);
    return h('li', { class: 'editor-uebung', 'data-editor-zeile': x.ref },
      h('div', { class: 'editor-kopf' },
        h('strong', {}, k.name),
        h('div', { class: 'editor-aktionen' },
          i > 0 ? h('button', { class: 'rund klein', 'aria-label': `${k.name} nach oben`, 'data-editor-hoch': i, onclick: () => { [d.uebungen[i - 1], d.uebungen[i]] = [d.uebungen[i], d.uebungen[i - 1]]; neu(); } }, ic('hoch')) : null,
          h('button', { class: 'rund klein', 'aria-label': `${k.name} entfernen`, 'data-editor-weg': i, onclick: () => { d.uebungen.splice(i, 1); neu(); } }, '×'))),
      h('div', { class: 'editor-werte' },
        h('div', { class: 'stepper' },
          h('button', { class: 'rund klein', 'aria-label': 'weniger Sätze', disabled: x.saetze <= 1, onclick: () => { x.saetze--; neu(); } }, '−'),
          h('output', { 'data-editor-saetze': i }, `${x.saetze} Sätze`),
          h('button', { class: 'rund klein', 'aria-label': 'mehr Sätze', disabled: x.saetze >= 6, onclick: () => { x.saetze++; neu(); } }, '+')),
        h('label', { class: 'satz-feld' }, von, h('span', {}, '–')),
        h('label', { class: 'satz-feld' }, bis, h('span', {}, zeit ? 'Sek.' : 'Wdh.'))));
  });

  // Suche zum Hinzufügen (aktualisiert nur die Trefferliste, damit die Tastatur offen bleibt)
  const treffer = h('div', { class: 'editor-treffer' });
  const art = h('select', { id: 'editor-art', 'aria-label': 'Art der Übung' }, Object.entries(ART_LABEL).map(([id, l]) => h('option', { value: id }, l)));
  const dazu = ref => { d.uebungen.push({ ref, saetze: katMap[ref]?.saetze || 3 }); ui.editorSuche = ''; neu(); };
  const zeige = text => {
    const liste = text.trim() ? suche(text, kat).filter(k => !d.uebungen.some(x => x.ref === k.id)).slice(0, 8) : [];
    fill(treffer,
      liste.map(k => h('button', { class: 'treffer-zeile', 'data-editor-dazu': k.id, onclick: () => dazu(k.id) },
        h('span', {}, h('strong', {}, k.name), k.alt ? h('span', { class: 'leise' }, ` / ${k.alt}`) : null), h('span', { class: 'muskeln' }, k.muskeln))),
      text.trim().length >= 2 ? h('div', { class: 'eigene-uebung' },
        h('div', { class: 'feld-label' }, `„${text.trim()}“ als eigene Übung`),
        h('div', { class: 'zweier' }, art,
          h('button', { class: 'knopf', id: 'editor-neu', onclick: () => {
            const id = `u-${Date.now().toString(36)}`;
            const n = text.trim().slice(0, 40);
            aendern(z => { z.training ||= { uebungen: [], einheiten: {} }; z.training.uebungen = [...z.training.uebungen, { id, name: n, art: art.value }]; }, { neuZeichnen: false });
            dazu(id);
            toast('Übung angelegt');
          } }, '+ Anlegen'))) : null);
  };
  const suchFeld = h('input', { type: 'search', id: 'editor-suche', placeholder: 'Übung suchen, z. B. Bankdrücken, Po, Bauch', value: ui.editorSuche || '', 'aria-label': 'Übung suchen' });
  suchFeld.addEventListener('input', () => { ui.editorSuche = suchFeld.value; zeige(suchFeld.value); });
  zeige(ui.editorSuche || '');

  const speichern = () => {
    if (!standard && !d.name.trim()) { toast('Bitte einen Namen eingeben'); return; }
    if (!d.uebungen.length) { toast('Mindestens eine Übung hinzufügen'); return; }
    aendern(z => {
      z.training ||= { uebungen: [], einheiten: {} };
      z.training.einheiten = { ...z.training.einheiten, [d.id]: { name: standard ? standard.name : d.name.trim(), uebungen: d.uebungen.map(x => ({ ...x })) } };
    }, { neuZeichnen: false });
    toast('Einheit gespeichert');
    schliessen();
  };

  return h('div', { class: 'ansicht' },
    h('div', { class: 'detail-kopf' },
      h('button', { class: 'link', id: 'editor-abbrechen', onclick: schliessen }, '‹ Abbrechen'),
      h('button', { class: 'knopf haupt-knopf', id: 'editor-speichern', onclick: speichern }, 'Speichern')),
    h('h1', {}, standard ? `${standard.name} bearbeiten` : gespeichert ? 'Einheit bearbeiten' : 'Neue Einheit'),
    standard ? null : karte(null, feld('Name', name)),
    karte(`Übungen (${d.uebungen.length})`,
      d.uebungen.length ? h('ol', { class: 'editor-liste' }, zeilen) : h('p', { class: 'hinweis' }, 'Noch keine Übung.')),
    karte('Übung hinzufügen', suchFeld, treffer),
    gespeichert ? h('button', { class: 'knopf gefahr breit', id: standard ? 'editor-zuruecksetzen' : 'editor-loeschen', onclick: () => {
      if (!confirm(standard ? `${standard.name} auf den Standard zurücksetzen?` : `„${d.name}“ löschen?`)) return;
      aendern(z => { const x = { ...z.training.einheiten }; delete x[d.id]; z.training.einheiten = x; }, { neuZeichnen: false });
      toast(standard ? 'Zurückgesetzt' : 'Gelöscht');
      schliessen();
    } }, standard ? 'Auf Standard zurücksetzen' : 'Einheit löschen') : null);

  function feld(label, el) { return h('label', { class: 'feld' }, h('span', { class: 'feld-label' }, label), el); }
}

/* ---------- Tagebuch: Wie war's? ---------- */

function tagebuch(ctx, heute, t) {
  const setze = fn => ctx.aendern(z => fn(z.eintraege[heute].training));
  const notiz = h('textarea', { id: 'training-notiz', rows: 2, placeholder: 'Notiz, z. B. Knie gezwickt, neue Hantel' }, t.notiz || '');
  notiz.addEventListener('change', () => setze(x => { const n = notiz.value.trim(); if (n) x.notiz = n; else delete x.notiz; }));
  return h('div', { class: 'tagebuch' },
    h('div', { class: 'feld-label' }, 'Wie war’s?'),
    h('div', { class: 'segment', role: 'group', 'aria-label': 'Wie war das Training?', 'data-segment': 'gefuehl' },
      GEFUEHL.map(g => h('button', { class: t.gefuehl === g.wert ? 'an' : null, 'aria-pressed': String(t.gefuehl === g.wert), 'data-wert': g.wert,
        onclick: () => setze(x => { if (x.gefuehl === g.wert) delete x.gefuehl; else x.gefuehl = g.wert; }) }, g.label))),
    notiz);
}
