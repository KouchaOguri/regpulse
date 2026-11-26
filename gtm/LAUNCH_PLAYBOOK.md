# RegPulse v2.1 Zero-Human-Posting Autonomous GTM & Cold-Start Playbook

> **Hard Constraints Enforced (Investor Mandates #3, #4 & #5)**:
> 1. **ZERO Human-Operated Social Posting**: No reliance on personal aged Reddit accounts, Product Hunt launch hustling, or manual 知无不言 forum posting.
> 2. **ZERO Cold Outreach From Primary Domain (`regpulsehq.com`) — HARD RISK RED-LINE**: `regpulsehq.com` DNS/SPF/DKIM/DMARC reputation is reserved **100% exclusively for transactional paid emails** (License Key delivery & subscribed Watchlist Alerts). Sending unsolicited cold email from the newly registered main domain is **permanently prohibited** to protect sender reputation and paid delivery.
> 3. **Strict Dual-Market Isolation**: Main English site (`regpulsehq.com/*`) has **0 UI CJK characters & 0 RMB/WeCom leaks** (hard-blocked in CI); isolated `/cn/*` edition is marked `noindex, nofollow` and excluded from sitemaps.

---

## 3 Strictly Autonomous, Zero-Reputation-Risk Cold-Start Channels

### Channel 1: High-Intent Programmatic SEO + Automated IndexNow (459+ Live Pure-English Static Pages)
- **Inventory Built & Auto-Updating Every 12 Hours**:
  - **198 Live FDA Warning Letter Pages** (`/warning-letters/[id]/`) — captures urgent OEM/brand lookup searches the day FDA posts a letter.
  - **210 Deduplicated openFDA Recall Pages** (`/recalls/[id]/`) — live Class I/II supplement, cosmetic & device enforcement recalls.
  - **40 Statutory Compliance FAQ Pages** (`/rules/[slug]/` with `FAQPage` JSON-LD) targeting high-intent Amazon suppression searches (`"can you sell lidocaine numbing cream on amazon"`, `"is anti-dandruff an otc drug"`, `"exosome serum fda warning letter"`, `"cbd dog chews amazon"`).
- **Zero-Human Indexing Loop**:
  - Once `regpulsehq.com` is live, GitHub Actions runs `scripts/ping_indexnow.py` automatically on every 12h deploy, pushing fresh FDA Warning Letter & Recall URLs directly to **Bing, Yandex, Naver, and Seznam**.
  - Google Search Console XML sitemap submission (`https://regpulsehq.com/sitemap-index.xml`) completed once via Cloudflare DNS TXT verification.

### Channel 2: Built-In Marketplace Demand — Sidecar MCP-Ready Apify Actor (`apify-actor/`)
- **Why Highest Cold-Start Leverage in Days 1–14**: Pure SEO on a brand-new `.com` domain takes time to ramp; Apify Store already has built-in commercial search traffic from e-commerce operators, data engineers, and **AI Agents discovering MCP tools**.
- **Dual Funnel**:
  - Ready-to-deploy Python Actor in `apify-actor/` runs Pay-Per-Event (80% dev share once payout KYC is added in Step 2; can be published as **Free Public MCP Actor in Step 1 with ZERO KYC** to immediately capture traffic and funnel buyers to `https://regpulsehq.com/bulk/`!).
  - Every structured JSON result & README links directly to `https://regpulsehq.com/bulk/` and `https://regpulsehq.com/pricing/`.

### Channel 3: Open-Source GitHub & Awesome/MCP Directory PRs (`KouchaOguri/regpulse`)
- Maintain crisp, developer/operator-friendly public repo README targeting `"fda drug claim checker"`, `"amazon restricted product compliance"`, `"openfda warning letters"`, `"mocra checklist"`.
- Submit clean, factual Pull Requests via authenticated `gh` CLI (`KouchaOguri`) to curated open-source compliance & MCP server directories (zero spam, genuine open-source utility).

---

## Stage-Gated L2 Proof Criteria (Before Requesting Creem / Mianbaoduo KYC)
Once `regpulsehq.com` DNS + Cloudflare Web Analytics + Cloudflare Worker (`api.regpulsehq.com`) are live:
1. **L2 Signal Gate (7–14 Days Post-Domain)**:
   - `>= 100` real non-self external visits (verified via Cloudflare Web Analytics)
   - `>= 15` real external scans / CSV uploads OR `>= 3` real work-email lead captures in D1 `leads` table (`POST /api/leads`)
2. **Trigger for Investor Step 2 (KYC)**:
   - Only after observing genuine L2 external demand do we trigger investor one-time KYC for **Creem.io (Global USD → Alipay CNY)**, **面包多 (CN RMB)**, and optionally **Apify Creator Payout**, then flip directly to automated L3 cash settlement.
