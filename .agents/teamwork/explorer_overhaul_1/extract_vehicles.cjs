const fs = require('fs');
const path = require('path');

const vehicleFiles = [
  'bmw.js',
  'ford.js',
  'hyundaiKia.js',
  'mercedes.js',
  'stellantis.js',
  'tesla.js',
  'toyota.js',
  'vag.js',
  'index.js',
  'schema.js'
];

const huRegex = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
const results = {};

vehicleFiles.forEach(file => {
  const filePath = path.join('src/data/vehicles', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileMatches = [];
  lines.forEach((line, idx) => {
    if (huRegex.test(line) || /gyermekbetegseg/i.test(line)) {
      fileMatches.push({
        line: idx + 1,
        raw: line.trim()
      });
    }
  });
  results[file] = fileMatches;
});

fs.writeFileSync('.agents/teamwork/explorer_overhaul_1/vehicles_hu.json', JSON.stringify(results, null, 2));

console.log('Summary of vehicles/*.js matches:');
for (const [f, matches] of Object.entries(results)) {
  console.log(`${f}: ${matches.length} matches`);
}
