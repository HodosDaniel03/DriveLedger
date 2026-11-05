import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (/\.(jsx?|tsx?|html)$/.test(f)) {
      files.push(full);
    }
  }
  return files;
}

const hungarianRegex = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
const files = walk('./src');
const matches = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (hungarianRegex.test(line)) {
      matches.push({ file: path.relative('.', file), line: idx + 1, content: line.trim() });
    }
  });
}

console.log('Total matches with Hungarian characters in ./src/:', matches.length);
const byFile = {};
matches.forEach(m => {
  byFile[m.file] = (byFile[m.file] || 0) + 1;
});
console.log('Matches by file:');
for (const [f, count] of Object.entries(byFile)) {
  console.log(`  ${f}: ${count}`);
}
console.log('\nSample matches:');
matches.slice(0, 20).forEach(m => console.log(`${m.file}:${m.line} -> ${m.content.slice(0, 100)}`));
