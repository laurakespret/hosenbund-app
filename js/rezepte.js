// Rezepte: alltagstauglich, eiweißreich, meist ≤ 30 Minuten. Nährwerte pro Portion, aus den Zutaten geschätzt (daher „ca.“).
// Zutat: { m: Menge (für alle Portionen), e: Einheit, n: Name, vorrat?: true (Öl, Gewürze … → eigene Rubrik in der Einkaufsliste) }

import { plusTage, keyZuDatum, letzteTage, tageZwischen } from './rechner.js';

export const MAHLZEITEN = {
  fruehstueck: 'Frühstück',
  mittag: 'Mittag & Büro',
  abend: 'Abendessen',
  snack: 'Snack',
};

/** Icon je Tag (Schlüssel aus SYMBOLE in icons.js). */
export const TAG_ICONS = { 'nach-training': 'training', 'meal-prep': 'box', 'schnell': 'schnell', 'vegetarisch': 'blatt', 'wohlfuehl': 'wohl' };

export const TAGS = {
  'nach-training': 'Nach dem Training',
  'meal-prep': 'Meal-Prep',
  'schnell': 'Unter 10 Min.',
  'vegetarisch': 'Vegetarisch',
  'wohlfuehl': 'Wohlfühlen',
};

const z = (m, e, n, vorrat) => ({ m, e, n, ...(vorrat ? { vorrat: true } : {}) });

export const REZEPTE = [
  /* ---------- Frühstück ---------- */
  { id: 'overnight-oats', name: 'Overnight Oats mit Skyr & Beeren', mahlzeit: 'fruehstueck', minuten: 5, portionen: 1, kcal: 410, eiweiss: 27,
    tags: ['schnell', 'vegetarisch', 'meal-prep'],
    zutaten: [z(40, 'g', 'Haferflocken'), z(150, 'g', 'Skyr'), z(100, 'ml', 'Milch (1,5 %)'), z(100, 'g', 'Beeren (TK)'), z(10, 'g', 'Mandeln, gehackt'), z(1, 'TL', 'Honig', true)],
    schritte: ['Haferflocken, Skyr und Milch in einem Glas verrühren.', 'Gefrorene Beeren obendrauf geben, über Nacht in den Kühlschrank stellen (sie tauen dabei auf).', 'Morgens mit Mandeln und Honig toppen.'],
    tipp: 'Gleich 3 Gläser vorbereiten, dann ist das Frühstück bis Mittwoch fertig.' },
  { id: 'ruehrei-wrap', name: 'Rührei-Wrap mit Spinat & Feta', mahlzeit: 'fruehstueck', minuten: 10, portionen: 1, kcal: 370, eiweiss: 21,
    tags: ['vegetarisch'],
    zutaten: [z(2, 'Stk', 'Eier'), z(1, 'Stk', 'Vollkorn-Tortilla'), z(20, 'g', 'Feta'), z(30, 'g', 'Babyspinat'), z(1, 'Stk', 'Tomate'), z(null, '', 'Salz, Pfeffer', true)],
    schritte: ['Eier verquirlen, salzen und pfeffern.', 'In einer beschichteten Pfanne ohne Fett bei mittlerer Hitze stocken lassen, Spinat kurz mitgaren.', 'Tortilla kurz in der Pfanne erwärmen, mit Rührei, Tomatenwürfeln und zerbröseltem Feta füllen und einrollen.'],
    tipp: 'In Alufolie gewickelt auch fürs Büro geeignet.' },
  { id: 'quark-apfel', name: 'Quark-Bowl mit Apfel & Zimt', mahlzeit: 'fruehstueck', minuten: 5, portionen: 1, kcal: 355, eiweiss: 28,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(200, 'g', 'Magerquark'), z(1, 'Stk', 'Apfel'), z(20, 'g', 'Haferflocken'), z(10, 'g', 'Walnüsse'), z(null, '', 'Zimt', true)],
    schritte: ['Quark mit einem Schuss Wasser cremig rühren.', 'Apfel in Würfel schneiden oder grob reiben.', 'Alles in eine Schüssel geben, mit Haferflocken, gehackten Walnüssen und Zimt bestreuen.'],
    tipp: 'Schmeckt wie Apfelstrudel. Wer es süßer mag: ein paar Tropfen Vanillearoma.' },
  { id: 'schoko-haferbrei', name: 'Warmer Schoko-Haferbrei', mahlzeit: 'fruehstueck', minuten: 8, portionen: 1, kcal: 435, eiweiss: 19,
    tags: ['vegetarisch', 'wohlfuehl'],
    zutaten: [z(50, 'g', 'Haferflocken'), z(250, 'ml', 'Milch (1,5 %)'), z(0.5, 'Stk', 'Banane'), z(10, 'g', 'Walnüsse'), z(1, 'EL', 'Backkakao', true)],
    schritte: ['Haferflocken mit Milch und Kakao aufkochen und unter Rühren 3–4 Min. köcheln lassen.', 'Banane in Scheiben schneiden und darauflegen, mit gehackten Walnüssen bestreuen.'],
    tipp: 'Warm, süß und sättigend: perfekt an Tagen mit Krämpfen oder Heißhunger. Hafer, Kakao und Nüsse liefern Magnesium.' },

  { id: 'avocado-ei-brot', name: 'Vollkornbrot mit Avocado & Ei', mahlzeit: 'fruehstueck', minuten: 10, portionen: 1, kcal: 430, eiweiss: 19,
    tags: ['vegetarisch'],
    zutaten: [z(1, 'Scheibe', 'Vollkornbrot'), z(0.5, 'Stk', 'Avocado'), z(2, 'Stk', 'Eier'), z(50, 'g', 'Kirschtomaten'), z(null, '', 'Chiliflocken, Salz, Pfeffer', true)],
    schritte: ['Eier 7 Min. kochen, kalt abschrecken und pellen.', 'Avocado auf dem Brot zerdrücken, salzen.', 'Eier halbieren, mit Tomaten darauflegen, mit Chili und Pfeffer würzen.'],
    tipp: 'Gesunde Fette und Eiweiß halten bis mittags satt.' },
  { id: 'protein-pancakes', name: 'Bananen-Quark-Pancakes', mahlzeit: 'fruehstueck', minuten: 15, portionen: 1, kcal: 485, eiweiss: 31,
    tags: ['vegetarisch', 'wohlfuehl'],
    zutaten: [z(40, 'g', 'Haferflocken'), z(1, 'Stk', 'kleine Banane'), z(2, 'Stk', 'Eier'), z(100, 'g', 'Magerquark'), z(50, 'g', 'Beeren (TK)'), z(null, '', 'Zimt', true)],
    schritte: ['Haferflocken, Banane, Eier, Quark und Zimt glatt pürieren.', 'In einer beschichteten Pfanne ohne Fett kleine Pancakes bei mittlerer Hitze je 2 Min. pro Seite backen.', 'Mit warmen Beeren servieren.'],
    tipp: 'Fürs Wochenende. Schmeckt süß, ganz ohne Zucker.' },
  { id: 'chia-mango', name: 'Chia-Skyr mit Mango', mahlzeit: 'fruehstueck', minuten: 5, portionen: 1, kcal: 295, eiweiss: 21,
    tags: ['vegetarisch', 'meal-prep', 'schnell'],
    zutaten: [z(20, 'g', 'Chiasamen'), z(150, 'ml', 'Milch (1,5 %)'), z(100, 'g', 'Skyr'), z(100, 'g', 'Mango (TK)')],
    schritte: ['Chiasamen mit Milch verrühren, nach 5 Min. noch einmal umrühren und über Nacht kühl stellen.', 'Morgens Skyr unterrühren und Mango darauf geben.'],
    tipp: 'Lässt sich für 3 Tage vorbereiten.' },

  { id: 'beeren-bowl', name: 'Beeren-Smoothie-Bowl', mahlzeit: 'fruehstueck', minuten: 5, portionen: 1, kcal: 335, eiweiss: 21,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(150, 'g', 'Skyr'), z(150, 'g', 'Beeren (TK)'), z(1, 'Stk', 'kleine Banane'), z(20, 'g', 'Haferflocken')],
    schritte: ['Skyr, Beeren und die halbe Banane cremig mixen.', 'In eine Schale geben, mit restlicher Banane und Haferflocken toppen.'],
    tipp: 'Schmeckt wie Eis zum Frühstück.' },
  { id: 'kraeuterquark-brot', name: 'Kräuterquark-Brot mit Radieschen', mahlzeit: 'fruehstueck', minuten: 5, portionen: 1, kcal: 300, eiweiss: 20,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(2, 'Scheibe', 'Vollkornbrot'), z(100, 'g', 'Magerquark'), z(4, 'Stk', 'Radieschen'), z(0.25, 'Stk', 'Gurke'), z(null, '', 'Schnittlauch, Salz, Pfeffer', true)],
    schritte: ['Quark mit Schnittlauch, Salz und Pfeffer verrühren.', 'Aufs Brot streichen, mit Radieschen und Gurke belegen.'],
    tipp: 'Herzhaft statt süß, hält lange satt.' },
  { id: 'lachs-ruehrei', name: 'Rührei mit Räucherlachs', mahlzeit: 'fruehstueck', minuten: 10, portionen: 1, kcal: 350, eiweiss: 27,
    tags: [],
    zutaten: [z(2, 'Stk', 'Eier'), z(50, 'g', 'Räucherlachs'), z(1, 'Scheibe', 'Vollkornbrot'), z(null, '', 'Schnittlauch, Pfeffer', true)],
    schritte: ['Eier verquirlen und in einer beschichteten Pfanne bei mittlerer Hitze stocken lassen.', 'Mit Lachs und Schnittlauch aufs Brot geben, pfeffern.'],
    tipp: 'Fürs Wochenende. Viel Eiweiß und Omega-3.' },

  /* ---------- Mittag & Büro ---------- */
  { id: 'linsen-feta', name: 'Linsen-Feta-Salat mit Bulgur', mahlzeit: 'mittag', minuten: 20, portionen: 2, kcal: 430, eiweiss: 23,
    tags: ['meal-prep', 'vegetarisch'],
    zutaten: [z(1, 'Dose', 'Linsen (ca. 265 g abgetropft)'), z(50, 'g', 'Bulgur'), z(1, 'Stk', 'Paprika'), z(0.5, 'Stk', 'Gurke'), z(100, 'g', 'Feta'), z(0.5, 'Bund', 'Petersilie'), z(1, 'Stk', 'Zitrone'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Salz, Pfeffer', true)],
    schritte: ['Bulgur mit der doppelten Menge kochendem Salzwasser übergießen und 10 Min. quellen lassen.', 'Linsen abspülen. Paprika und Gurke würfeln, Petersilie hacken.', 'Alles mischen, mit Zitronensaft, Öl, Salz und Pfeffer abschmecken, Feta darüberbröseln.'],
    tipp: 'Hält sich im Kühlschrank 3 Tage. Das Dressing erst kurz vor dem Essen untermischen.' },
  { id: 'haehnchen-couscous', name: 'Hähnchen-Couscous-Box mit Joghurt-Dip', mahlzeit: 'mittag', minuten: 25, portionen: 2, kcal: 460, eiweiss: 38,
    tags: ['meal-prep', 'nach-training'],
    zutaten: [z(250, 'g', 'Hähnchenbrust'), z(120, 'g', 'Couscous'), z(1, 'Stk', 'Zucchini'), z(1, 'Stk', 'Paprika'), z(100, 'g', 'Naturjoghurt (1,5 %)'), z(1, 'Stk', 'Knoblauchzehe'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Paprikapulver, Salz, Pfeffer', true)],
    schritte: ['Couscous mit gleicher Menge kochendem Salzwasser übergießen, 5 Min. quellen lassen.', 'Hähnchen in Streifen schneiden, mit Paprikapulver, Salz und Pfeffer würzen und in Öl ca. 6 Min. braten. Herausnehmen.', 'Zucchini und Paprika würfeln und in derselben Pfanne 5 Min. braten.', 'Joghurt mit gepresstem Knoblauch und Salz verrühren. Alles auf zwei Boxen verteilen.'],
    tipp: 'Kalt oder warm lecker. Den Dip in einem kleinen Extra-Döschen mitnehmen.' },
  { id: 'thunfisch-bohnen', name: 'Thunfisch-Bohnen-Salat', mahlzeit: 'mittag', minuten: 10, portionen: 1, kcal: 335, eiweiss: 41,
    tags: ['schnell', 'nach-training'],
    zutaten: [z(1, 'Dose', 'Thunfisch im eigenen Saft'), z(0.5, 'Dose', 'weiße Bohnen'), z(100, 'g', 'Kirschtomaten'), z(0.25, 'Stk', 'rote Zwiebel'), z(30, 'g', 'Rucola'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Zitronensaft, Salz, Pfeffer', true)],
    schritte: ['Thunfisch und Bohnen abtropfen lassen.', 'Tomaten halbieren, Zwiebel fein würfeln.', 'Alles mit Rucola mischen, mit Öl, Zitronensaft, Salz und Pfeffer anmachen.'],
    tipp: 'Komplett aus dem Vorratsschrank, perfekt für Tage, an denen nichts Frisches da ist (dann ohne Rucola).' },

  { id: 'haehnchen-wrap', name: 'Hähnchen-Hummus-Wrap', mahlzeit: 'mittag', minuten: 15, portionen: 2, kcal: 420, eiweiss: 30,
    tags: ['nach-training'],
    zutaten: [z(2, 'Stk', 'Vollkorn-Tortilla'), z(200, 'g', 'Hähnchenbrust'), z(60, 'g', 'Hummus'), z(40, 'g', 'Rucola'), z(1, 'Stk', 'Paprika'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Paprikapulver, Salz, Pfeffer', true)],
    schritte: ['Hähnchen in Streifen schneiden, würzen und in Öl ca. 6 Min. braten.', 'Tortillas mit Hummus bestreichen, mit Rucola, Paprikastreifen und Hähnchen belegen.', 'Fest einrollen und halbieren.'],
    tipp: 'In Backpapier gewickelt gut fürs Büro.' },
  { id: 'minestrone', name: 'Minestrone mit weißen Bohnen', mahlzeit: 'mittag', minuten: 30, portionen: 2, kcal: 430, eiweiss: 21,
    tags: ['vegetarisch', 'meal-prep', 'wohlfuehl'],
    zutaten: [z(1, 'Stk', 'Zwiebel'), z(2, 'Stk', 'Karotte'), z(1, 'Stk', 'Zucchini'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(1, 'Dose', 'weiße Bohnen'), z(60, 'g', 'Vollkornnudeln'), z(30, 'g', 'Parmesan'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Oregano, Salz, Pfeffer', true)],
    schritte: ['Zwiebel, Karotten und Zucchini würfeln und in Öl 5 Min. andünsten.', 'Tomaten, 600 ml Wasser und Nudeln dazugeben, 12 Min. köcheln.', 'Bohnen abspülen, unterrühren, würzen und mit Parmesan servieren.'],
    tipp: 'Warm und sättigend. Hält 3 Tage im Kühlschrank.' },
  { id: 'tofu-bowl', name: 'Tofu-Reis-Bowl mit Brokkoli', mahlzeit: 'mittag', minuten: 25, portionen: 2, kcal: 435, eiweiss: 23,
    tags: ['vegetarisch', 'meal-prep'],
    zutaten: [z(200, 'g', 'Tofu (natur)'), z(120, 'g', 'Reis'), z(0.5, 'Stk', 'Brokkoli'), z(1, 'Stk', 'Karotte'), z(2, 'EL', 'Sojasauce', true), z(1, 'EL', 'Olivenöl', true)],
    schritte: ['Reis nach Packung kochen.', 'Tofu würfeln und in Öl rundum knusprig braten, mit Sojasauce ablöschen.', 'Brokkoli und Karotte klein schneiden, 4 Min. mitbraten. Alles auf Reis verteilen.'],
    tipp: 'Tofu gut trockentupfen, dann wird er knuspriger.' },
  { id: 'griechischer-salat', name: 'Griechischer Salat mit Hähnchen', mahlzeit: 'mittag', minuten: 15, portionen: 1, kcal: 480, eiweiss: 46,
    tags: ['nach-training'],
    zutaten: [z(150, 'g', 'Hähnchenbrust'), z(0.5, 'Stk', 'Gurke'), z(2, 'Stk', 'Tomate'), z(0.5, 'Stk', 'rote Zwiebel'), z(40, 'g', 'Feta'), z(1, 'Scheibe', 'Vollkornbrot'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Oregano, Salz, Pfeffer', true)],
    schritte: ['Hähnchen würzen und in Öl ca. 7 Min. braten, in Streifen schneiden.', 'Gurke, Tomaten und Zwiebel schneiden, mit Oregano, Salz und Pfeffer mischen.', 'Hähnchen und Feta darauf geben, Brot dazu.'],
    tipp: 'Viel Eiweiß, ideal nach dem Training.' },

  { id: 'quinoa-salat', name: 'Quinoa-Salat mit Kichererbsen & Feta', mahlzeit: 'mittag', minuten: 20, portionen: 2, kcal: 475, eiweiss: 21,
    tags: ['vegetarisch', 'meal-prep'],
    zutaten: [z(100, 'g', 'Quinoa'), z(1, 'Dose', 'Kichererbsen'), z(0.5, 'Stk', 'Gurke'), z(1, 'Stk', 'Paprika'), z(60, 'g', 'Feta'), z(1, 'Stk', 'Zitrone'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Salz, Pfeffer', true)],
    schritte: ['Quinoa abspülen und nach Packung ca. 12 Min. kochen, abkühlen lassen.', 'Kichererbsen abspülen, Gurke und Paprika würfeln.', 'Alles mischen, mit Zitronensaft, Öl, Salz und Pfeffer abschmecken, Feta darüberbröseln.'],
    tipp: 'Hält 3 Tage im Kühlschrank.' },
  { id: 'thunfisch-wrap', name: 'Thunfisch-Mais-Wrap', mahlzeit: 'mittag', minuten: 10, portionen: 2, kcal: 345, eiweiss: 28,
    tags: ['schnell', 'nach-training'],
    zutaten: [z(2, 'Stk', 'Vollkorn-Tortilla'), z(1, 'Dose', 'Thunfisch im eigenen Saft'), z(1, 'Dose', 'Mais (klein)'), z(100, 'g', 'Naturjoghurt (1,5 %)'), z(40, 'g', 'Rucola'), z(null, '', 'Salz, Pfeffer', true)],
    schritte: ['Thunfisch und Mais abtropfen lassen, mit Joghurt, Salz und Pfeffer mischen.', 'Auf die Tortillas streichen, Rucola darauf, fest einrollen.'],
    tipp: 'In 10 Minuten fertig, ganz ohne Kochen.' },
  { id: 'nudelsuppe', name: 'Asia-Nudelsuppe mit Hähnchen', mahlzeit: 'mittag', minuten: 20, portionen: 2, kcal: 300, eiweiss: 31,
    tags: ['wohlfuehl', 'nach-training'],
    zutaten: [z(200, 'g', 'Hähnchenbrust'), z(80, 'g', 'Vollkornnudeln'), z(1, 'Stk', 'Karotte'), z(50, 'g', 'Babyspinat'), z(1, 'Stk', 'Ingwer (daumengroß)'), z(2, 'EL', 'Sojasauce', true), z(2, 'TL', 'Gemüsebrühe', true)],
    schritte: ['800 ml Wasser mit Brühe, geriebenem Ingwer und Sojasauce aufkochen.', 'Hähnchen in dünne Streifen, Karotte in Scheiben schneiden, mit den Nudeln 8 Min. köcheln.', 'Spinat unterrühren, bis er zusammenfällt.'],
    tipp: 'Warm und leicht, gut an Pausentagen.' },

  /* ---------- Abendessen ---------- */
  { id: 'one-pot-pasta', name: 'One-Pot-Pasta mit Hähnchen & Spinat', mahlzeit: 'abend', minuten: 25, portionen: 2, kcal: 520, eiweiss: 45,
    tags: ['nach-training'],
    zutaten: [z(160, 'g', 'Vollkornnudeln'), z(250, 'g', 'Hähnchenbrust'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(100, 'g', 'Babyspinat'), z(1, 'Stk', 'Zwiebel'), z(1, 'Stk', 'Knoblauchzehe'), z(20, 'g', 'Parmesan'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Oregano, Salz, Pfeffer', true)],
    schritte: ['Hähnchen würfeln und im großen Topf in Öl rundum anbraten, Zwiebel und Knoblauch kurz mitbraten.', 'Tomaten, Nudeln und 400 ml Wasser dazugeben, würzen und ca. 12 Min. köcheln lassen, dabei öfter umrühren.', 'Spinat unterheben, bis er zusammenfällt. Mit Parmesan servieren.'],
    tipp: 'Nur ein Topf zum Abwaschen. Bleibt Flüssigkeit übrig, einfach ohne Deckel 2 Min. weiterköcheln.' },
  { id: 'lachs-ofengemuese', name: 'Lachs mit Ofenkartoffeln & Brokkoli', mahlzeit: 'abend', minuten: 30, portionen: 2, kcal: 540, eiweiss: 35,
    tags: ['nach-training', 'wohlfuehl'],
    zutaten: [z(2, 'Stk', 'Lachsfilets (à ca. 125 g)'), z(500, 'g', 'Drillinge (kleine Kartoffeln)'), z(1, 'Stk', 'Brokkoli'), z(1, 'Stk', 'Zitrone'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Rosmarin, Salz, Pfeffer', true)],
    schritte: ['Ofen auf 200 °C Umluft vorheizen. Kartoffeln halbieren, mit der Hälfte des Öls, Salz und Rosmarin aufs Blech geben, 15 Min. backen.', 'Brokkoli in Röschen teilen, mit restlichem Öl dazugeben. Lachs salzen und mit Zitronenscheiben belegen, auf das Blech legen.', 'Weitere 12–15 Min. backen, bis der Lachs innen gerade nicht mehr glasig ist.'],
    tipp: 'TK-Lachs geht auch: über Nacht im Kühlschrank auftauen lassen.' },
  { id: 'chili-sin-carne', name: 'Chili sin Carne mit roten Linsen', mahlzeit: 'abend', minuten: 30, portionen: 3, kcal: 390, eiweiss: 21,
    tags: ['meal-prep', 'vegetarisch', 'wohlfuehl'],
    zutaten: [z(150, 'g', 'rote Linsen'), z(1, 'Dose', 'Kidneybohnen'), z(1, 'Dose', 'Mais (klein)'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(1, 'Stk', 'Paprika'), z(1, 'Stk', 'Zwiebel'), z(150, 'g', 'Naturjoghurt (1,5 %)'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Kreuzkümmel, Paprikapulver, Chili, Salz', true)],
    schritte: ['Zwiebel und Paprika würfeln und im Topf in Öl anbraten. Gewürze kurz mitrösten.', 'Linsen, Tomaten und 400 ml Wasser dazugeben und 15 Min. köcheln lassen.', 'Bohnen und Mais abspülen, dazugeben, 5 Min. weiterköcheln und abschmecken. Mit einem Klecks Joghurt servieren.'],
    tipp: 'Schmeckt am zweiten Tag noch besser und lässt sich prima einfrieren.' },
  { id: 'haehnchen-pfanne', name: 'Hähnchen-Gemüse-Pfanne mit Reis', mahlzeit: 'abend', minuten: 25, portionen: 2, kcal: 485, eiweiss: 37,
    tags: ['nach-training'],
    zutaten: [z(250, 'g', 'Hähnchenbrust'), z(120, 'g', 'Reis'), z(0.75, 'Stk', 'Brokkoli'), z(1, 'Stk', 'Paprika'), z(1, 'Stk', 'Karotte'), z(1, 'Stk', 'Ingwer (daumengroß)'), z(2, 'EL', 'Sojasauce', true), z(1, 'EL', 'Olivenöl', true)],
    schritte: ['Reis nach Packung kochen.', 'Hähnchen in Streifen schneiden und in Öl scharf anbraten, herausnehmen.', 'Gemüse klein schneiden, mit geriebenem Ingwer 5 Min. braten, es soll noch Biss haben.', 'Hähnchen zurück in die Pfanne, mit Sojasauce ablöschen und mit dem Reis servieren.'],
    tipp: 'Mehr Gemüse und weniger Reis macht satt mit weniger Kalorien.' },
  { id: 'putenhack-bowl', name: 'Putenhack-Bowl mit Bulgur & Tzatziki', mahlzeit: 'abend', minuten: 20, portionen: 2, kcal: 460, eiweiss: 34,
    tags: ['nach-training', 'meal-prep'],
    zutaten: [z(250, 'g', 'Putenhack'), z(100, 'g', 'Bulgur'), z(1, 'Stk', 'Gurke'), z(200, 'g', 'Kirschtomaten'), z(150, 'g', 'Naturjoghurt (1,5 %)'), z(1, 'Stk', 'Knoblauchzehe'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Kreuzkümmel, Paprikapulver, Minze, Salz', true)],
    schritte: ['Bulgur mit doppelter Menge kochendem Salzwasser 10 Min. quellen lassen.', 'Putenhack in Öl krümelig braten, mit Kreuzkümmel, Paprika und Salz würzen.', 'Für das Tzatziki die Hälfte der Gurke reiben, mit Joghurt, Knoblauch, Minze und Salz verrühren. Restliche Gurke und Tomaten würfeln.', 'Alles in Schüsseln anrichten.'],
    tipp: 'Statt Putenhack geht auch Rinderhack (etwas mehr Kalorien).' },
  { id: 'omelett', name: 'Gemüse-Omelett mit Vollkornbrot', mahlzeit: 'abend', minuten: 15, portionen: 1, kcal: 475, eiweiss: 30,
    tags: ['vegetarisch'],
    zutaten: [z(3, 'Stk', 'Eier'), z(50, 'g', 'Champignons'), z(0.5, 'Stk', 'Paprika'), z(20, 'g', 'geriebener Käse'), z(1, 'Scheibe', 'Vollkornbrot'), z(1, 'TL', 'Olivenöl', true), z(null, '', 'Schnittlauch, Salz, Pfeffer', true)],
    schritte: ['Pilze und Paprika klein schneiden und in Öl 3 Min. anbraten.', 'Eier verquirlen, würzen, über das Gemüse gießen und bei kleiner Hitze mit Deckel stocken lassen.', 'Käse darüberstreuen, zusammenklappen und mit Schnittlauch und Brot servieren.'],
    tipp: 'Resteessen: Fast jedes Gemüse aus dem Kühlschrank passt hinein.' },
  { id: 'linsen-curry', name: 'Rotes Linsen-Curry mit Spinat', mahlzeit: 'abend', minuten: 25, portionen: 2, kcal: 440, eiweiss: 21,
    tags: ['vegetarisch', 'meal-prep', 'wohlfuehl'],
    zutaten: [z(150, 'g', 'rote Linsen'), z(200, 'ml', 'Kokosmilch (light)'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(150, 'g', 'Babyspinat'), z(1, 'Stk', 'Zwiebel'), z(1, 'Stk', 'Ingwer (daumengroß)'), z(1, 'TL', 'Olivenöl', true), z(1, 'EL', 'Currypulver', true)],
    schritte: ['Zwiebel und Ingwer fein hacken und in Öl anschwitzen, Curry kurz mitrösten.', 'Linsen, Tomaten, Kokosmilch und 200 ml Wasser dazugeben und ca. 15 Min. köcheln lassen.', 'Spinat unterrühren, mit Salz und etwas Zitrone abschmecken.'],
    tipp: 'Wer mehr Hunger hat: mit 50 g Reis pro Portion (ca. +175 kcal).' },
  { id: 'rind-brokkoli', name: 'Rindfleisch-Brokkoli-Pfanne mit Reis', mahlzeit: 'abend', minuten: 25, portionen: 2, kcal: 495, eiweiss: 37,
    tags: ['nach-training', 'wohlfuehl'],
    zutaten: [z(250, 'g', 'Rinderhüfte (in Streifen)'), z(120, 'g', 'Reis'), z(1, 'Stk', 'Brokkoli'), z(1, 'Stk', 'Paprika'), z(1, 'Stk', 'Ingwer (daumengroß)'), z(1, 'Stk', 'Knoblauchzehe'), z(2, 'EL', 'Sojasauce', true), z(1, 'EL', 'Olivenöl', true)],
    schritte: ['Reis nach Packung kochen.', 'Rindfleisch in einer sehr heißen Pfanne in Öl 2 Min. scharf anbraten, herausnehmen.', 'Brokkoli und Paprika mit geriebenem Ingwer und Knoblauch 5 Min. braten.', 'Fleisch zurück in die Pfanne, mit Sojasauce ablöschen und mit Reis servieren.'],
    tipp: 'Rindfleisch liefert viel Eisen. Das ist während und nach der Blutung besonders wertvoll. Brokkoli und Paprika (Vitamin C) helfen bei der Aufnahme.' },
  { id: 'suesskartoffel', name: 'Ofen-Süßkartoffel mit Kichererbsen & Kräuterquark', mahlzeit: 'abend', minuten: 30, portionen: 2, kcal: 490, eiweiss: 28,
    tags: ['vegetarisch', 'wohlfuehl'],
    zutaten: [z(2, 'Stk', 'Süßkartoffeln (mittelgroß)'), z(1, 'Dose', 'Kichererbsen'), z(250, 'g', 'Magerquark'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Paprikapulver, Kreuzkümmel, Schnittlauch, Salz', true)],
    schritte: ['Ofen auf 200 °C Umluft vorheizen. Süßkartoffeln längs halbieren, Kichererbsen abspülen und trockentupfen.', 'Beides mit Öl, Paprika, Kreuzkümmel und Salz mischen und aufs Blech legen (Süßkartoffeln mit der Schnittfläche nach unten), 25 Min. backen.', 'Quark mit etwas Wasser, Salz und Schnittlauch verrühren und auf die Süßkartoffeln geben.'],
    tipp: 'Warmes Soulfood mit viel Ballaststoffen. Hält lange satt, wenn der Heißhunger kommt.' },

  { id: 'thunfisch-pasta', name: 'Vollkornnudeln mit Tomaten-Thunfisch-Sauce', mahlzeit: 'abend', minuten: 20, portionen: 2, kcal: 465, eiweiss: 31,
    tags: ['schnell'],
    zutaten: [z(160, 'g', 'Vollkornnudeln'), z(1, 'Dose', 'Thunfisch im eigenen Saft'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(1, 'Stk', 'Zwiebel'), z(1, 'Stk', 'Knoblauchzehe'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Oregano, Salz, Pfeffer', true)],
    schritte: ['Nudeln nach Packung kochen.', 'Zwiebel und Knoblauch würfeln und in Öl glasig dünsten, Tomaten dazu, 8 Min. köcheln.', 'Thunfisch unterrühren, würzen und mit den Nudeln mischen.'],
    tipp: 'Aus dem Vorrat, wenn der Kühlschrank leer ist.' },
  { id: 'ofen-haehnchen', name: 'Blech-Hähnchen mit Kartoffeln & Gemüse', mahlzeit: 'abend', minuten: 35, portionen: 2, kcal: 425, eiweiss: 41,
    tags: ['nach-training', 'meal-prep'],
    zutaten: [z(300, 'g', 'Hähnchenbrust'), z(400, 'g', 'Drillinge (kleine Kartoffeln)'), z(2, 'Stk', 'Paprika'), z(1, 'Stk', 'Zucchini'), z(1, 'Stk', 'rote Zwiebel'), z(1, 'EL', 'Olivenöl', true), z(null, '', 'Rosmarin, Salz, Pfeffer', true)],
    schritte: ['Ofen auf 200 °C Umluft vorheizen. Kartoffeln halbieren, Gemüse grob schneiden.', 'Alles mit Öl, Rosmarin, Salz und Pfeffer aufs Blech, 15 Min. backen.', 'Hähnchen in Stücken dazulegen und weitere 15–20 Min. backen.'],
    tipp: 'Ein Blech, kaum Abwasch. Reste gehen am nächsten Tag ins Büro.' },
  { id: 'gefuellte-paprika', name: 'Gefüllte Paprika mit Bulgur & Bohnen', mahlzeit: 'abend', minuten: 35, portionen: 2, kcal: 430, eiweiss: 25,
    tags: ['vegetarisch', 'wohlfuehl'],
    zutaten: [z(2, 'Stk', 'Paprika'), z(60, 'g', 'Bulgur'), z(1, 'Dose', 'Kidneybohnen'), z(1, 'Dose', 'stückige Tomaten (400 g)'), z(50, 'g', 'Feta'), z(30, 'g', 'geriebener Käse'), z(null, '', 'Kreuzkümmel, Paprikapulver, Chili, Salz', true)],
    schritte: ['Ofen auf 200 °C vorheizen. Bulgur mit doppelter Menge kochendem Wasser 10 Min. quellen lassen.', 'Bohnen abspülen, mit Bulgur, Feta und Gewürzen mischen. Paprika halbieren und füllen.', 'Tomaten in eine Form geben, Paprika hineinsetzen, mit Käse bestreuen und 25 Min. backen.'],
    tipp: 'Warm und würzig, Bohnen liefern Eisen.' },

  /* ---------- Snacks ---------- */
  { id: 'shake', name: 'Bananen-Erdnuss-Shake', mahlzeit: 'snack', minuten: 3, portionen: 1, kcal: 385, eiweiss: 30,
    tags: ['nach-training', 'schnell', 'vegetarisch'],
    zutaten: [z(300, 'ml', 'Milch (1,5 %)'), z(150, 'g', 'Skyr'), z(1, 'Stk', 'kleine Banane'), z(10, 'g', 'Erdnussmus')],
    schritte: ['Alles in den Mixer geben und 30 Sekunden mixen.'],
    tipp: 'Ideal direkt nach dem Training, ersetzt dann einen kleinen Snack plus Getränk.' },
  { id: 'huettenkaese-knaecke', name: 'Knäckebrot mit Hüttenkäse & Radieschen', mahlzeit: 'snack', minuten: 3, portionen: 1, kcal: 180, eiweiss: 14,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(2, 'Stk', 'Vollkorn-Knäckebrot'), z(100, 'g', 'Hüttenkäse'), z(4, 'Stk', 'Radieschen'), z(null, '', 'Schnittlauch, Pfeffer', true)],
    schritte: ['Knäckebrot mit Hüttenkäse bestreichen, mit Radieschenscheiben, Schnittlauch und Pfeffer belegen.'],
    tipp: 'Herzhafter Nachmittagssnack fürs Büro gegen das 16-Uhr-Loch.' },
  { id: 'skyr-kakao', name: 'Schoko-Skyr mit Beeren', mahlzeit: 'snack', minuten: 2, portionen: 1, kcal: 195, eiweiss: 22,
    tags: ['schnell', 'vegetarisch', 'wohlfuehl'],
    zutaten: [z(200, 'g', 'Skyr'), z(100, 'g', 'Beeren (TK)'), z(1, 'TL', 'Backkakao', true), z(1, 'TL', 'Honig', true)],
    schritte: ['Skyr mit Kakao und Honig glatt rühren.', 'Beeren darübergeben (aufgetaut oder gefroren wie Sorbet).'],
    tipp: 'Wenn abends die Lust auf Süßes kommt. Darf aber auch mal echte Schokolade sein, das ist dann ein Genuss-Moment.' },
  { id: 'apfel-erdnuss', name: 'Apfel mit Erdnussmus', mahlzeit: 'snack', minuten: 2, portionen: 1, kcal: 175, eiweiss: 4,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(1, 'Stk', 'Apfel'), z(15, 'g', 'Erdnussmus')],
    schritte: ['Apfel in Spalten schneiden und ins Erdnussmus dippen.'],
    tipp: 'Süß und knackig, hält länger satt als Obst allein.' },
  { id: 'gemuese-hummus', name: 'Gemüsesticks mit Hummus', mahlzeit: 'snack', minuten: 5, portionen: 1, kcal: 205, eiweiss: 6,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(1, 'Stk', 'Karotte'), z(0.5, 'Stk', 'Paprika'), z(0.25, 'Stk', 'Gurke'), z(50, 'g', 'Hummus')],
    schritte: ['Gemüse in Sticks schneiden und mit Hummus servieren.'],
    tipp: 'Zählt auch zum Baustein Gemüse.' },
  { id: 'eier-tomaten', name: 'Gekochte Eier mit Kirschtomaten', mahlzeit: 'snack', minuten: 10, portionen: 1, kcal: 170, eiweiss: 14,
    tags: ['vegetarisch', 'meal-prep'],
    zutaten: [z(2, 'Stk', 'Eier'), z(100, 'g', 'Kirschtomaten'), z(null, '', 'Salz, Pfeffer', true)],
    schritte: ['Eier 8 Min. kochen, abschrecken.', 'Mit Tomaten, Salz und Pfeffer essen.'],
    tipp: 'Gleich mehrere Eier kochen, sie halten 5 Tage im Kühlschrank.' },
  { id: 'skyr-walnuss', name: 'Skyr mit Walnüssen & Honig', mahlzeit: 'snack', minuten: 2, portionen: 1, kcal: 180, eiweiss: 17,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(150, 'g', 'Skyr'), z(10, 'g', 'Walnüsse'), z(1, 'TL', 'Honig', true)],
    schritte: ['Skyr in eine Schale geben, Walnüsse hacken und mit Honig darüber geben.'],
    tipp: 'Viel Eiweiß für den Nachmittag.' },
  { id: 'huettenkaese-beeren', name: 'Hüttenkäse mit Beeren', mahlzeit: 'snack', minuten: 2, portionen: 1, kcal: 200, eiweiss: 19,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(150, 'g', 'Hüttenkäse'), z(100, 'g', 'Beeren (TK)')],
    schritte: ['Hüttenkäse in eine Schale geben, Beeren darüber.'],
    tipp: 'Frisch, leicht und eiweißreich.' },
  { id: 'karotten-dip', name: 'Karotten mit Kräuterquark-Dip', mahlzeit: 'snack', minuten: 5, portionen: 1, kcal: 140, eiweiss: 14,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(2, 'Stk', 'Karotte'), z(100, 'g', 'Magerquark'), z(null, '', 'Schnittlauch, Salz, Pfeffer', true)],
    schritte: ['Karotten in Sticks schneiden.', 'Quark mit Schnittlauch, Salz und Pfeffer verrühren und dippen.'],
    tipp: 'Knackig fürs Büro, zählt auch als Gemüse.' },
  { id: 'reiswaffel-erdnuss', name: 'Reiswaffeln mit Erdnussmus & Banane', mahlzeit: 'snack', minuten: 2, portionen: 1, kcal: 210, eiweiss: 6,
    tags: ['schnell', 'vegetarisch'],
    zutaten: [z(2, 'Stk', 'Reiswaffeln'), z(15, 'g', 'Erdnussmus'), z(0.5, 'Stk', 'Banane')],
    schritte: ['Reiswaffeln mit Erdnussmus bestreichen, Bananenscheiben darauf.'],
    tipp: 'Gut vor dem Training.' },
];

export function rezept(id) {
  return REZEPTE.find(r => r.id === id) || null;
}

/** Montag der Woche von `tag` als 'JJJJ-MM-TT'. */
export function wochenStart(tag) {
  return plusTage(tag, -((keyZuDatum(tag).getDay() + 6) % 7));
}

/**
 * Abendessen-Vorschläge für die Woche (Mo–So), am Stück geplant:
 * - Trainingstage bekommen eiweißreiche „Nach dem Training“-Gerichte.
 * - Kein Gericht doppelt in der Woche, solange der Vorrat reicht (sicher nie zweimal hintereinander).
 * - Deterministisch: gleiche Woche → gleicher Plan. Die Startposition rotiert von Woche zu Woche.
 * - `wahl` = eigene Auswahl { tag: rezeptId } hat Vorrang.
 */
export function wochenEssen(montag, istTrainingstag, wahl = {}, istWohlTag = () => false) {
  const abend = REZEPTE.filter(r => r.mahlzeit === 'abend');
  const woche = Math.floor(tageZwischen('2026-01-05', montag) / 7);   // 05.01.2026 ist ein Montag
  const tage = letzteTage(plusTage(montag, 6), 7);
  const benutzt = new Set(tage.map(t => wahl[t]).filter(id => rezept(id)));
  let vorher = null;
  return tage.map((tag, i) => {
    const training = istTrainingstag(tag);
    const wohl = istWohlTag(tag);
    let r = wahl[tag] && rezept(wahl[tag]);
    if (!r) {
      // Trainingstag: eiweißreich. Pausen-/Beschwerdetag: Wohlfühlgerichte. Beides: Schnittmenge, sonst Training.
      const mitTag = t => abend.filter(x => x.tags.includes(t));
      let pool = abend;
      if (training && wohl) pool = mitTag('nach-training').filter(x => x.tags.includes('wohlfuehl'));
      if (!pool.length || (training && !wohl)) pool = mitTag('nach-training');
      if (wohl && !training) pool = mitTag('wohlfuehl');
      const start = ((woche * 2 + i) % pool.length + pool.length) % pool.length;
      const reihe = pool.map((_, k) => pool[(start + k) % pool.length]);
      r = reihe.find(x => !benutzt.has(x.id) && x.id !== vorher?.id) || reihe.find(x => x.id !== vorher?.id) || reihe[0];
      benutzt.add(r.id);
    }
    vorher = r;
    return { tag, training, wohl, rezept: r };
  });
}

/** Vorschlag für einen einzelnen Tag (aus dem Wochenplan, damit „Heute“ und „Rezepte“ immer übereinstimmen). */
export function abendFuer(tag, istTrainingstag, wahl = {}, istWohlTag = () => false) {
  return wochenEssen(wochenStart(tag), istTrainingstag, wahl, istWohlTag).find(x => x.tag === tag).rezept;
}

/** Nächstes Rezept derselben Mahlzeit (für „anderes Gericht“). */
export function naechstesRezept(aktuell, nurNachTraining = false) {
  const pool = REZEPTE.filter(r => r.mahlzeit === aktuell.mahlzeit && (!nurNachTraining || r.tags.includes('nach-training')));
  const i = pool.findIndex(r => r.id === aktuell.id);
  return pool[(i + 1) % pool.length];
}

/** Menge für die Anzeige runden. */
export function mengeText(m, e) {
  if (m === null || m === undefined) return '';
  let wert;
  if (e === 'g' || e === 'ml') wert = m >= 100 ? Math.round(m / 10) * 10 : Math.round(m / 5) * 5 || Math.round(m);
  else wert = Math.round(m * 4) / 4;
  const bruch = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  const ganz = Math.floor(wert), rest = Math.round((wert - ganz) * 100) / 100;
  const text = rest && bruch[rest] ? `${ganz || ''}${bruch[rest]}` : String(wert).replace('.', ',');
  return e ? `${text} ${e}` : text;
}

/** Zutaten eines Rezepts für `personen` Portionen skalieren. */
export function skaliert(r, personen) {
  const f = personen / r.portionen;
  return r.zutaten.map(x => ({ ...x, m: x.m === null ? null : x.m * f }));
}

/**
 * Einkaufsliste aus mehreren Rezepten (je `personen` Portionen) zusammenfassen.
 * Gleiche Zutat + Einheit wird addiert. Stück/Dose/Bund werden aufgerundet (halbe Dose kauft man nicht).
 * @returns {{frisch: Array<{key, n, text}>, vorrat: Array<{key, n, text}>}}
 */
export function einkaufsliste(rezepte, personen) {
  const summe = new Map();
  for (const r of rezepte) {
    for (const x of skaliert(r, personen)) {
      const key = `${x.n}|${x.e}`;
      const alt = summe.get(key);
      summe.set(key, { ...x, key, m: x.m === null ? null : (alt?.m || 0) + x.m });
    }
  }
  const liste = [...summe.values()].map(x => {
    const m = ['Stk', 'Dose', 'Bund', 'Scheibe'].includes(x.e) && x.m !== null ? Math.ceil(x.m - 0.01) : x.m;
    return { key: x.key, n: x.n, vorrat: !!x.vorrat, text: mengeText(m, x.e) };
  }).sort((a, b) => a.n.localeCompare(b.n, 'de'));
  // Vorrat: nur Namen, Gewürzketten aufteilen und doppelte zusammenfassen (Mengen sind beim Vorrat egal)
  const vorrat = [...new Set(liste.filter(x => x.vorrat).flatMap(x => x.n.split(/,\s*/)))]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map(n => ({ key: `vorrat|${n}`, n, vorrat: true, text: '' }));
  return { frisch: liste.filter(x => !x.vorrat), vorrat };
}
