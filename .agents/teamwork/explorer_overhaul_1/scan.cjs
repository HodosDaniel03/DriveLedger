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

const huRegex = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
const summary = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const fileMatches = [];
  lines.forEach((line, idx) => {
    if (huRegex.test(line)) {
      fileMatches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });
  const relPath = file.replace(/\\/g, '/');
  if (fileMatches.length > 0) {
    summary.push({ file: relPath, count: fileMatches.length, matches: fileMatches });
  }
});

console.log('Total files scanned:', files.length);
console.log('Files with Hungarian characters:', summary.length);
let totalLines = 0;
summary.forEach(s => {
  totalLines += s.count;
  console.log(`${s.file}: ${s.count} matching lines`);
});
console.log('Total matching lines with accented chars:', totalLines);

fs.writeFileSync('.agents/teamwork/explorer_overhaul_1/accent_matches.json', JSON.stringify(summary, null, 2));
