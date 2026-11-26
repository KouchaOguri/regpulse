export type Lang = 'en' | 'zh';

export const BILLING_CONFIG = {
  // Cloudflare Worker API endpoint (activated upon regpulsehq.com deployment, e.g. 'https://api.regpulsehq.com')
  apiBaseUrl: '',
  // Global USD Checkout URLs (Creem.io — populated upon investor Creem KYC approval)
  creemBulkPassUrl: '', // $19 one-time 200-SKU Bulk Catalog Pre-Flight Pass
  creemStarterUrl: '', // $29/mo Watchlist Radar Pro
  creemProUrl: '', // $79/mo Agency & Aggregator
  // China Domestic RMB Checkout URLs (Mianbaoduo — strictly scoped to /cn/ routes only)
  mianbaoduoBulkUrl: '', // ¥99 single 200-SKU pass
  mianbaoduoQuarterlyUrl: '', // ¥199/quarter cross-border alerts
  mianbaoduoProUrl: '', // ¥599/quarter multi-store agency
  // Real active inbox (will forward from support@regpulsehq.com once custom domain DNS is live)
  contactEmail: 'hachileviathan@gmail.com',
  earlyAccessActive: true,
};

export function resolveLang(forcedLocale?: Lang): Lang {
  return forcedLocale === 'zh' ? 'zh' : 'en';
}
