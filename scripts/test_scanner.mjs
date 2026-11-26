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

// 1. Clean supplement WITH DSHEA disclaimer -> 0 findings, LOW, DSHEA PASS
const cleanSup = scanListing(
  {
    vertical: 'supplements',
    title: 'Magnesium Glycinate 400mg – Supports Restful Sleep and Calm Mood',
    bullets:
      '• Supports everyday relaxation and normal muscle recovery after exercise.\n• Non-GMO, caffeine-free.\n*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
    ingredients: 'Magnesium Glycinate, Vegetable Cellulose Capsule, Rice Flour.',
  },
  recalls
);
assert.equal(cleanSup.findings.length, 0, `Clean supplement unexpected findings: ${cleanSup.findings.map((f) => f.rule.id)}`);
assert.equal(cleanSup.grade, 'LOW');
assert.ok(cleanSup.mandatoryChecks.some((m) => m.id === 'MAND-DSHEA-01' && m.passed));

// 2. False-positive guard: "acne-prone skin", "prevent dry skin", "Not FDA approved" -> 0 findings
const benignCosmetic = scanListing(
  {
    vertical: 'cosmetics',
    title: 'Gentle Salicylic-Free Cleanser for Acne-Prone Skin – Helps Prevent Dry Skin',
    bullets:
      '• Alcohol-free, non-comedogenic daily cleanser. Visibly softens the appearance of fine lines.\n• Note: This cosmetic is not FDA approved.\n• Adverse event questions? Contact Responsible Person at support@example.com or 1-800-555-0100.',
    ingredients: 'Water, Glycerin, Panthenol, Allantoin.',
  },
  recalls
);
assert.equal(benignCosmetic.findings.length, 0, `Benign cosmetic false positives: ${benignCosmetic.findings.map((f) => `${f.rule.id}:${f.matchedPhrases}`)}`);
assert.equal(benignCosmetic.score, 0);

// 3. Red-Team Case B (Supplements): Hangover Cure + Acid Reflux/GERD + Liver Detox + Boosts Testosterone + Dandruff/Nail Fungus
const caseB = scanListing(
  {
    vertical: 'supplements',
    title: 'Liver Detox & Hangover Cure Milk Thistle Capsules – Boosts Testosterone, Cleanses Toxins, Relieves Acid Reflux & GERD, Treats Dandruff & Nail Fungus',
    bullets: '• Daily herbal complex for fast relief.',
    ingredients: 'Milk Thistle, Yohimbine HCl.',
  },
  recalls
);
assert.equal(caseB.grade, 'CRITICAL', `Case B should be CRITICAL, got ${caseB.grade} (${caseB.score})`);
assert.ok(caseB.findings.some((f) => f.rule.id === 'SUP-DIS-GI'), 'Case B must flag Hangover/GERD/Liver Detox');
assert.ok(caseB.findings.some((f) => f.rule.id === 'SUP-DIS-HORMONE'), 'Case B must flag Boosts Testosterone');
assert.ok(caseB.findings.some((f) => f.rule.id === 'COS-OTC-DANDRUFF'), 'Case B must flag Dandruff / Nail Fungus');
assert.ok(caseB.findings.some((f) => f.rule.id === 'ING-TAINT-001'), 'Case B must flag Yohimbine');
assert.ok(caseB.mandatoryChecks.some((m) => m.id === 'MAND-DSHEA-01' && !m.passed), 'Case B must flag missing DSHEA disclaimer');

// 4. Red-Team Case C (Cosmetics): SPF 50 + Anti-Dandruff + Repairs Sun Damage + Fades Acne Scars + Tightens Loose Skin
const caseC = scanListing(
  {
    vertical: 'cosmetics',
    title: 'Anti-Dandruff Scalp Serum & Sun Protection SPF 50 Glow Drops – Tightens Loose Skin, Repairs Sun Damage, Fades Acne Scars, Shrinks Pores Permanently',
    bullets: '• Prevents sunburn and skin cancer. Eliminates scalp psoriasis and reduces rosacea. Removes warts and skin tags.',
    ingredients: 'Water, Ketoconazole 1%, Hydroqinone 2%.',
  },
  recalls
);
assert.equal(caseC.grade, 'CRITICAL');
assert.ok(caseC.findings.some((f) => f.rule.id === 'COS-OTC-SPF'), 'Case C must catch SPF 50 / Sun Protection');
assert.ok(caseC.findings.some((f) => f.rule.id === 'COS-OTC-DANDRUFF'), 'Case C must catch Anti-Dandruff / Ketoconazole / Warts');
assert.ok(caseC.findings.some((f) => f.rule.id === 'COS-DRUG-002'), 'Case C must catch Repairs Sun Damage / Acne Scars / Tightens Loose Skin');
assert.ok(caseC.findings.some((f) => f.rule.id === 'SUP-DIS-002'), 'Case C must catch "prevents sunburn and skin cancer"');
assert.ok(caseC.findings.some((f) => f.rule.id === 'COS-DRUG-001'), 'Case C must catch "eliminates scalp psoriasis" / "reduces rosacea"');
assert.ok(caseC.findings.some((f) => f.rule.id === 'COS-DRUG-005'), 'Case C must fuzzy-catch typo "Hydroqinone"');

// 5. Fuzzy 1-char typo guard on Sibutramin
const typoTest = scanListing(
  {
    vertical: 'supplements',
    title: 'Slim Caps – Prevents Heart Attack & Cures Fatty Liver',
    bullets: '• Heals leaky gut and relieves menopause hot flashes.',
    ingredients: 'Green Tea, Sibutramin.',
  },
  recalls
);
assert.ok(typoTest.findings.some((f) => f.rule.id === 'ING-TAINT-001'), 'Must fuzzy-catch Sibutramin typo');
assert.ok(typoTest.findings.some((f) => f.rule.id === 'SUP-DIS-001'), 'Must catch prevents heart attack');
assert.ok(typoTest.findings.some((f) => f.rule.id === 'SUP-DIS-GI'), 'Must catch fatty liver / leaky gut');
assert.ok(typoTest.findings.some((f) => f.rule.id === 'SUP-DIS-HORMONE'), 'Must catch menopause hot flashes');

// 6. Device vertical must NOT leak dietary supplement DSHEA rewrite AND must NOT match 7-Eleven Horchata!
const deviceTest = scanListing(
  {
    vertical: 'devices',
    title: 'Red Light LED Mask – Cures Pain & Relieves Neuropathy, IPL Permanent Hair Removal, Product is FDA-Registered',
    bullets: '• EMS muscle stimulator for home use.',
    ingredients: 'Medical-grade silicone shell, 630nm LED array, USB-C controller.',
  },
  recalls
);
assert.ok(deviceTest.findings.some((f) => f.rule.id === 'DEV-510K-001'), 'Device must trigger DEV-510K-001');
assert.ok(deviceTest.findings.some((f) => f.rule.id === 'FDA-TERM-002'), 'Device must trigger FDA-Registered trap');
assert.ok(!deviceTest.findings.some((f) => f.rule.id === 'SUP-DIS-004'), 'Device must NOT leak supplement rule SUP-DIS-004');
assert.ok(
  deviceTest.matchedRecalls.every((r) => r.vertical === 'Medical & Beauty Devices'),
  `Device recall cross-ref leaked wrong vertical: ${deviceTest.matchedRecalls.map((r) => `${r.recallingFirm}(${r.vertical})`)}`
);

console.log('ALL 6 GOLDEN ANTI-HALLUCINATION, TYPO-GUARD & VERTICAL-ISOLATION TESTS PASSED!');
