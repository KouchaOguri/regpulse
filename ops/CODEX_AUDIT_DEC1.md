# RegPulse Dec 1 Cross-Model Commercial Audit Plan (`2026-12-01`)

> **Execution Binary**: `C:\Users\16493\.codex\plugins\.plugin-appserver\codex.exe` (`v0.167.0-alpha.4.1`, quota resets `2026-12-01`)  
> **Mandate Alignment**: Evaluate against **paying commercial competitor standards** (Registrar Corp, ComplianceGate, Redica Systems, Amazon Seller Compliance Tools), NOT "code compiles".

---

## 1. Exact Invocation Command (PowerShell)

```powershell
Set-Location "d:\hachimi\regpulse"
& "C:\Users\16493\.codex\plugins\.plugin-appserver\codex.exe" exec --full-auto "Read ops/STATE.json, src/engine/scanner.ts, src/data/complianceRules.ts, fulfillment-worker/src/index.ts, apify-actor/main.py, and src/pages/pricing/index.astro. Perform a ruthless commercial-competitor audit (no sycophancy): (1) Compare RegPulse against real paid compliance tools and identify why a picky U.S. Amazon/Shopify operator would or would not pay $19/$29/mo instead of prompting ChatGPT; (2) Red-team the 40 rules for false positives on clean real listings and false negatives on recent 2026 FDA Warning Letters; (3) Audit fulfillment-worker/src/index.ts and AlertPortal/BulkCatalogScanner for any security, CORS, or conversion leak; (4) Propose concrete high-leverage product upgrades (e.g. ASIN/URL fetch, downloadable PDF compliance certificate, or standalone npx MCP package) OR pivot/kill recommendations based on observed Cloudflare Web Analytics & D1 data. Write findings to ops/CODEX_AUDIT_DEC1_REPORT.md."
```

---

## 2. Commercial-Competitor Audit Rubric (Must Answer Every Question)

1. **WTP (Willingness To Pay) vs. Free ChatGPT Test**:
   - What does RegPulse offer that a $20/mo ChatGPT prompt cannot replicate in 15 seconds?
   - Does the $19 Bulk CSV Pass need native Amazon Seller Central `.tsv`/`.xlsm` flat-file parsing, ASIN URL direct inspection, or a timestamped PDF/CSV Compliance Audit Trail?
2. **40-Rule Precision & Recall Red-Team**:
   - Sample 10 real clean Amazon cosmetics/supplements listings -> check false-positive rate (target <5%).
   - Sample 10 real 2026 FDA Warning Letters from `src/data/warning_letters.json` -> check recall on actual cited violation language.
3. **Live L2 Market Signal Check (Days 1–4 Post-Fix)**:
   - Query Cloudflare RUM GraphQL (`siteTag: a0b2b797f6db44009df4321c04a4f61d`), D1 `leads`, Google Search Console impressions/clicks, and Apify Store runs (`hachimi/regpulse`).
   - Decide: **Double Down** (upgrade conversion/product moat), **Reshape / Side-Track** (e.g., publish standalone `npm`/`npx` MCP server for `awesome-mcp-servers` traffic), or **Prepare Pivot/Kill** by the `2026-12-11` 14-day gate.
