export type Lang = 'en' | 'zh';

export const BILLING_CONFIG = {
  // Populated immediately upon investor Creem.io / Mianbaoduo KYC approval
  creemStarterUrl: '',
  creemProUrl: '',
  mianbaoduoQuarterlyUrl: '',
  // Optional async lead-capture webhook (Web3Forms / Formspree / Cloudflare Worker)
  leadWebhookUrl: '',
  contactEmail: 'hachileviathan@gmail.com',
  earlyAccessActive: true,
};

export function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem('regpulse_lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export function setGlobalLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('regpulse_lang', lang);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('regpulse:lang', { detail: lang }));
}
