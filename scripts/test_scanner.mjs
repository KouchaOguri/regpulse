import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const outFile = path.resolve('node_modules/.cache/scanner-test.mjs');
const rulesOut = path.resolve('node_modules/.cache/rules-test.mjs');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
await esbuild.build({
  entryPoints: ['src/engine/scanner.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
});
await esbuild.build({
  entryPoints: ['src/data/complianceRules.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: rulesOut,
});

const { scanListing } = await import(pathToFileURL(outFile).href);
const { COMPLIANCE_RULES } = await import(pathToFileURL(rulesOut).href);
const recalls = JSON.parse(fs.readFileSync(new URL('../src/data/recalls.json', import.meta.url), 'utf-8'));
const warningLetters = JSON.parse(fs.readFileSync(new URL('../src/data/warning_letters.json', import.meta.url), 'utf-8'));

// 0. Assert rule count >= 40 and unique IDs/slugs
assert.ok(COMPLIANCE_RULES.length >= 40, `Expected >=40 statutory rules, got ${COMPLIANCE_RULES.length}`);
assert.equal(new Set(COMPLIANCE_RULES.map((r) => r.id)).size, COMPLIANCE_RULES.length, 'Duplicate rule IDs found');
assert.equal(new Set(COMPLIANCE_RULES.map((r) => r.slug)).size, COMPLIANCE_RULES.length, 'Duplicate rule slugs found');

// 1. Clean supplement WITH DSHEA disclaimer -> 0 findings, LOW, DSHEA PASS
const cleanSup = scanListing(
  {
    vertical: 'supplements',
    title: 'Magnesium Glycinate 400mg – Supports Restful Sleep and Calm Mood',
    bullets:
      '• Supports everyday relaxation and normal muscle recovery after exercise.\n• Non-GMO, caffeine-free.\n*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
    ingredients: 'Magnesium Glycinate, Vegetable Cellulose Capsule, Rice Flour.',
  },
  recalls,
  warningLetters
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
    ingredients: 'Water, Glycerin, Panthenol, Allantoin. Safety contact: safety@brand.com.',
  },
  recalls,
  warningLetters
);
assert.equal(benignCosmetic.findings.length, 0, `Benign cosmetic false positives: ${benignCosmetic.findings.map((f) => `${f.rule.id}:${f.matchedPhrases}`)}`);
assert.equal(benignCosmetic.score, 0);
assert.ok(
  benignCosmetic.matchedRecalls.every((r) => r.vertical === 'Cosmetics & Skincare' && r.sourceCategory !== 'food'),
  `Benign cosmetic leaked non-cosmetic recall`
);

// 2b. Verify email domain token ("brand" in safety@brand.com) never triggers recall matches
const emailOnlyCosmetic = scanListing(
  {
    vertical: 'cosmetics',
    title: 'Pure Squalane Moisture Drops',
    bullets: '• Fragrance-free daily hydration. Adverse events: safety@brand.com',
    ingredients: 'Squalane, Glycerin, Safety contact: safety@brand.com',
  },
  recalls,
  warningLetters
);
assert.equal(emailOnlyCosmetic.matchedRecalls.length, 0, `Email token leaked recall`);

// 3. Red-Team Supplements + new 40-rule triggers (Cold/Allergy, Antacid, CBD, BPC-157, Rx Strength, Tinnitus)
const caseB = scanListing(
  {
    vertical: 'supplements',
    title: 'Prescription Strength Berberine, CBD & BPC-157 Hangover Cure – Relieves GERD, Seasonal Allergies & Tinnitus Relief',
    bullets: '• Natural antihistamine & antacid that replaces your metformin. Also treats bacterial vaginosis and boosts testosterone.',
    ingredients: 'Milk Thistle, Yohimbine HCl, Cannabidiol, Ostarine, Sibutramin.',
  },
  recalls,
  warningLetters
);
assert.equal(caseB.grade, 'CRITICAL');
for (const expectedId of ['SUP-DIS-GI', 'SUP-DIS-HORMONE', 'SUP-OTC-COLD', 'SUP-OTC-ANTACID', 'SUP-ING-CBD', 'SUP-ING-NDI', 'SUP-DIS-INTIMATE', 'SUP-DIS-EYE-NEURO', 'SUP-CGMP-001', 'ING-TAINT-001']) {
  assert.ok(caseB.findings.some((f) => f.rule.id === expectedId), `Case B missed rule ${expectedId}`);
}

// 4. Cosmetics new rules (Lidocaine numbing cream, Eye drops, Oral care, Antiperspirant, Exosomes, Kohl, SPF, Dandruff)
const caseC = scanListing(
  {
    vertical: 'cosmetics',
    title: 'SPF 50 Exosome Serum, 5% Lidocaine Numbing Cream & Anti-Dandruff Scalp Wash – Stops Sweat & Prevents Cavities',
    bullets: '• Eye drops for pink eye and cataracts. Remineralizes enamel. Black henna brow dye and kohl eyeliner. Zero side effects.',
    ingredients: 'Water, Lidocain, Ketoconazole 1%, Hydroqinone 2%.',
  },
  recalls,
  warningLetters
);
assert.equal(caseC.grade, 'CRITICAL');
for (const expectedId of ['COS-OTC-SPF', 'COS-OTC-DANDRUFF', 'COS-OTC-NUMB', 'COS-OTC-EYE', 'COS-OTC-ORAL', 'COS-OTC-ANTIPERSP', 'COS-BIO-STEM', 'ING-COLOR-001', 'COS-DRUG-005', 'FTC-SUB-002']) {
  assert.ok(caseC.findings.some((f) => f.rule.id === expectedId), `Case C missed rule ${expectedId}`);
}

// 5. Devices + new QSR-002 rule (Non-invasive blood glucose watch, Plasma pen, HIFU) + strict vertical isolation
const deviceTest = scanListing(
  {
    vertical: 'devices',
    title: 'Non-Invasive Blood Glucose Smartwatch & Home HIFU Plasma Pen – Relieves Neuropathy, Product is FDA-Registered',
    bullets: '• EMS muscle stimulator for home use.',
    ingredients: 'Medical-grade silicone shell, 630nm LED array, USB-C controller.',
  },
  recalls,
  warningLetters
);
assert.ok(deviceTest.findings.some((f) => f.rule.id === 'DEV-510K-001'), 'Device must trigger DEV-510K-001');
assert.ok(deviceTest.findings.some((f) => f.rule.id === 'DEV-QSR-002'), 'Device must trigger DEV-QSR-002');
assert.ok(deviceTest.findings.some((f) => f.rule.id === 'FDA-TERM-002'), 'Device must trigger FDA-TERM-002');
assert.ok(!deviceTest.findings.some((f) => f.rule.id === 'SUP-DIS-004'), 'Device must NOT leak supplement rule SUP-DIS-004');
assert.ok(deviceTest.matchedRecalls.every((r) => r.vertical === 'Medical & Beauty Devices'));

// 6. Pet vertical (21 CFR 510 + CBD + EPA Flea/Tick)
const petTest = scanListing(
  {
    vertical: 'pets',
    title: 'CBD Dog Chews – Treats Canine Arthritis, Hip Dysplasia & Hot Spots',
    bullets: '• Kills fleas and ticks and cures kennel cough with zero side effects.',
    ingredients: 'Full-Spectrum Hemp Extract, Glucosamine.',
  },
  recalls,
  warningLetters
);
assert.equal(petTest.grade, 'CRITICAL');
assert.ok(petTest.findings.some((f) => f.rule.id === 'PET-DRUG-001'), 'Pet test must trigger PET-DRUG-001');
assert.ok(petTest.findings.some((f) => f.rule.id === 'SUP-ING-CBD'), 'Pet test must trigger SUP-ING-CBD');
assert.ok(petTest.mandatoryChecks.some((m) => m.id === 'MAND-CVM-01' && !m.passed));

// 7. Live FDA Warning Letters cross-reference check using a real firm from warning_letters.json
const sampleWl = warningLetters.find((w) => w.vertical === 'OTC & Pharma / Drugs' && w.companyName.length > 8);
if (sampleWl) {
  const wlHit = scanListing(
    {
      vertical: 'general',
      title: `OEM Audit for ${sampleWl.companyName}`,
      bullets: 'Checking supplier enforcement history.',
      ingredients: sampleWl.companyName,
    },
    recalls,
    warningLetters
  );
  assert.ok(
    wlHit.matchedWarningLetters.some((w) => w.id === sampleWl.id),
    `Expected live Warning Letter match for ${sampleWl.companyName}`
  );
}

console.log(`ALL 8 GOLDEN ANTI-HALLUCINATION, 40-RULE, PET-VERTICAL & WARNING-LETTER TESTS PASSED (${COMPLIANCE_RULES.length} rules verified)!`);
