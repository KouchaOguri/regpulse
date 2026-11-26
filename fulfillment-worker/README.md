# RegPulse Automated Paid Fulfillment Worker (Cloudflare Workers + D1)

Zero-human post-payment fulfillment backend powering:
- `POST /api/webhooks/creem` — HMAC-SHA256 verified Creem.io webhook → idempotent event dedup → cryptographic License Key generation (`RP-BULK-…` / `RP-PRO-…` / `RP-AGY-…`) → D1 persistence → automatic Resend activation email.
- `POST /api/webhooks/mianbaoduo` — Signed CN RMB webhook → instant card-key delivery string for `/cn/bulk/` & `/cn/pricing/`.
- `POST /api/license/verify` — Real-time key validation for the 200-SKU Bulk CSV Scanner & Subscriber Portal.
- `GET/POST /api/watchlist` — `X-License-Key` authenticated self-serve OEM/ingredient/webhook management.
- `POST /api/leads` — Self-owned async lead capture stored in D1 (replaces Web3Forms).
- `POST /api/internal/dispatch-alerts` — Triggered every 12 hours by GitHub Actions after FDA Warning Letters & openFDA Recalls sync; deduplicated via `sent_alerts` table so zero duplicate notifications ever fire.

## 3-Command Production Deploy (After `regpulsehq.com` DNS is Active)
```bash
cd fulfillment-worker
npx wrangler d1 create regpulse-prod
# Paste returned database_id into wrangler.toml, then:
npx wrangler d1 execute regpulse-prod --remote --file=./schema.sql
npx wrangler secret put CREEM_WEBHOOK_SECRET
npx wrangler secret put MIANBAODUO_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put INTERNAL_CRON_SECRET
npx wrangler deploy
```
Then bind custom route `api.regpulsehq.com/*` to `regpulse-fulfillment` in Cloudflare Dashboard and set `BILLING_CONFIG.apiBaseUrl = 'https://api.regpulsehq.com'`.
