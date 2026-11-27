# RegPulse — FDA Drug-Claim Scanner, 200-SKU Bulk CSV Pre-Flight & Live Enforcement Radar

Live App: [https://regpulsehq.com/](https://regpulsehq.com/)

RegPulse is an automated regulatory intelligence & pre-publication listing scanner built for Cosmetics (MoCRA), Dietary Supplements (DSHEA), OTC Topicals, Pet Supplements/Grooming (CVM), and Beauty/Medical Device e-commerce teams.

## Key Capabilities
- **Deterministic Statutory Scanner (<50ms, 40 Federal Rules)**: Flags FDA drug claims (21 CFR 101.93 / FD&C Act §201(g)), OTC monographs (SPF, lidocaine, eye drops, anti-dandruff, oral care), prohibited cosmetic ingredients (21 CFR 700, hydroquinone, exosomes), hidden pharmaceutical adulterants, unauthorized "FDA Approved" claims, pet CVM triggers, and Amazon EPA FIFRA pesticide bot triggers — with automatic DSHEA disclaimer mitigation and safe rewrites.
- **200-SKU Bulk CSV Pre-Flight ([regpulsehq.com/bulk/](https://regpulsehq.com/bulk/))**: 100% browser-local Amazon Flat File & Shopify CSV screening with 1-click Remediation CSV export.
- **Live Official FDA Sync (Every 12 Hours)**: Ingests **198 live FDA.gov Warning Letters**, **210 deduplicated openFDA enforcement recalls** (`food`, `drug`, `device`), recent **40 `510(k)` clearances**, cosmetic adverse event trends (`cosmetic/event`), and official FDA.gov Recalls RSS via GitHub Actions with SHA-256 verification gates.
- **Programmatic SEO & Machine-Readable Feeds**: Builds **459 pure-English static pages** (including 40 statutory FAQ guides, 198 Warning Letter profiles, and 210 Recall briefs) with XML sitemaps, IndexNow pings, and a live Warning Letters JSON feed (`/feeds/warning-letters.json`).
- **MCP-Ready Apify Actor (`apify-actor/`)**: Exposes the 40-rule listing audit, live Warning Letters lookup, and multi-endpoint openFDA recall queries for AI agents and automation workflows.

## Data License & Regulatory Notice
Public regulatory data is sourced from official FDA.gov Warning Letters, eCFR statutes, and the U.S. FDA openFDA API (`https://open.fda.gov/license`). RegPulse is an independent software tool and is not affiliated with, endorsed by, or sponsored by the U.S. Food and Drug Administration (FDA). Outputs are informational screening aids and do not constitute legal advice.
