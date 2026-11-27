#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outBundle = path.resolve(root, 'node_modules/.cache/compliance-rules-export.mjs');
fs.mkdirSync(path.dirname(outBundle), { recursive: true });

await esbuild.build({
  entryPoints: [path.resolve(root, 'src/data/complianceRules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outBundle,
});

const { COMPLIANCE_RULES } = await import(pathToFileURL(outBundle).href);

const exported = COMPLIANCE_RULES.map((rule) => ({
  id: rule.id,
  slug: rule.slug,
  severity: rule.severity,
  weight: rule.weight,
  category: rule.category,
  verticals: rule.verticals,
  titleEn: rule.titleEn,
  statute: rule.statute,
  officialRefUrl: rule.officialRefUrl,
  safeRewriteEn: rule.safeRewriteEn,
  patterns: rule.patterns,
}));

const outPath = path.resolve(root, 'apify-actor/rules.json');
fs.writeFileSync(outPath, JSON.stringify(exported, null, 2) + '\n', 'utf-8');
console.log(`Exported ${exported.length} compliance rules -> ${outPath}`);
