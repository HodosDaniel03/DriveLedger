#!/usr/bin/env node
import { TypeSafeClient, noul, choice, score } from '@typesafe-ai/sdk';
import { VEHICLE_CATALOG } from '../src/data/vehicleCatalog.js';

const apiKey = process.env.TYPESAFE_API_KEY;

if (!apiKey) {
  console.error('❌ Hiba: TYPESAFE_API_KEY nincs beállítva a környezeti változók között.');
  console.log('Beállítás PowerShellben: $env:TYPESAFE_API_KEY="a_kulcsod"');
  process.exit(1);
}

const client = new TypeSafeClient({ apiKey });

async function runQuickAudit() {
  console.log('🔍 Jev System One modell ellenőrzés indítása...\n');

  const engine = VEHICLE_CATALOG[0].models[0].engines[0];
  console.log(`Vizsgált jármű: ${engine.name} (${engine.powerHp} LE, ${engine.powertrainLabel})`);

  const evaluation = await client.systemOne({
    state: `Vehicle: ${engine.name}, HP: ${engine.powerHp}, Fuel: ${engine.fuelType}, Known risk: ${engine.knownRiskNotes}`,
    questions: {
      isRealistic: noul({
        instructions: 'Is this production vehicle specification and maintenance risk realistic?'
      }),
      riskScore: score({
        instructions: 'Score the component mechanical failure risk on a 1-5 scale (1=safe, 5=high risk).',
        scale: [1, 2, 3, 4, 5]
      })
    }
  });

  console.log('\n📊 Jev Eredmények:');
  console.log(`- Plauzibilitás (Noul): ${(evaluation.answers.isRealistic.noul * 100).toFixed(1)}%`);
  console.log(`- Mechanikai kockázati pont (Score): ${evaluation.answers.riskScore.score}/5`);
}

runQuickAudit().catch((err) => {
  console.error('Hiba az értékelés során:', err.message);
  process.exit(1);
});
