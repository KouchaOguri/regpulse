import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const outFile = path.resolve('node_modules/.cache/scanner-test.mjs');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
await esbuild.build({
  entryPoints: ['src/engine/scanner.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
});

const { scanListing } = await import(pathToFileURL(outFile).href);

const recalls = JSON.parse(fs.readFileSync(new URL('../src/data/recalls.json', import.meta.url), 'utf-8'));

// Test 1: Compliant supplement WITH standard DSHEA disclaimer must NOT falsely trigger disease claims!
const cleanSup = scanListing(
  {
    vertical: 'supplements',
    title: 'Magnesium Glycinate 400mg – Supports Restful Sleep and Calm Mood',
    bullets:
      '• Supports everyday relaxation and normal muscle recovery after exercise.\n• Manufactured in an FDA-registered, cGMP-compliant facility.\n*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
    ingredients: 'Magnesium Glycinate, Vegetable Cellulose Capsule, Rice Flour.',
  },
  recalls
);
assert.equal(cleanSup.findings.length, 0, `Expected 0 findings on clean supplement, got: ${JSON.stringify(cleanSup.findings.map(f => f.rule.id))}`);
assert.equal(cleanSup.grade, 'LOW', `Expected LOW grade, got ${cleanSup.grade}`);
assert.ok(cleanSup.mandatoryChecks.some((m) => m.id === 'MAND-DSHEA-01' && m.passed), 'DSHEA disclaimer should PASS');

// Test 2: Missing DSHEA disclaimer on structure-function supplement MUST warn
const missingDisclaimer = scanListing(
  {
    vertical: 'supplements',
    title: 'Daily Probiotic Blend – Supports Gut Health and Immune Support',
    bullets: '• Helps maintain digestive comfort and everyday wellness.',
    ingredients: 'Lactobacillus acidophilus, Inulin.',
  },
  recalls
);
assert.equal(missingDisclaimer.findings.length, 0);
assert.ok(missingDisclaimer.mandatoryChecks.some((m) => m.id === 'MAND-DSHEA-01' && !m.passed), 'Missing DSHEA disclaimer should FAIL');

// Test 3: High-risk skincare with drug claims, hydroquinone, EPA antibacterial, FDA Approved
const riskyCosmetic = scanListing(
  {
    vertical: 'cosmetics',
    title: 'FDA Approved Anti-Acne Retinol Serum – Treats Acne & Reduces Inflammation',
    bullets: '• Kills 99.9% of bacteria and stimulates collagen production. Botox alternative.',
    ingredients: 'Water, Glycerin, Hydroquinone 2%, Fragrance.',
  },
  recalls
);
assert.equal(riskyCosmetic.grade, 'CRITICAL');
assert.ok(riskyCosmetic.findings.length >= 5, `Expected >=5 findings, got ${riskyCosmetic.findings.length}`);
assert.ok(riskyCosmetic.findings.some((f) => f.rule.id === 'EPA-PEST-001'), 'Should catch EPA pesticide trigger');
assert.ok(riskyCosmetic.findings.some((f) => f.rule.id === 'COS-DRUG-005'), 'Should catch hydroquinone');

// Test 4: Tainted supplement with sildenafil + Nature's Ozempic + lowers blood sugar
const taintedSup = scanListing(
  {
    vertical: 'supplements',
    title: "Nature's Ozempic Berberine – Lowers Blood Sugar & Cures Insomnia",
    bullets: '• 100% guaranteed results. Clinically proven weight loss.',
    ingredients: 'Berberine, Sildenafil Citrate, DMAA.',
  },
  recalls
);
assert.equal(taintedSup.grade, 'CRITICAL');
assert.ok(taintedSup.findings.some((f) => f.rule.id === 'ING-TAINT-001'), 'Should catch tainted drug ingredients');
assert.ok(taintedSup.findings.some((f) => f.rule.id === 'SUP-DIS-006'), 'Should catch Ozempic/GLP-1 claim');

// Test 5: Clean cosmetic WITH U.S. contact should score 0 / LOW
const cleanCosmetic = scanListing(
  {
    vertical: 'cosmetics',
    title: 'Hydrating Hyaluronic Acid Facial Serum – Visibly Plumps & Softens Look of Fine Lines',
    bullets: '• Lightweight moisture barrier support for smoother-looking, radiant skin.\n• Questions or adverse event comments? Contact Responsible Person at support@example.com or 1-800-555-0199, Austin TX.',
    ingredients: 'Water, Sodium Hyaluronate, Glycerin, Panthenol.',
  },
  recalls
);
assert.equal(cleanCosmetic.score, 0, `Expected score 0 on clean cosmetic, got ${cleanCosmetic.score}`);
assert.equal(cleanCosmetic.grade, 'LOW');

console.log('ALL 5 SCANNER ACCURACY & FALSE-POSITIVE GUARD TESTS PASSED!');
