-- RegPulse Automated Paid Fulfillment & Watchlist Alert Schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  provider TEXT NOT NULL,           -- 'creem' | 'mianbaoduo' | 'pilot'
  provider_order_id TEXT NOT NULL,
  plan TEXT NOT NULL,               -- 'bulk_pass' | 'pro' | 'agency'
  plan_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'refunded'
  bulk_limit INTEGER NOT NULL DEFAULT 200,
  max_trackers INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS watchlists (
  license_key TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'email', -- 'email' | 'slack' | 'wecom' | 'feishu' | 'webhook'
  webhook_url TEXT DEFAULT '',
  keywords_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

CREATE TABLE IF NOT EXISTS sent_alerts (
  dedup_key TEXT PRIMARY KEY,       -- '{license_key}:{source_type}:{record_id}'
  license_key TEXT NOT NULL,
  source_type TEXT NOT NULL,        -- 'warning_letter' | 'recall'
  record_id TEXT NOT NULL,
  matched_keyword TEXT NOT NULL,
  delivered_channel TEXT NOT NULL,
  sent_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  channel TEXT DEFAULT 'Email',
  keywords TEXT DEFAULT '',
  lang TEXT DEFAULT 'en',
  source_url TEXT DEFAULT '',
  created_at TEXT NOT NULL
);
