// Eingebaute Lebensmittel-Liste (offline). Werte pro 100 g bzw. 100 ml, gerundete Durchschnittswerte
// aus gängigen Nährwerttabellen. Reicht zum Einschätzen, ist aber keine Laborangabe.
// Format: [Name, kcal/100, Eiweiß g/100, Portion, Gramm je Portion, Suchwörter]

import { normalisiere, suche } from './bibliothek.js';

const ROH = [
  // Obst
  ['Apfel', 52, 0.3, '1 Stück', 150, 'obst'], ['Banane', 93, 1.1, '1 Stück', 120, 'obst'], ['Birne', 55, 0.4, '1 Stück', 160, 'obst'],
  ['Orange', 47, 0.9, '1 Stück', 180, 'obst apfelsine'], ['Mandarine', 50, 0.7, '1 Stück', 70, 'obst clementine'], ['Kiwi', 61, 1.1, '1 Stück', 75, 'obst'],
  ['Erdbeeren', 32, 0.7, '1 Handvoll', 100, 'obst beeren'], ['Heidelbeeren', 42, 0.6, '1 Handvoll', 100, 'obst beeren blaubeeren'],
  ['Himbeeren', 43, 1.3, '1 Handvoll', 100, 'obst beeren'], ['Weintrauben', 70, 0.7, '1 Handvoll', 100, 'obst trauben'],
  ['Mango', 62, 0.6, '½ Stück', 150, 'obst'], ['Ananas', 55, 0.5, '1 Scheibe', 100, 'obst'], ['Wassermelone', 30, 0.6, '1 Stück', 250, 'obst melone'],
  ['Pfirsich / Nektarine', 44, 0.9, '1 Stück', 140, 'obst'], ['Pflaumen', 47, 0.6, '3 Stück', 100, 'obst zwetschgen'],
  ['Avocado', 160, 2, '½ Stück', 75, 'obst'], ['Datteln, getrocknet', 282, 2.5, '3 Stück', 25, 'trockenobst'], ['Rosinen', 299, 3, '1 EL', 15, 'trockenobst'],
  // Gemüse und Hülsenfrüchte
  ['Gurke', 12, 0.6, '½ Gurke', 200, 'gemuese salat'], ['Tomate', 18, 0.9, '1 Stück', 100, 'gemuese'], ['Kirschtomaten', 20, 1, '1 Handvoll', 100, 'gemuese'],
  ['Paprika', 30, 1, '1 Stück', 150, 'gemuese'], ['Karotte', 36, 0.9, '1 Stück', 80, 'gemuese moehre'], ['Brokkoli', 34, 3, '1 Portion', 150, 'gemuese'],
  ['Blumenkohl', 25, 2, '1 Portion', 150, 'gemuese'], ['Zucchini', 20, 1.5, '1 Stück', 200, 'gemuese'], ['Spinat', 23, 2.9, '1 Portion', 150, 'gemuese blattspinat'],
  ['Blattsalat', 15, 1.3, '1 Schale', 80, 'gemuese salat'], ['Champignons', 22, 3, '1 Portion', 150, 'gemuese pilze'], ['Erbsen', 81, 5.4, '1 Portion', 150, 'gemuese'],
  ['Mais (Dose)', 86, 3, '½ Dose', 140, 'gemuese'], ['Kartoffeln, gekocht', 77, 2, '1 Portion', 200, 'beilage'], ['Süßkartoffel', 86, 1.6, '1 Stück', 200, 'beilage'],
  ['Zwiebel', 40, 1.1, '1 Stück', 80, 'gemuese'], ['Kichererbsen (Dose)', 120, 7, '½ Dose', 120, 'huelsenfruechte'],
  ['Linsen, gekocht', 116, 9, '1 Portion', 150, 'huelsenfruechte'], ['Kidneybohnen (Dose)', 105, 8, '½ Dose', 125, 'huelsenfruechte bohnen'],
  ['Edamame', 121, 12, '1 Portion', 100, 'sojabohnen'], ['Rote Bete', 43, 1.6, '1 Portion', 100, 'gemuese'], ['Kürbis (Hokkaido)', 63, 1.7, '1 Portion', 200, 'gemuese'],
  ['Grüne Bohnen', 31, 2, '1 Portion', 150, 'gemuese'], ['Rosenkohl', 43, 3.4, '1 Portion', 150, 'gemuese'],
  // Brot, Getreide, Beilagen
  ['Vollkornbrot', 220, 7, '1 Scheibe', 50, 'brot'], ['Mischbrot', 240, 8, '1 Scheibe', 50, 'brot'], ['Toast', 260, 8, '1 Scheibe', 28, 'brot toastbrot'],
  ['Brötchen', 270, 9, '1 Stück', 55, 'semmel weizenbroetchen'], ['Vollkornbrötchen', 240, 9, '1 Stück', 60, 'semmel'], ['Laugenbrezel', 270, 8, '1 Stück', 80, 'breze'],
  ['Croissant', 410, 8, '1 Stück', 60, 'gebaeck'], ['Knäckebrot', 340, 10, '1 Scheibe', 10, 'brot'], ['Reiswaffel', 385, 8, '1 Stück', 8, 'snack'],
  ['Haferflocken', 370, 13, '1 Portion', 50, 'fruehstueck porridge'], ['Müsli ohne Zucker', 360, 10, '1 Portion', 60, 'fruehstueck'],
  ['Cornflakes', 375, 7, '1 Portion', 30, 'fruehstueck'], ['Granola / Knuspermüsli', 450, 9, '1 Portion', 50, 'fruehstueck crunchy'],
  ['Nudeln, gekocht', 150, 5.5, '1 Portion', 250, 'pasta spaghetti'], ['Vollkornnudeln, gekocht', 140, 6, '1 Portion', 250, 'pasta'],
  ['Reis, gekocht', 130, 2.7, '1 Portion', 200, 'beilage'], ['Couscous, gekocht', 112, 3.8, '1 Portion', 200, 'beilage'],
  ['Quinoa, gekocht', 120, 4.4, '1 Portion', 200, 'beilage'], ['Bulgur, gekocht', 83, 3, '1 Portion', 200, 'beilage'],
  ['Tortilla / Wrap', 300, 8, '1 Stück', 60, 'brot'],
  // Milch, Ei, Käse
  ['Milch 1,5 %', 47, 3.4, '1 Glas', 200, 'getraenk'], ['Milch 3,5 %', 64, 3.3, '1 Glas', 200, 'getraenk vollmilch'],
  ['Hafermilch', 45, 1, '1 Glas', 200, 'haferdrink pflanzendrink'], ['Sojamilch', 39, 3.3, '1 Glas', 200, 'sojadrink pflanzendrink'],
  ['Naturjoghurt 1,5 %', 47, 4, '1 Becher', 150, 'joghurt'], ['Griechischer Joghurt', 120, 5, '1 Becher', 150, 'joghurt'],
  ['Skyr', 63, 11, '1 Becher', 150, 'joghurt'], ['Magerquark', 67, 12, '1 Portion', 125, 'quark'], ['Hüttenkäse', 100, 12, '1 Becher', 200, 'koerniger frischkaese'],
  ['Frischkäse', 200, 7, '1 EL', 30, 'kaese'], ['Gouda', 360, 25, '1 Scheibe', 25, 'kaese'], ['Mozzarella', 250, 19, '1 Kugel', 125, 'kaese'],
  ['Feta', 260, 17, '1 Portion', 50, 'kaese schafskaese'], ['Parmesan', 390, 35, '1 EL', 10, 'kaese'], ['Butter', 740, 0.7, '1 TL', 5, 'fett'],
  ['Ei', 140, 12.5, '1 Stück', 60, 'eier spiegelei ruehrei'], ['Sahne', 290, 2.4, '1 EL', 15, 'schlagsahne'],
  ['Cappuccino', 40, 2.2, '1 Tasse', 200, 'kaffee'], ['Latte Macchiato', 55, 3, '1 Glas', 300, 'kaffee'],
  // Fleisch, Fisch, pflanzliches Eiweiß
  ['Hähnchenbrust', 110, 23, '1 Portion', 150, 'fleisch huhn'], ['Putenbrust', 105, 24, '1 Portion', 150, 'fleisch pute'],
  ['Rinderhack', 250, 18, '1 Portion', 125, 'fleisch hackfleisch'], ['Rindersteak', 150, 22, '1 Portion', 180, 'fleisch'],
  ['Schweineschnitzel', 110, 22, '1 Portion', 150, 'fleisch'], ['Lachs', 200, 20, '1 Filet', 125, 'fisch'],
  ['Thunfisch (Dose, eigener Saft)', 110, 25, '1 Dose', 140, 'fisch'], ['Räucherlachs', 180, 20, '1 Portion', 50, 'fisch'],
  ['Garnelen', 90, 18, '1 Portion', 100, 'fisch shrimps'], ['Fischstäbchen', 200, 13, '4 Stück', 120, 'fisch'],
  ['Salami', 380, 20, '3 Scheiben', 20, 'wurst aufschnitt'], ['Kochschinken', 110, 19, '2 Scheiben', 40, 'wurst aufschnitt'],
  ['Putenaufschnitt', 105, 20, '2 Scheiben', 40, 'wurst aufschnitt'], ['Bratwurst', 300, 14, '1 Stück', 100, 'wurst grillen'],
  ['Wiener Würstchen', 270, 13, '1 Paar', 100, 'wurst'], ['Tofu natur', 120, 12, '1 Portion', 150, 'vegan'],
  ['Räuchertofu', 150, 16, '1 Portion', 100, 'vegan'], ['Hummus', 250, 7, '2 EL', 40, 'dip vegan'], ['Falafel', 333, 13, '3 Stück', 75, 'vegan'],
  // Fette, Nüsse, Samen
  ['Olivenöl', 884, 0, '1 EL', 10, 'oel fett'], ['Mandeln', 600, 21, '1 Handvoll', 25, 'nuesse'], ['Walnüsse', 670, 15, '1 Handvoll', 25, 'nuesse'],
  ['Cashews', 580, 18, '1 Handvoll', 25, 'nuesse'], ['Erdnüsse', 600, 25, '1 Handvoll', 25, 'nuesse'], ['Erdnussmus', 620, 25, '1 EL', 15, 'erdnussbutter'],
  ['Nussmix', 620, 18, '1 Handvoll', 25, 'nuesse studentenfutter'], ['Chiasamen', 490, 17, '1 EL', 12, 'samen'], ['Leinsamen', 530, 18, '1 EL', 10, 'samen'],
  ['Kürbiskerne', 560, 30, '1 EL', 10, 'samen'],
  // Süßes und Snacks
  ['Vollmilchschokolade', 540, 7, '4 Stückchen', 25, 'suesses schoko'], ['Zartbitterschokolade 70 %', 580, 8, '4 Stückchen', 25, 'suesses schoko'],
  ['Gummibärchen', 340, 7, '1 Handvoll', 40, 'suesses fruchtgummi'], ['Chips', 535, 6, '1 Handvoll', 30, 'snack'], ['Salzstangen', 380, 10, '1 Handvoll', 30, 'snack'],
  ['Butterkekse', 440, 8, '3 Stück', 20, 'suesses kekse'], ['Müsliriegel', 400, 6, '1 Stück', 25, 'snack riegel'], ['Proteinriegel', 360, 33, '1 Stück', 55, 'snack riegel'],
  ['Rührkuchen', 390, 6, '1 Stück', 70, 'suesses kuchen'], ['Käsekuchen', 230, 7, '1 Stück', 120, 'suesses kuchen'], ['Donut', 400, 5, '1 Stück', 70, 'suesses'],
  ['Eis (Milcheis)', 200, 3.5, '1 Kugel', 60, 'suesses eiscreme'], ['Nuss-Nougat-Creme', 540, 6, '1 EL', 15, 'suesses aufstrich nutella'],
  ['Marmelade', 250, 0.3, '1 TL', 10, 'aufstrich konfituere'], ['Honig', 310, 0.4, '1 TL', 10, 'aufstrich'], ['Zucker', 400, 0, '1 TL', 5, 'suesses'],
  ['Popcorn, gesalzen', 470, 9, '1 Portion', 30, 'snack kino'],
  // Getränke
  ['Cola', 42, 0, '1 Glas', 330, 'getraenk limo'], ['Cola Zero / Light', 0.3, 0, '1 Glas', 330, 'getraenk'], ['Orangensaft', 45, 0.7, '1 Glas', 200, 'getraenk saft'],
  ['Apfelschorle', 24, 0, '1 Glas', 300, 'getraenk'], ['Bier', 43, 0.5, '1 Flasche', 500, 'getraenk alkohol'], ['Rotwein', 85, 0.1, '1 Glas', 200, 'getraenk alkohol wein'],
  ['Weißwein', 82, 0.1, '1 Glas', 200, 'getraenk alkohol wein'], ['Sekt / Prosecco', 80, 0, '1 Glas', 100, 'getraenk alkohol'],
  ['Aperol Spritz', 75, 0, '1 Glas', 200, 'getraenk alkohol cocktail'], ['Kaffee, schwarz', 2, 0.1, '1 Tasse', 200, 'getraenk'],
  ['Smoothie', 55, 0.6, '1 Flasche', 250, 'getraenk'], ['Proteinpulver', 380, 75, '1 Portion', 30, 'shake whey'],
  // Unterwegs und Fertiges
  ['Döner', 215, 12, '1 Stück', 400, 'unterwegs imbiss'], ['Pommes', 290, 3, '1 Portion', 150, 'unterwegs imbiss fritten'],
  ['Burger', 250, 13, '1 Stück', 220, 'unterwegs imbiss'], ['Currywurst', 230, 9, '1 Portion', 250, 'unterwegs imbiss'],
  ['Pizza Margherita', 230, 10, '½ Pizza', 175, 'unterwegs'], ['Pizza Salami', 260, 11, '½ Pizza', 175, 'unterwegs'],
  ['Sushi (Maki)', 150, 5, '8 Stück', 200, 'unterwegs'], ['Lasagne', 160, 9, '1 Portion', 350, 'auflauf'], ['Spaghetti Bolognese', 140, 7, '1 Teller', 400, 'pasta nudeln'],
  ['Kartoffelsalat', 150, 2, '1 Portion', 200, 'beilage'], ['Belegtes Käsebrötchen', 260, 12, '1 Stück', 120, 'unterwegs baecker'],
  ['Gemüsesuppe', 40, 1.5, '1 Teller', 350, 'suppe'], ['Linsensuppe', 80, 5, '1 Teller', 350, 'suppe eintopf'],
];

export const LEBENSMITTEL = ROH.map(([name, kcal100, ew100, portion, portionG, stichworte]) => ({
  id: 'lm-' + normalisiere(name).replace(/ /g, '-'), name, kcal100, ew100, portion, portionG, stichworte,
}));

export function sucheLebensmittel(text, extra = []) {
  return suche(text, [...LEBENSMITTEL, ...extra], e => [e.name, e.stichworte, e.marke]);
}

/** kcal und Eiweiß für eine Menge in Gramm, gerundet. */
export function naehrwerte(lm, gramm) {
  return { kcal: Math.round((lm.kcal100 * gramm) / 100), eiweiss: Math.round((lm.ew100 * gramm) / 10) / 10 };
}
