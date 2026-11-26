/**
 * RegPulse 100% Automated Paid Fulfillment & Alert Dispatch Worker (Cloudflare Workers + D1)
 * Zero manual intervention from checkout to license delivery, watchlist self-management, and 7x24 FDA alert firing.
 *
 * Routes:
 *   GET  /api/health
 *   POST /api/webhooks/creem             (HMAC-SHA256 verified -> auto-issue License Key -> D1 -> Resend email)
 *   POST /api/webhooks/mianbaoduo        (Signature verified -> auto-issue CN License Key -> D1 -> receipt card)
 *   POST /api/license/verify             (Real-time key validation for /bulk/ & /alerts/)
 *   GET  /api/watchlist                  (X-License-Key authenticated self-serve read)
 *   POST /api/watchlist                  (X-License-Key authenticated self-serve save)
 *   POST /api/leads                      (Self-owned async lead capture replacing third-party Web3Forms)
 *   POST /api/internal/dispatch-alerts   (Cron/CI-triggered Warning Letter + Recall matcher with idempotent dedup)
 */

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface Env {
  DB: D1DatabaseLike;
  APP_BASE_URL?: string;
  FROM_EMAIL?: string;
  ALLOWED_ORIGINS?: string;
  CREEM_WEBHOOK_SECRET?: string;
  MIANBAODUO_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  INTERNAL_CRON_SECRET?: string;
  OWNER_ALERT_WEBHOOK?: string;
}

export interface FetchLike {
  (input: string, init?: RequestInit): Promise<Response>;
}

function corsHeaders(origin: string | null, allowedStr?: string): Record<string, string> {
  const allowed = (allowedStr || '*').split(',').map((s) => s.trim());
  const allowOrigin =
    allowed.includes('*') || !origin ? '*' : allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-License-Key, X-Internal-Secret, creem-signature',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA.length !== cleanB.length) return false;
  let diff = 0;
  for (let i = 0; i < cleanA.length; i++) {
    diff |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i);
  }
  return diff === 0;
}

export async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
}

export function generateLicenseKey(plan: 'bulk_pass' | 'pro' | 'agency'): string {
  const prefix = plan === 'agency' ? 'RP-AGY' : plan === 'pro' ? 'RP-PRO' : 'RP-BULK';
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const part1 = Array.from(bytes.slice(0, 4))
    .map((b) => alphabet[b % alphabet.length])
    .join('');
  const part2 = Array.from(bytes.slice(4, 8))
    .map((b) => alphabet[b % alphabet.length])
    .join('');
  return `${prefix}-${part1}-${part2}`;
}

function resolvePlanMeta(rawName: string): {
  plan: 'bulk_pass' | 'pro' | 'agency';
  planLabel: string;
  bulkLimit: number;
  maxTrackers: number;
} {
  const low = (rawName || '').toLowerCase();
  if (low.includes('agency') || low.includes('79') || low.includes('599') || low.includes('多店铺')) {
    return { plan: 'agency', planLabel: 'Agency & Aggregator', bulkLimit: 200, maxTrackers: 100 };
  }
  if (low.includes('pro') || low.includes('radar') || low.includes('watchlist') || low.includes('29') || low.includes('199') || low.includes('季卡')) {
    return { plan: 'pro', planLabel: 'Watchlist Radar Pro', bulkLimit: 200, maxTrackers: 10 };
  }
  return { plan: 'bulk_pass', planLabel: 'Bulk Catalog Pre-Flight Pass', bulkLimit: 200, maxTrackers: 0 };
}

async function sendResendEmail(
  env: Env,
  fetcher: FetchLike,
  to: string,
  subject: string,
  textBody: string
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !to) return false;
  const resp = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'RegPulse Alerts <alerts@regpulsehq.com>',
      to: [to],
      subject,
      text: textBody,
    }),
  });
  return resp.ok;
}

function isSafeWebhookUrl(raw: string): boolean {
  if (!raw) return true;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\.\d+\.\d+\.\d+$/.test(host) ||
      /^192\.168\.\d+\.\d+$/.test(host) ||
      /^169\.254\.\d+\.\d+$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function safeJsonParse<T = Record<string, any>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function dispatchWebhookPayload(
  fetcher: FetchLike,
  channelType: string,
  webhookUrl: string,
  title: string,
  bodyLines: string[]
): Promise<boolean> {
  if (!webhookUrl || !isSafeWebhookUrl(webhookUrl)) return false;
  const text = `${title}\n${bodyLines.join('\n')}`;
  let payload: Record<string, unknown>;
  if (channelType === 'wecom') {
    payload = { msgtype: 'text', text: { content: text } };
  } else if (channelType === 'feishu') {
    payload = { msg_type: 'text', content: { text } };
  } else if (channelType === 'slack') {
    payload = { text };
  } else {
    payload = { event: 'regpulse.fda_alert', title, lines: bodyLines, sentAtUtc: new Date().toISOString() };
  }
  const resp = await fetcher(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return resp.ok;
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher: FetchLike = (input, init) => fetch(input, init)
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const cors = corsHeaders(request.headers.get('Origin'), env.ALLOWED_ORIGINS);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (path === '/api/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, service: 'regpulse-fulfillment', utc: new Date().toISOString() }, 200, cors);
  }

  // 1. Creem.io Paid Fulfillment Webhook (HMAC-SHA256 verified + idempotent)
  if (path === '/api/webhooks/creem' && request.method === 'POST') {
    const rawBody = await request.text();
    const signature = request.headers.get('creem-signature') || request.headers.get('x-creem-signature') || '';
    if (!env.CREEM_WEBHOOK_SECRET || !signature) {
      return jsonResponse({ error: 'Missing webhook signature' }, 401, cors);
    }
    const expected = await computeHmacSha256Hex(env.CREEM_WEBHOOK_SECRET, rawBody);
    if (!timingSafeEqualHex(signature, expected)) {
      return jsonResponse({ error: 'Invalid HMAC-SHA256 signature' }, 401, cors);
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody) as Record<string, any>;
    } catch {
      return jsonResponse({ error: 'Malformed JSON payload' }, 400, cors);
    }
    const eventId = String(payload.id || payload.event_id || '');
    const eventType = String(payload.eventType || payload.type || '');
    if (!eventId) {
      return jsonResponse({ error: 'Missing event id' }, 400, cors);
    }

    const existingEv = await env.DB.prepare('SELECT event_id FROM webhook_events WHERE event_id = ?')
      .bind(eventId)
      .first();
    if (existingEv) {
      return jsonResponse({ ok: true, idempotent: true, message: 'Event already processed' }, 200, cors);
    }

    const nowIso = new Date().toISOString();
    await env.DB.prepare('INSERT INTO webhook_events (event_id, provider, event_type, received_at) VALUES (?, ?, ?, ?)')
      .bind(eventId, 'creem', eventType, nowIso)
      .run();

    const obj = payload.object || payload.data || {};
    const email = String(obj.customer?.email || obj.customer_email || payload.email || '').trim().toLowerCase();
    const orderId = String(obj.order?.id || obj.id || eventId);
    const productName = String(obj.product?.name || obj.product_name || obj.plan || 'bulk_pass');

    if (eventType === 'subscription.canceled' || eventType === 'subscription.expired' || eventType === 'refund.created') {
      const nextStatus = eventType === 'refund.created' ? 'refunded' : 'canceled';
      // Scope strictly to provider_order_id so canceling a Pro subscription never revokes a separate one-time Bulk Pass
      if (orderId) {
        await env.DB.prepare('UPDATE licenses SET status = ? WHERE provider_order_id = ?')
          .bind(nextStatus, orderId)
          .run();
      } else if (email) {
        await env.DB.prepare("UPDATE licenses SET status = ? WHERE email = ? AND plan != 'bulk_pass'")
          .bind(nextStatus, email)
          .run();
      }
      return jsonResponse({ ok: true, statusUpdated: nextStatus }, 200, cors);
    }

    if (eventType === 'checkout.completed' || eventType === 'subscription.active' || eventType === 'subscription.paid') {
      const meta = resolvePlanMeta(productName);
      const licenseKey = generateLicenseKey(meta.plan);
      await env.DB.prepare(
        `INSERT INTO licenses (license_key, email, provider, provider_order_id, plan, plan_label, status, bulk_limit, max_trackers, created_at)
         VALUES (?, ?, 'creem', ?, ?, ?, 'active', ?, ?, ?)`
      )
        .bind(licenseKey, email, orderId, meta.plan, meta.planLabel, meta.bulkLimit, meta.maxTrackers, nowIso)
        .run();

      if (meta.maxTrackers > 0) {
        await env.DB.prepare(
          `INSERT INTO watchlists (license_key, email, channel_type, webhook_url, keywords_json, updated_at)
           VALUES (?, ?, 'email', '', '[]', ?)`
        )
          .bind(licenseKey, email, nowIso)
          .run();
      }

      const appUrl = (env.APP_BASE_URL || 'https://regpulsehq.com').replace(/\/$/, '');
      const emailSent = await sendResendEmail(
        env,
        fetcher,
        email,
        `Your RegPulse License Key (${meta.planLabel})`,
        [
          `Thank you for purchasing RegPulse (${meta.planLabel}).`,
          ``,
          `License Key: ${licenseKey}`,
          `Unlock 200-SKU Bulk CSV Scanner: ${appUrl}/bulk/`,
          meta.maxTrackers > 0 ? `Configure 7x24 FDA Watchlist Alerts: ${appUrl}/alerts/` : '',
          ``,
          `Need help or a 7-day refund? Reply directly to this email.`,
        ]
          .filter(Boolean)
          .join('\n')
      );

      return jsonResponse(
        {
          ok: true,
          licenseKey,
          plan: meta.plan,
          planLabel: meta.planLabel,
          emailDispatched: emailSent,
        },
        200,
        cors
      );
    }

    return jsonResponse({ ok: true, ignoredEventType: eventType }, 200, cors);
  }

  // 2. Mianbaoduo CN RMB Fulfillment Webhook
  if (path === '/api/webhooks/mianbaoduo' && request.method === 'POST') {
    const rawBody = await request.text();
    const signature = request.headers.get('x-mbd-signature') || '';
    if (!env.MIANBAODUO_WEBHOOK_SECRET || !signature) {
      return jsonResponse({ error: 'Missing signature' }, 401, cors);
    }
    const expected = await computeHmacSha256Hex(env.MIANBAODUO_WEBHOOK_SECRET, rawBody);
    if (!timingSafeEqualHex(signature, expected)) {
      return jsonResponse({ error: 'Invalid signature' }, 401, cors);
    }
    const body = JSON.parse(rawBody) as Record<string, any>;
    const orderId = String(body.order_id || '');
    if (!orderId) return jsonResponse({ error: 'Missing order_id' }, 400, cors);

    const existing = await env.DB.prepare('SELECT event_id FROM webhook_events WHERE event_id = ?')
      .bind(`mbd:${orderId}`)
      .first();
    if (existing) {
      return jsonResponse({ ok: true, idempotent: true }, 200, cors);
    }
    const nowIso = new Date().toISOString();
    await env.DB.prepare('INSERT INTO webhook_events (event_id, provider, event_type, received_at) VALUES (?, ?, ?, ?)')
      .bind(`mbd:${orderId}`, 'mianbaoduo', 'order.paid', nowIso)
      .run();

    const meta = resolvePlanMeta(String(body.product_name || body.sku || 'bulk_pass'));
    const licenseKey = generateLicenseKey(meta.plan);
    const email = String(body.email || body.buyer_contact || '').trim().toLowerCase();

    await env.DB.prepare(
      `INSERT INTO licenses (license_key, email, provider, provider_order_id, plan, plan_label, status, bulk_limit, max_trackers, created_at)
       VALUES (?, ?, 'mianbaoduo', ?, ?, ?, 'active', ?, ?, ?)`
    )
      .bind(licenseKey, email, orderId, meta.plan, meta.planLabel, meta.bulkLimit, meta.maxTrackers, nowIso)
      .run();

    if (meta.maxTrackers > 0) {
      await env.DB.prepare(
        `INSERT INTO watchlists (license_key, email, channel_type, webhook_url, keywords_json, updated_at)
         VALUES (?, ?, 'wecom', '', '[]', ?)`
      )
        .bind(licenseKey, email, nowIso)
        .run();
    }

    return jsonResponse(
      {
        ok: true,
        licenseKey,
        plan: meta.plan,
        deliveryText: `RegPulse 激活卡密：${licenseKey}（请前往 /cn/bulk/ 解锁 200-SKU 体检，或在 /cn/pricing/ 底部配置企微/飞书预警）`,
      },
      200,
      cors
    );
  }

  // 3. Real-time License Verification for /bulk/ & /alerts/
  if (path === '/api/license/verify' && request.method === 'POST') {
    const body = (await request.json()) as { licenseKey?: string };
    const key = String(body.licenseKey || '').trim().toUpperCase();
    if (!key) return jsonResponse({ valid: false, error: 'Empty license key' }, 400, cors);

    const row = await env.DB.prepare(
      'SELECT license_key, plan, plan_label, status, bulk_limit, max_trackers FROM licenses WHERE license_key = ?'
    )
      .bind(key)
      .first<Record<string, any>>();

    if (!row || row.status !== 'active') {
      return jsonResponse({ valid: false, error: 'License not found or inactive' }, 404, cors);
    }
    return jsonResponse(
      {
        valid: true,
        plan: row.plan,
        planLabel: row.plan_label,
        bulkLimit: row.bulk_limit,
        maxTrackers: row.max_trackers,
      },
      200,
      cors
    );
  }

  // 4. Self-Serve Watchlist Portal API (GET / POST authenticated via X-License-Key)
  if (path === '/api/watchlist') {
    const key = String(request.headers.get('X-License-Key') || '').trim().toUpperCase();
    if (!key) return jsonResponse({ error: 'Missing X-License-Key header' }, 401, cors);

    const lic = await env.DB.prepare(
      'SELECT license_key, email, plan, plan_label, status, max_trackers FROM licenses WHERE license_key = ?'
    )
      .bind(key)
      .first<Record<string, any>>();

    if (!lic || lic.status !== 'active' || Number(lic.max_trackers) <= 0) {
      return jsonResponse({ error: 'Active Watchlist subscription required' }, 403, cors);
    }

    if (request.method === 'GET') {
      const wl = await env.DB.prepare(
        'SELECT email, channel_type, webhook_url, keywords_json, updated_at FROM watchlists WHERE license_key = ?'
      )
        .bind(key)
        .first<Record<string, any>>();
      return jsonResponse(
        {
          ok: true,
          plan: lic.plan,
          planLabel: lic.plan_label,
          maxTrackers: lic.max_trackers,
          email: wl?.email || lic.email,
          channelType: wl?.channel_type || 'email',
          webhookUrl: wl?.webhook_url || '',
          keywords: wl?.keywords_json ? JSON.parse(wl.keywords_json) : [],
          updatedAt: wl?.updated_at || null,
        },
        200,
        cors
      );
    }

    if (request.method === 'POST') {
      const body = await safeJsonParse<{
        email?: string;
        channelType?: string;
        webhookUrl?: string;
        keywords?: string[];
      }>(request);
      if (!body) return jsonResponse({ error: 'Malformed JSON body' }, 400, cors);
      const maxAllowed = Number(lic.max_trackers) || 10;
      const cleanedKeywords = Array.isArray(body.keywords)
        ? Array.from(new Set(body.keywords.map((k) => String(k).trim()).filter((k) => k.length >= 2))).slice(0, maxAllowed)
        : [];
      const email = String(body.email || lic.email || '').trim().toLowerCase();
      const channelType = ['email', 'slack', 'wecom', 'feishu', 'webhook'].includes(String(body.channelType))
        ? String(body.channelType)
        : 'email';
      const webhookUrl = String(body.webhookUrl || '').trim();
      if (webhookUrl && !isSafeWebhookUrl(webhookUrl)) {
        return jsonResponse({ error: 'Webhook URL must use HTTPS and a public host (private/loopback targets are blocked)' }, 400, cors);
      }
      const nowIso = new Date().toISOString();

      await env.DB.prepare(
        `INSERT INTO watchlists (license_key, email, channel_type, webhook_url, keywords_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(license_key) DO UPDATE SET
           email = excluded.email,
           channel_type = excluded.channel_type,
           webhook_url = excluded.webhook_url,
           keywords_json = excluded.keywords_json,
           updated_at = excluded.updated_at`
      )
        .bind(key, email, channelType, webhookUrl, JSON.stringify(cleanedKeywords), nowIso)
        .run();

      return jsonResponse({ ok: true, savedCount: cleanedKeywords.length, keywords: cleanedKeywords }, 200, cors);
    }
  }

  // 5. Self-Owned Lead Capture API (Replaces third-party Web3Forms)
  if (path === '/api/leads' && request.method === 'POST') {
    const body = (await request.json()) as Record<string, any>;
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400, cors);
    }
    const plan = String(body.plan || 'Watchlist Radar Pro').slice(0, 120);
    const channel = String(body.channel || 'Email').slice(0, 60);
    const keywords = String(body.keywords || '').slice(0, 600);
    const lang = body.lang === 'zh' ? 'zh' : 'en';
    const sourceUrl = String(body.source || '').slice(0, 300);
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO leads (email, plan, channel, keywords, lang, source_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(email, plan, channel, keywords, lang, sourceUrl, nowIso)
      .run();

    if (env.OWNER_ALERT_WEBHOOK) {
      await dispatchWebhookPayload(fetcher, 'slack', env.OWNER_ALERT_WEBHOOK, '[RegPulse New Lead]', [
        `Plan: ${plan} (${lang})`,
        `Email: ${email}`,
        `Channel: ${channel}`,
        `Keywords: ${keywords || 'N/A'}`,
      ]);
    }
    return jsonResponse({ ok: true, capturedAt: nowIso }, 200, cors);
  }

  // 6. Automated 12h Alert Dispatch Endpoint (Called by GitHub Actions after sync; 100% idempotent)
  if (path === '/api/internal/dispatch-alerts' && request.method === 'POST') {
    const secret = request.headers.get('X-Internal-Secret') || '';
    if (!env.INTERNAL_CRON_SECRET || !timingSafeEqualHex(secret, env.INTERNAL_CRON_SECRET)) {
      return jsonResponse({ error: 'Unauthorized internal dispatch' }, 401, cors);
    }

    const body = (await request.json()) as {
      warningLetters?: Array<{ id: string; companyName: string; subject: string; postedDate: string; letterUrl: string; cmsId?: string }>;
      recalls?: Array<{ id: string; recallingFirm: string; productDescription: string; reasonForRecall: string; classification: string; reportDate: string; officialSourceUrl: string }>;
    };
    const wls = Array.isArray(body.warningLetters) ? body.warningLetters : [];
    const recs = Array.isArray(body.recalls) ? body.recalls : [];

    const activeSubs = await env.DB.prepare(
      `SELECT w.license_key, w.email, w.channel_type, w.webhook_url, w.keywords_json
       FROM watchlists w
       JOIN licenses l ON l.license_key = w.license_key
       WHERE l.status = 'active'`
    ).all<Record<string, any>>();

    let alertsSent = 0;
    let duplicatesSkipped = 0;
    const nowIso = new Date().toISOString();

    for (const sub of activeSubs.results || []) {
      const kws: string[] = sub.keywords_json ? JSON.parse(sub.keywords_json) : [];
      if (kws.length === 0) continue;

      const candidates: Array<{
        sourceType: 'warning_letter' | 'recall';
        recordId: string;
        matchedKeyword: string;
        headline: string;
        detail: string;
        url: string;
      }> = [];

      for (const wl of wls) {
        const hay = `${wl.companyName} ${wl.subject}`.toLowerCase();
        const hit = kws.find((kw) => hay.includes(kw.toLowerCase()));
        if (hit) {
          candidates.push({
            sourceType: 'warning_letter',
            recordId: wl.id,
            matchedKeyword: hit,
            headline: `[FDA Warning Letter] ${wl.companyName} (${wl.postedDate})`,
            detail: wl.subject,
            url: wl.letterUrl,
          });
        }
      }

      for (const rec of recs) {
        const hay = `${rec.recallingFirm} ${rec.productDescription} ${rec.reasonForRecall}`.toLowerCase();
        const hit = kws.find((kw) => hay.includes(kw.toLowerCase()));
        if (hit) {
          candidates.push({
            sourceType: 'recall',
            recordId: rec.id,
            matchedKeyword: hit,
            headline: `[FDA ${rec.classification} Recall] ${rec.recallingFirm} (${rec.reportDate})`,
            detail: rec.reasonForRecall,
            url: rec.officialSourceUrl,
          });
        }
      }

      for (const item of candidates) {
        const dedupKey = `${sub.license_key}:${item.sourceType}:${item.recordId}`;
        const alreadySent = await env.DB.prepare('SELECT dedup_key FROM sent_alerts WHERE dedup_key = ?')
          .bind(dedupKey)
          .first();
        if (alreadySent) {
          duplicatesSkipped += 1;
          continue;
        }

        let delivered = false;
        if (sub.channel_type !== 'email' && sub.webhook_url) {
          delivered = await dispatchWebhookPayload(
            fetcher,
            String(sub.channel_type),
            String(sub.webhook_url),
            `RegPulse Alert (Keyword: ${item.matchedKeyword}) — ${item.headline}`,
            [item.detail, `Official Source: ${item.url}`]
          );
        }
        if (sub.email) {
          const emailOk = await sendResendEmail(
            env,
            fetcher,
            String(sub.email),
            `[RegPulse Alert] ${item.headline}`,
            `Matched Watchlist Keyword: ${item.matchedKeyword}\n\n${item.headline}\n${item.detail}\n\nOfficial FDA Source: ${item.url}`
          );
          delivered = delivered || emailOk;
        }

        await env.DB.prepare(
          `INSERT INTO sent_alerts (dedup_key, license_key, source_type, record_id, matched_keyword, delivered_channel, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(dedupKey, sub.license_key, item.sourceType, item.recordId, item.matchedKeyword, delivered ? sub.channel_type : 'queued', nowIso)
          .run();
        alertsSent += 1;
      }
    }

    return jsonResponse(
      {
        ok: true,
        subscribersChecked: (activeSubs.results || []).length,
        alertsSent,
        duplicatesSkipped,
      },
      200,
      cors
    );
  }

  return jsonResponse({ error: 'Not Found' }, 404, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
