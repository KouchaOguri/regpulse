import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const workerBundle = path.resolve('node_modules/.cache/fulfillment-worker-test.mjs');
fs.mkdirSync(path.dirname(workerBundle), { recursive: true });

await esbuild.build({
  entryPoints: ['fulfillment-worker/src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: workerBundle,
});

const { handleRequest, computeHmacSha256Hex } = await import(pathToFileURL(workerBundle).href);

// Deterministic in-memory D1 SQLite adapter matching fulfillment-worker/schema.sql queries
function createMockD1() {
  const tables = {
    webhook_events: new Map(),
    licenses: new Map(),
    watchlists: new Map(),
    sent_alerts: new Map(),
    leads: [],
  };

  return {
    tables,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...values) {
          args = values;
          return stmt;
        },
        async first() {
          const s = sql.replace(/\s+/g, ' ').trim();
          if (s.startsWith('SELECT event_id FROM webhook_events')) {
            const row = tables.webhook_events.get(args[0]);
            return row ? { event_id: row.event_id } : null;
          }
          if (s.includes('FROM licenses WHERE license_key = ?')) {
            return tables.licenses.get(args[0]) || null;
          }
          if (s.includes('FROM watchlists WHERE license_key = ?')) {
            return tables.watchlists.get(args[0]) || null;
          }
          if (s.startsWith('SELECT dedup_key FROM sent_alerts')) {
            return tables.sent_alerts.get(args[0]) || null;
          }
          throw new Error(`Unhandled first() SQL in mock D1: ${s}`);
        },
        async all() {
          const s = sql.replace(/\s+/g, ' ').trim();
          if (s.includes('FROM watchlists w JOIN licenses l')) {
            const out = [];
            for (const [k, w] of tables.watchlists.entries()) {
              const l = tables.licenses.get(k);
              if (l && l.status === 'active') {
                out.push({ ...w });
              }
            }
            return { results: out };
          }
          throw new Error(`Unhandled all() SQL in mock D1: ${s}`);
        },
        async run() {
          const s = sql.replace(/\s+/g, ' ').trim();
          if (s.startsWith('INSERT INTO webhook_events')) {
            tables.webhook_events.set(args[0], {
              event_id: args[0],
              provider: args[1],
              event_type: args[2],
              received_at: args[3],
            });
            return { success: true };
          }
          if (s.startsWith('INSERT INTO licenses')) {
            const provider = s.includes("'mianbaoduo'") ? 'mianbaoduo' : 'creem';
            tables.licenses.set(args[0], {
              license_key: args[0],
              email: args[1],
              provider,
              provider_order_id: args[2],
              plan: args[3],
              plan_label: args[4],
              status: 'active',
              bulk_limit: args[5],
              max_trackers: args[6],
              created_at: args[7],
            });
            return { success: true };
          }
          if (s.startsWith('UPDATE licenses SET status = ?')) {
            for (const [k, l] of tables.licenses.entries()) {
              if (l.provider_order_id === args[1] || l.email === args[2]) {
                l.status = args[0];
                tables.licenses.set(k, l);
              }
            }
            return { success: true };
          }
          if (s.startsWith('INSERT INTO watchlists')) {
            if (s.includes('ON CONFLICT')) {
              tables.watchlists.set(args[0], {
                license_key: args[0],
                email: args[1],
                channel_type: args[2],
                webhook_url: args[3],
                keywords_json: args[4],
                updated_at: args[5],
              });
            } else {
              const ch = s.includes("'wecom'") ? 'wecom' : 'email';
              tables.watchlists.set(args[0], {
                license_key: args[0],
                email: args[1],
                channel_type: ch,
                webhook_url: '',
                keywords_json: '[]',
                updated_at: args[2],
              });
            }
            return { success: true };
          }
          if (s.startsWith('INSERT INTO sent_alerts')) {
            tables.sent_alerts.set(args[0], {
              dedup_key: args[0],
              license_key: args[1],
              source_type: args[2],
              record_id: args[3],
              matched_keyword: args[4],
              delivered_channel: args[5],
              sent_at: args[6],
            });
            return { success: true };
          }
          if (s.startsWith('INSERT INTO leads')) {
            tables.leads.push({
              email: args[0],
              plan: args[1],
              channel: args[2],
              keywords: args[3],
              lang: args[4],
              source_url: args[5],
              created_at: args[6],
            });
            return { success: true };
          }
          throw new Error(`Unhandled run() SQL in mock D1: ${s}`);
        },
      };
      return stmt;
    },
  };
}

const db = createMockD1();
const outboundCalls = [];
const mockFetch = async (url, init) => {
  outboundCalls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
  return new Response(JSON.stringify({ id: 'mock_ok' }), { status: 200 });
};

const env = {
  DB: db,
  APP_BASE_URL: 'https://regpulsehq.com',
  FROM_EMAIL: 'alerts@regpulsehq.com',
  CREEM_WEBHOOK_SECRET: 'whsec_test_creem_2026',
  MIANBAODUO_WEBHOOK_SECRET: 'mbdsec_test_2026',
  RESEND_API_KEY: 're_test_key',
  INTERNAL_CRON_SECRET: 'cron_secret_2026',
  OWNER_ALERT_WEBHOOK: 'https://hooks.slack.com/services/T00/B00/OWNER',
};

// 1. Unsigned Creem webhook MUST be rejected (HTTP 401)
const badResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/webhooks/creem', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_bad', eventType: 'checkout.completed' }),
  }),
  env,
  mockFetch
);
assert.equal(badResp.status, 401, 'Unsigned Creem webhook must return HTTP 401');

// 2. Valid HMAC-SHA256 signed Creem Pro checkout -> issues RP-PRO-... license & sends email
const creemBody = JSON.stringify({
  id: 'evt_creem_001',
  eventType: 'checkout.completed',
  object: {
    id: 'ord_creem_001',
    customer: { email: 'ops@sellerbrand.com' },
    product: { name: 'Watchlist Radar Pro ($29/mo)' },
  },
});
const creemSig = await computeHmacSha256Hex(env.CREEM_WEBHOOK_SECRET, creemBody);
const creemResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/webhooks/creem', {
    method: 'POST',
    headers: { 'creem-signature': creemSig },
    body: creemBody,
  }),
  env,
  mockFetch
);
assert.equal(creemResp.status, 200);
const creemJson = await creemResp.json();
assert.ok(/^RP-PRO-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(creemJson.licenseKey), `Bad Pro key: ${creemJson.licenseKey}`);
assert.equal(creemJson.emailDispatched, true, 'Activation email must dispatch via Resend');

// 3. Replaying same Creem event ID MUST be idempotent
const replayResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/webhooks/creem', {
    method: 'POST',
    headers: { 'creem-signature': creemSig },
    body: creemBody,
  }),
  env,
  mockFetch
);
const replayJson = await replayResp.json();
assert.equal(replayJson.idempotent, true, 'Duplicate webhook must return idempotent=true');
assert.equal(db.tables.licenses.size, 1, 'Duplicate webhook must not create second license');

// 4. Mianbaoduo CN Bulk Pass webhook -> issues RP-BULK-... license & CN delivery string
const mbdBody = JSON.stringify({
  order_id: 'MBD20261126001',
  product_name: '200-SKU 批量体检卡 ¥99',
  email: 'seller@szbrand.cn',
});
const mbdSig = await computeHmacSha256Hex(env.MIANBAODUO_WEBHOOK_SECRET, mbdBody);
const mbdResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/webhooks/mianbaoduo', {
    method: 'POST',
    headers: { 'x-mbd-signature': mbdSig },
    body: mbdBody,
  }),
  env,
  mockFetch
);
assert.equal(mbdResp.status, 200);
const mbdJson = await mbdResp.json();
assert.ok(/^RP-BULK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(mbdJson.licenseKey));
assert.ok(mbdJson.deliveryText.includes(mbdJson.licenseKey));

// 5. Real-time license verification endpoint
const verifyResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/license/verify', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: creemJson.licenseKey }),
  }),
  env,
  mockFetch
);
const verifyJson = await verifyResp.json();
assert.equal(verifyJson.valid, true);
assert.equal(verifyJson.bulkLimit, 200);
assert.equal(verifyJson.maxTrackers, 10);

// 6. Self-serve Watchlist portal save (no human ops!)
const wlSaveResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/watchlist', {
    method: 'POST',
    headers: { 'X-License-Key': creemJson.licenseKey },
    body: JSON.stringify({
      email: 'ops@sellerbrand.com',
      channelType: 'slack',
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/BUYER',
      keywords: ['Shenzhen Benliju', 'Yohimbine'],
    }),
  }),
  env,
  mockFetch
);
assert.equal(wlSaveResp.status, 200);

// 7. Automated 12h Alert Dispatch against REAL synced warning_letters.json & recalls.json!
const liveWarningLetters = JSON.parse(fs.readFileSync('src/data/warning_letters.json', 'utf-8'));
const liveRecalls = JSON.parse(fs.readFileSync('src/data/recalls.json', 'utf-8'));
outboundCalls.length = 0;

const dispatch1 = await handleRequest(
  new Request('https://api.regpulsehq.com/api/internal/dispatch-alerts', {
    method: 'POST',
    headers: { 'X-Internal-Secret': env.INTERNAL_CRON_SECRET },
    body: JSON.stringify({ warningLetters: liveWarningLetters, recalls: liveRecalls }),
  }),
  env,
  mockFetch
);
assert.equal(dispatch1.status, 200);
const d1Json = await dispatch1.json();
assert.ok(d1Json.alertsSent >= 1, `Expected >=1 live FDA alert matched, got ${d1Json.alertsSent}`);
assert.ok(
  outboundCalls.some((c) => c.url === 'https://hooks.slack.com/services/T00/B00/BUYER'),
  'Expected real Slack webhook dispatch to buyer endpoint'
);

// 8. Second dispatch MUST be 100% idempotent (0 duplicate alerts!)
const dispatch2 = await handleRequest(
  new Request('https://api.regpulsehq.com/api/internal/dispatch-alerts', {
    method: 'POST',
    headers: { 'X-Internal-Secret': env.INTERNAL_CRON_SECRET },
    body: JSON.stringify({ warningLetters: liveWarningLetters, recalls: liveRecalls }),
  }),
  env,
  mockFetch
);
const d2Json = await dispatch2.json();
assert.equal(d2Json.alertsSent, 0, 'Idempotency check failed: duplicate alerts fired!');
assert.ok(d2Json.duplicatesSkipped >= 1, 'Expected duplicatesSkipped >= 1 on repeat sync');

// 9. Self-owned /api/leads endpoint (replaces Web3Forms)
const leadResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/leads', {
    method: 'POST',
    body: JSON.stringify({
      email: 'founder@skincareco.com',
      plan: 'Watchlist Radar Pro ($29/mo)',
      channel: 'Slack Webhook',
      keywords: 'Retinol, Sunscreen',
      lang: 'en',
    }),
  }),
  env,
  mockFetch
);
assert.equal(leadResp.status, 200);
assert.equal(db.tables.leads.length, 1);

// 10. Subscription cancellation revokes license cleanly
const cancelBody = JSON.stringify({
  id: 'evt_creem_cancel_001',
  eventType: 'subscription.canceled',
  object: { id: 'ord_creem_001', customer: { email: 'ops@sellerbrand.com' } },
});
const cancelSig = await computeHmacSha256Hex(env.CREEM_WEBHOOK_SECRET, cancelBody);
await handleRequest(
  new Request('https://api.regpulsehq.com/api/webhooks/creem', {
    method: 'POST',
    headers: { 'creem-signature': cancelSig },
    body: cancelBody,
  }),
  env,
  mockFetch
);
const reverifyResp = await handleRequest(
  new Request('https://api.regpulsehq.com/api/license/verify', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: creemJson.licenseKey }),
  }),
  env,
  mockFetch
);
assert.equal(reverifyResp.status, 404, 'Canceled license must no longer verify as active');

console.log(
  `ALL 10 AUTOMATED PAID FULFILLMENT E2E TESTS PASSED! (Creem HMAC -> License -> Watchlist -> ${d1Json.alertsSent} Live FDA Alerts Dispatched -> 0 Duplicate Replays -> Mianbaoduo CN -> Leads -> Cancellation)`
);
