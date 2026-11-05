const fs = require('fs');
const files = [
  'src/components/layout/Navbar.jsx',
  'src/components/layout/Footer.jsx',
  'src/index.css',
  'src/App.css',
  'src/components/calculators/TcoCalculator.jsx',
  'src/components/calculators/CostTimeline.jsx',
  'src/components/calculators/EvBreakEvenCalculator.jsx',
  'src/components/common/VehicleHierarchySelector.jsx'
];
const regex = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
let matchCount = 0;
files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log('NOT FOUND:', f);
    return;
  }
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (regex.test(line)) {
      matchCount++;
      console.log(`${f}:${idx+1}: ${line.trim()}`);
    }
  });
});
console.log('Total Hungarian matches in assigned files:', matchCount);
