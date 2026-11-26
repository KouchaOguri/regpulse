# RegPulse — FDA Drug-Claim, MoCRA & Amazon Compliance Radar

RegPulse is an automated regulatory intelligence & pre-publication listing scanner built for Cosmetics (MoCRA), Dietary Supplements (DSHEA), and Beauty/Medical Device e-commerce teams.

## Key Capabilities
- **Deterministic Statutory Scanner (<50ms)**: Flags FDA drug claims (21 CFR 101.93 / FD&C Act §201(g)), prohibited cosmetic ingredients (21 CFR 700), hidden pharmaceutical adulterants, unauthorized "FDA Approved" claims, and Amazon EPA FIFRA pesticide bot triggers — with automatic DSHEA disclaimer protection and compliant rewrites.
- **Live openFDA Sync (Every 12 Hours)**: Automatically ingests real enforcement recalls (`food`, `drug`, `device`), recent `510(k)` clearances, cosmetic adverse event trends (`cosmetic/event`), and official FDA.gov Recalls RSS via GitHub Actions.
- **Programmatic SEO Architecture**: Builds 270+ static statutory & recall brief pages with XML sitemap and structured JSON-LD.

## Data License & Regulatory Notice
Public regulatory data is sourced from the U.S. FDA openFDA API (`https://open.fda.gov/license`). RegPulse is an independent software tool and is not affiliated with or endorsed by the FDA. Outputs are informational screening aids and do not constitute legal advice.
