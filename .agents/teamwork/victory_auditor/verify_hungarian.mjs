import fs from 'fs';
import path from 'path';

const regex = /[\u00E1\u00E9\u00ED\u00F3\u00F6\u0151\u00FA\u00FC\u0171\u00C1\u00C9\u00CD\u00D3\u00D6\u0150\u00DA\u00DC\u0170]/u;
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

let hitCount = 0;
const hits = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (regex.test(line)) {
      hits.push({ file, lineNum: idx + 1, content: line.trim() });
      hitCount++;
    }
  });
}

console.log(`Scanned ${files.length} files.`);
console.log(`Total Hungarian character hits: ${hitCount}`);
if (hitCount > 0) {
  console.log('Hits:');
  hits.forEach(h => console.log(`  ${h.file}:${h.lineNum} -> ${h.content}`));
  process.exit(1);
} else {
  console.log('ALL CLEAN: 0 Hungarian accented characters found.');
}
