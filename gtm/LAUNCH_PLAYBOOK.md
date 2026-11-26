# RegPulse Go-To-Market & Cold-Start Acquisition Playbook

## 1. Live Production Surfaces
- **GitHub Pages Live MVP**: `https://kouchaoguri.github.io/regpulse/`
- **Target Custom Domain (Pending ¥75 Investor Approval)**: `https://regpulsehq.com`
- **Auto-Sync Cadence**: GitHub Actions `.github/workflows/sync-and-deploy.yml` runs every 12 hours (`02:15` & `14:15 UTC`) to sync live openFDA enforcement recalls, 510(k) clearances, cosmetic adverse events, and FDA.gov RSS, regenerating all 280+ static SEO pages & `sitemap-index.xml`.

## 2. Organic High-Intent Channels (Zero Ad Spend — Value-First)

### A. English Seller Communities (Reddit / IndieHackers / Product Hunt)
Target Subreddits (read subreddit self-promo rules carefully before posting; lead with concrete data + free browser-local utility):
- `r/FulfillmentByAmazon` & `r/AmazonSeller` — Angle: *"I analyzed 260 recent openFDA recalls + 21 CFR/EPA FIFRA triggers that keep suppressing Supplement & Skincare ASINs — built a free browser-local checker (zero login, doesn't store your copy)"*
- `r/Supplements` / `r/SkincareAddiction` (brand-owner threads) / `r/shopify` — Angle: *"MoCRA 2026 checklist & why Amazon keeps asking for an 'FDA Certificate' that FDA doesn't issue"*
- `r/regulatoryaffairs` — Angle: *"Open-data lightweight FDA enforcement radar & 510(k) feed for solo RA consultants who can't justify Redica's $10k/yr seat"*

### B. Chinese Cross-Border Seller Channels (知无不言 / 即刻 / V2EX / 跨境社群)
- Angle: **《2026 美妆 MoCRA + Amazon 保健品扫号自救实录：哪些词 1 秒触发 EPA 农药/FDA 药物下架？做了一个免登录 10 秒预审工具》**
- Core hook: Highlight the exact 3 traps that wipe out Shenzhen/Hangzhou US sellers overnight:
  1. 详情页/后台写 `antibacterial / antifungal / kills bacteria` → 触发 EPA FIFRA 农药扫号；
  2. 写 `FDA Approved` 或上传代理伪造的“FDA 证书”图 → MoCRA 明确官方不发证书；
  3. 保健品漏写标准 DSHEA 免责声明或踩中 `treats anxiety / lowers blood sugar / Nature's Ozempic`。

### C. Programmatic SEO (Google Search Console Submission Immediately After Custom Domain)
- Submit `https://regpulsehq.com/sitemap-index.xml` (283+ indexed URLs: 260 live recall dossiers + 18 statutory Q&A pages + MoCRA checklist).
- Expand `/rules/[slug]` to 50+ high-intent ingredient & claim guides in Week 2 based on Search Console impressions.

## 3. Dec 1 Cross-Model Red-Team Audit Protocol (`CodexCLI` / GPT6.2)
Once `CodexCLI` quota resets on **2026-12-01**, run a cross-model audit covering:
1. False-positive / false-negative stress test on 30 real Amazon best-selling skincare, supplement, and LED mask listings.
2. Statutory precision review of all 21 CFR / FD&C Act / FTC / EPA FIFRA citations and safe rewrite phrasing.
3. Conversion friction audit on the Free Scanner → Watchlist Pilot → Paid Checkout flow.

## 4. Hard Verification & Stop-Loss Thresholds
- **Week 1 Post-Distribution Target**: ≥ 150 real external listing scans + ≥ 8% watchlist/pricing intent clicks or pilot submissions.
- **Day 30 Revenue Target**: ≥ 3 real paid subscriptions (≥ $100 MRR across Creem.io USD + Mianbaoduo RMB).
- **Hard Stop-Loss**: If Day 30 shows 0 paid conversions after full distribution + Dec 1 audit iteration, halt SaaS expansion and repurpose `scripts/sync_fda_data.py` into a zero-proxy Apify MCP Actor to recover value.
