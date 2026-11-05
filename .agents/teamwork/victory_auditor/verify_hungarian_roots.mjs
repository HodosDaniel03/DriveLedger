import fs from 'fs';
import path from 'path';

const hungarianRoots = [
  '\\bhiba\\b', '\\bleiras\\b', '\\bmegjegyzes\\b', '\\bkockazat\\b',
  '\\bszamla\\b', '\\bfutas\\b', '\\bfogyasztas\\b', '\\balacsony\\b',
  '\\bkozepes\\b', '\\bkritikus\\b', '\\bjavitas\\b', '\\bkarbantartas\\b',
  '\\bautopalya\\b', '\\bvarosi\\b', '\\bvelemeny\\b', '\\btipus\\b',
  '\\bgyarto\\b', '\\bevjarat\\b', '\\bvalto\\b', '\\balvazszam\\b',
  '\\bpenz\\b', '\\bforint\\b', '\\bkoltseg\\b', '\\bkoltsegek\\b',
  '\\bkarbantartasi\\b', '\\bgarancia\\b', '\\bigen\\b', '\\bnem\\b' // note: 'nem' can be part of something or 'in' in some languages, check
];

let files = ['index.html'];

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full);
    } else if (/\.(jsx?|tsx?|html|css|json)$/.test(item.name)) {
      files.push(full);
    }
  }
}

walk('src');

let matches = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const root of hungarianRoots) {
    const r = new RegExp(root, 'gi');
    let m;
    while ((m = r.exec(content)) !== null) {
      console.log(`Matched '${m[0]}' in ${file} at index ${m.index}`);
      matches++;
    }
  }
}

console.log(`Scanned ${files.length} files. Hungarian root matches: ${matches}`);
if (matches > 0) process.exit(1);
