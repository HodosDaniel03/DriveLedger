const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('./src');
files.push('./index.html');

// Hungarian stop words & common automotive words
const huWords = [
  'vegyem', 'hasznaltauto', 'használt', 'koltseg', 'költség', 'megterules', 'megtérülés',
  'vasarlas', 'vásárlás', 'futas', 'futás', 'szerviz', 'kockazat', 'kockázat', 'mátrix',
  'alacsony', 'kozepes', 'közepes', 'kritikus', 'valasztott', 'választott', 'jarmu', 'jármű',
  'hibakod', 'hibakód', 'fogyasztas', 'fogyasztás', 'uzemanyag', 'üzemanyag', 'karbantartas', 'karbantartás',
  'osszehasonlitas', 'összehasonlítás', 'ertekvesztes', 'értékvesztés', 'ellenorzolista', 'ellenőrzőlista',
  'tipushiba', 'típushiba', 'valto', 'váltó', 'futomu', 'futómű', 'akkumulator', 'akkumulátor',
  'felev', 'félév', 'honap', 'hónap', 'atlag', 'átlag', 'teljesitmeny', 'teljesítmény', 'nyomatek', 'nyomaték',
  'hengerurtartalom', 'hengerűrtartalom', 'felar', 'felár', 'megbizhatosag', 'megbízhatóság',
  'maradvanyertek', 'maradványérték', 'kotelezo', 'kötelező', 'biztositas', 'biztosítás',
  'atiras', 'átírás', 'illetek', 'illeték', 'osszeg', 'összeg', 'javitas', 'javítás', 'alkatresz', 'alkatrész',
  'munkadij', 'munkadíj', 'vezerles', 'vezérlés', 'lanc', 'szij', 'szíj', 'lendkerek', 'lendkerék',
  'kuplung', 'marka', 'márka', 'modell', 'gyermekbetegseg', 'gyermekbetegségek', 'gyermekbetegsegek',
  'spen', 'spém', 'szuro', 'szűrő', 'olajcsere', 'vizpumpa', 'vízpumpa', 'termosztat', 'termosztát',
  'katalizator', 'katalizátor', 'reszecskeszuro', 'részecskeszűrő', 'adagolo', 'adagoló', 'injektor',
  'porlaszto', 'porlasztó', 'lengescsillapito', 'lengéscsillapító', 'fekbetet', 'fékbetét', 'fektarcsa', 'féktárcsa',
  'kormanymu', 'kormánymű', 'szilent', 'gombfej', 'gömbfej', 'huto', 'hűtő', 'kipufogo', 'kipufogó',
  'szelep', 'tomites', 'tömítés', 'gyujtas', 'gyújtás', 'gyertya', 'izzitas', 'izzítás', 'onindito', 'önindító',
  'generator', 'generátor', 'klima', 'klíma', 'kompresszor', 'biztositek', 'biztosíték', 'rele', 'relé',
  'erzekelo', 'érzékelő', 'szonda', 'legtomegmero', 'légtömegmérő', 'fojtoszelep', 'fojtószelep',
  'toltonyomas', 'töltőnyomás', 'feltolto', 'feltöltő', 'szivocso', 'szívócső', 'szivosor', 'szívósor',
  'hengerfej', 'fotengely', 'főtengely', 'hajtokar', 'hajtókar', 'dugattyu', 'dugattyú',
  'feknyereg', 'féknyereg', 'kezifek', 'kézifék', 'fekrasegito', 'fékrásegítő', 'fofekhenger', 'főfékhenger',
  'fekfolyadek', 'fékfolyadék', 'hutofolyadek', 'hűtőfolyadék', 'fagyallo', 'fagyálló', 'valtoolaj', 'váltóolaj',
  'szervoolaj', 'szervóolaj', 'differencialmu', 'differenciálmű', 'osztomu', 'osztómű', 'kardantengely', 'kardántengely',
  'feltengely', 'féltengely', 'csuklo', 'csukló', 'porvedo', 'porvédő', 'gumiharang', 'lengokar', 'lengőkar',
  'rugo', 'stabilizator', 'stabilizátor', 'kerekcsapagy', 'kerékcsapágy', 'potkerek', 'pótkerék',
  'elakadasjelzo', 'elakadásjelző', 'lathatosagi', 'láthatósági', 'elsosegely', 'elsősegély',
  'izzokeszlet', 'izzókészlet', 'tuzolto', 'tűzoltó', 'keszulek', 'készülék',
  'velemeny', 'vélemény', 'ertekeles', 'értékelés', 'tapasztalat', 'megosztas', 'megosztás',
  'kalkulacio', 'kalkuláció', 'osszehasonlito', 'összehasonlító', 'adatbazis', 'adatbázis', 'muszaki', 'műszaki',
  'atvizsgalas', 'átvizsgálás', 'jegyzokonyv', 'jegyzőkönyv', 'nyomtathato', 'nyomtatható', 'letoltheto', 'letölthető'
];

const foundInFiles = {};
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/');
  huWords.forEach(w => {
    const re = new RegExp('\\b' + w + '\\b', 'i');
    if (re.test(content)) {
      if (!foundInFiles[rel]) foundInFiles[rel] = new Set();
      foundInFiles[rel].add(w);
    }
  });
});

for (const [file, words] of Object.entries(foundInFiles)) {
  console.log(`${file}: ${Array.from(words).join(', ')}`);
}
