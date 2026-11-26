export type Lang = 'en' | 'zh';

export const BILLING_CONFIG = {
  // Replace with live Creem.io & Mianbaoduo checkout URLs immediately after investor KYC
  creemStarterUrl: '',
  creemProUrl: '',
  mianbaoduoQuarterlyUrl: '',
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
