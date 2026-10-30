import assert from 'node:assert/strict';
import test from 'node:test';
import { TypeSafeClient, noul, score, choice } from '@typesafe-ai/sdk';
import { VEHICLE_CATALOG } from '../src/data/vehicleCatalog.js';
import { MAINTENANCE_COMPONENTS } from '../src/data/maintenanceData.js';
import { OBD_CODES } from '../src/data/obdCodes.js';

const apiKey = process.env.TYPESAFE_API_KEY;

test('Jev-as-a-Judge: Szemantikai katalógus és szervizintervallum ellenőrzés', async (t) => {
  if (!apiKey) {
    t.skip(
      'TYPESAFE_API_KEY környezeti változó hiányzik. A szemantikai Jev teszthez állítsd be: $env:TYPESAFE_API_KEY="your-key"'
    );
    return;
  }

  const client = new TypeSafeClient({ apiKey });

  await t.test('1. Motor adatok szemantikai realitása (Noul primitív)', async () => {
    // Első reprezentatív dízel és turbó benzines motor vizsgálata
    const vwGolfTdi = VEHICLE_CATALOG[0].models[0].engines.find((e) => e.id === 'vw-golf-20-tdi');
    assert.ok(vwGolfTdi, 'VW Golf 2.0 TDI engine record must exist');

    const state = `
      Vehicle: ${vwGolfTdi.brand} ${vwGolfTdi.modelName}
      Engine: ${vwGolfTdi.engineCode}
      Power: ${vwGolfTdi.powerHp} HP
      Fuel: ${vwGolfTdi.fuelType}
      Powertrain: ${vwGolfTdi.powertrainLabel}
      Reported MPG (US): ${vwGolfTdi.mpgUs}
    `;

    const result = await client.systemOne({
      state,
      questions: {
        isPlausible: noul({
          instructions:
            'Are these automotive specs (HP vs fuel type vs US MPG) technically realistic for a modern production road car?'
        })
      }
    });

    const probability = result.answers.isPlausible.noul;
    assert.ok(
      probability > 0.85,
      `A jármű specifikációi valószínűleg hibásak vagy elírást tartalmaznak (plauzibilitás: ${probability})`
    );
  });

  await t.test('2. Archetípus és szegmens besorolás konzisztenciája (Choice primitív)', async () => {
    const golfGti = VEHICLE_CATALOG[0].models[0].engines.find((e) => e.id === 'vw-golf-gti-ea888');
    assert.ok(golfGti, 'Golf GTI record must exist');

    const state = `
      Vehicle: ${golfGti.name}
      Horsepower: ${golfGti.powerHp} HP
      Body: ${golfGti.bodyType}
      Powertrain: ${golfGti.powertrainLabel}
      Segment in DB: ${golfGti.segment}
    `;

    const result = await client.systemOne({
      state,
      questions: {
        category: choice({
          instructions: 'What is the most accurate automotive category for this vehicle configuration?',
          options: ['hot_hatch_performance', 'heavy_commercial_truck', 'economy_city_commuter', 'offroad_suv']
        })
      }
    });

    const chosenOption = result.answers.category.choice;
    assert.equal(
      chosenOption,
      'hot_hatch_performance',
      `A Jev besorolás eltér a várt szegmenstől (kapott: ${chosenOption})`
    );
  });

  await t.test('3. Karbantartási és hibakód kockázati rubrika pontozás (Score primitív)', async () => {
    // Vizsgáljuk a VW TDI ismert vízpumpa és termosztát hibáját
    const vwGolfTdi = VEHICLE_CATALOG[0].models[0].engines.find((e) => e.id === 'vw-golf-20-tdi');
    const state = `
      Component issue: ${vwGolfTdi.criticalDefectTag}
      Diagnostic details: ${vwGolfTdi.knownRiskNotes}
      Associated OBD codes: ${(vwGolfTdi.commonObdCodes || []).join(', ')}
    `;

    const result = await client.systemOne({
      state,
      questions: {
        severityScore: score({
          instructions:
            'Score the severity risk of this defect to engine longevity on an automotive engineering rubric: 1 (cosmetic/minor) to 5 (critical risk of engine overheating/seizure).',
          scale: [1, 2, 3, 4, 5]
        })
      }
    });

    const scoreValue = result.answers.severityScore.score;
    // A hűtőrendszer megszorulása / túlmelegedése legalább 3-as vagy 4-es súlyosságú kell legyen
    assert.ok(
      scoreValue >= 3,
      `A kritikus hiba súlyossága túl alacsony pontot kapott a szervizrubrikán (pont: ${scoreValue})`
    );
  });
});
