export type Lang = 'en' | 'zh';

export const BILLING_CONFIG = {
  // Live Cloudflare Worker + D1 API endpoint (strict server-side license verify, leads & watchlist portal)
  apiBaseUrl: 'https://api.regpulsehq.com',
  // Global USD Checkout URLs (Creem.io — populated upon Step 2 Creem KYC approval)
  creemBulkPassUrl: '', // $19 one-time 200-SKU Bulk Catalog Pre-Flight Pass
  creemStarterUrl: '', // $29/mo Watchlist Radar Pro
  creemProUrl: '', // $79/mo Agency & Aggregator
  // China Domestic RMB Checkout URLs (Mianbaoduo — strictly scoped to /cn/ routes only)
  mianbaoduoBulkUrl: '', // ¥99 single 200-SKU pass
  mianbaoduoQuarterlyUrl: '', // ¥199/quarter cross-border alerts
  mianbaoduoProUrl: '', // ¥599/quarter multi-store agency
  // Brand domain email powered by Cloudflare Email Routing
  contactEmail: 'support@regpulsehq.com',
  earlyAccessActive: true,
};

export function resolveLang(forcedLocale?: Lang): Lang {
  return forcedLocale === 'zh' ? 'zh' : 'en';
}
