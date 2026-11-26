# RegPulse v2.0 Zero-Human-Posting Autonomous GTM & Cold-Start Playbook

> **Hard Constraint Enforced (Investor Mandate #4)**: ZERO reliance on human-operated Reddit accounts, Product Hunt launch hustling, or manual 知无不言 forum posting (which require aged personal accounts and invite instant bans on fresh bot accounts). Every acquisition loop below runs **100% autonomously via code, APIs, open directories, and marketplace discovery**.

---

## Core Dual-Market Isolation Architecture (Investor Mandate #5)
- **Global English Main Site (`https://regpulsehq.com/*`)**:
  - 100% pure American B2B RegTech English. **CI hard-blocks any build** if a single CJK character, `¥`, `RMB`, `WeCom`, `Feishu`, or `Mianbaoduo` leaks into English HTML.
  - Sitemap (`sitemap-index.xml`) indexes English routes ONLY.
  - USD Pricing Ladder: Free Scanner → **\$19 One-Time 200-SKU Bulk Catalog Pass** → **\$29/mo Watchlist Radar Pro** → **\$79/mo Agency**.
- **Isolated Chinese Cross-Border Edition (`https://regpulsehq.com/cn/*`, marked `noindex, nofollow`)**:
  - Never linked from English navbar/footer; reached exclusively via Chinese seller distribution links (and optionally mapped to `cn.regpulsehq.com` on Cloudflare at \$0 extra cost).
  - Pure RMB Pricing Ladder: 免费单品 → **¥99 单次 200-SKU 批量体检卡** → **¥199/季 企微/飞书实时预警** → **¥599/季 多店铺代运营**.

---

## 4 Strictly Autonomous Cold-Start Channels (Zero Human Posting)

### Channel 1: High-Intent Programmatic SEO + Automated IndexNow (450+ Live Static Pages)
- **Inventory Already Built & Auto-Updating Every 12 Hours**:
  - **198 Live FDA Warning Letter Pages** (`/warning-letters/[id]/`) — high-urgency brand/OEM search intent (e.g., `"Shenzhen Benliju Biotech FDA warning letter"`, `"Natural Essentials FDA OTC warning letter"`).
  - **210 Deduplicated openFDA Recall Pages** (`/recalls/[id]/`) — live Class I/II supplement, cosmetic & device recalls.
  - **40 Statutory Compliance FAQ Pages** (`/rules/[slug]/` with `FAQPage` JSON-LD) targeting exact Amazon suppression queries (`"can you sell lidocaine numbing cream on amazon"`, `"is anti-dandruff an otc drug"`, `"exosome serum fda warning letter"`, `"cbd dog chews amazon"`).
- **Zero-Human Indexing Loop**:
  - Upon binding `regpulsehq.com`, GitHub Actions automatically runs `scripts/ping_indexnow.py` on every 12h sync, pushing newly issued FDA Warning Letters & Recalls directly into **Bing, Yandex, Naver, and Seznam** within minutes of FDA publication (zero manual Search Console clicks).
  - Google Search Console XML sitemap submission is a one-time API/DNS TXT verification during Cloudflare setup.

### Channel 2: Built-In Marketplace Demand — Sidecar MCP-Ready Apify Actor (`apify-actor/`)
- **Why Zero Cold-Start**: Apify Store already has built-in search traffic from e-commerce operators, data teams, and **AI Agents discovering MCP tools** (zero social media account needed!).
- **Dual Revenue + Traffic Funnel**:
  - Ready-to-deploy Actor in `apify-actor/` runs Pay-Per-Event pricing (80% developer revenue share) AND embeds `full40RuleWebScanner: "https://regpulsehq.com/bulk/"` and `liveMonitoringUrl: "https://regpulsehq.com/pricing/"` in every structured JSON output & README.
  - Also listed via automated GitHub PRs to open-source awesome/MCP registries (`modelcontextprotocol/servers`, `awesome-mcp-servers`, `awesome-amazon-seller-tools`) using our authenticated `gh` (`KouchaOguri`) CLI — zero human social posting!

### Channel 3: Open-Source GitHub Distribution (`KouchaOguri/regpulse`)
- Repo stays public with crisp SEO README targeting `"fda drug claim checker"`, `"amazon restricted product compliance"`, `"openfda warning letters scraper"`, `"mocra checklist"`.
- Every 12-hour sync commits verified public signals & keeps GitHub repository activity fresh organically.

### Channel 4: Automated Low-Volume Value-First B2B Email Briefs (Triggered Strictly on Public FDA Events)
- **Compliance & Anti-Spam Guardrail**: Strictly B2B compliance contacts (no scraping personal emails, CAN-SPAM compliant physical/opt-out footer, capped at <=15 high-relevance briefs/day via authorized `gmail` CLI or Resend domain email once `regpulsehq.com` SPF/DKIM/DMARC is verified).
- **Value-First Hook (Zero Cold-Pitch Spam)**: Whenever FDA posts a new Warning Letter or Class I Recall in a vertical (e.g., Lidocaine numbing creams, Berb/GLP-1 supplements, MoCRA cosmetics), deliver a 1-paragraph factual alert citing the official `fda.gov` letter + link to the free `/bulk/` 3-SKU scanner.

---

## Stage-Gated L2 Proof Criteria (Before Requesting Creem / Mianbaoduo KYC)
Once `regpulsehq.com` (¥75) + Cloudflare Web Analytics + Cloudflare Worker (`api.regpulsehq.com`) are live:
1. **L2 Signal Gate (7–14 Days Post-Domain)**:
   - `>= 100` real non-self external visits (measured via Cloudflare Web Analytics)
   - `>= 15` real external scans / CSV uploads OR `>= 3` real work-email lead captures in D1 `leads` table (`POST /api/leads`)
2. **Trigger for Investor Step 2 (KYC)**:
   - Only after hitting real L2 external intent signals above do we trigger investor one-time KYC for **Creem.io (Global USD → Alipay CNY)** and **面包多 (CN RMB)**, paste the 6 checkout URLs into `src/lib/config.ts`, set Worker webhook secrets, and flip directly to automated L3 cash settlement!
