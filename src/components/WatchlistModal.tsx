import React, { useEffect, useRef, useState } from 'react';
import { BellRing, CheckCircle2, X } from 'lucide-react';
import { BILLING_CONFIG, getInitialLang, type Lang } from '../lib/config';

export default function WatchlistModal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [selectedPlan, setSelectedPlan] = useState('Starter Watchlist ($29/mo)');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('Email');
  const [keywords, setKeywords] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLang(getInitialLang());
    const onLang = (ev: Event) => {
      const next = (ev as CustomEvent<Lang>).detail;
      if (next === 'en' || next === 'zh') setLang(next);
    };
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ plan?: string; prefillKeywords?: string }>).detail;
      if (detail?.plan) setSelectedPlan(detail.plan);
      if (detail?.prefillKeywords) setKeywords(detail.prefillKeywords);
      setSubmitted(false);
      dialogRef.current?.showModal();
    };
    window.addEventListener('regpulse:lang', onLang);
    window.addEventListener('regpulse:open-watchlist', onOpen);
    return () => {
      window.removeEventListener('regpulse:lang', onLang);
      window.removeEventListener('regpulse:open-watchlist', onOpen);
    };
  }, []);

  const close = () => dialogRef.current?.close();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // If live checkout URL is configured, direct user there
    if (selectedPlan.includes('$29') && BILLING_CONFIG.creemStarterUrl) {
      window.open(BILLING_CONFIG.creemStarterUrl, '_blank', 'noopener,noreferrer');
      setSubmitted(true);
      return;
    }
    if (selectedPlan.includes('$79') && BILLING_CONFIG.creemProUrl) {
      window.open(BILLING_CONFIG.creemProUrl, '_blank', 'noopener,noreferrer');
      setSubmitted(true);
      return;
    }
    if (selectedPlan.includes('199') && BILLING_CONFIG.mianbaoduoQuarterlyUrl) {
      window.open(BILLING_CONFIG.mianbaoduoQuarterlyUrl, '_blank', 'noopener,noreferrer');
      setSubmitted(true);
      return;
    }

    // Store request locally & open pre-populated email onboarding trigger
    try {
      const prev = JSON.parse(localStorage.getItem('regpulse_watchlist_requests') || '[]');
      prev.push({
        plan: selectedPlan,
        email,
        channel,
        keywords,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('regpulse_watchlist_requests', JSON.stringify(prev));
    } catch {
      // ignore storage errors
    }

    setSubmitted(true);
  };

  const mailtoHref = `mailto:${BILLING_CONFIG.contactEmail}?subject=${encodeURIComponent(
    `[RegPulse Watchlist Activation] ${selectedPlan}`
  )}&body=${encodeURIComponent(
    `Plan: ${selectedPlan}\nWork Email: ${email}\nPreferred Alert Channel: ${channel}\nSuppliers / Ingredients / Product Codes to Monitor:\n${keywords || '(Please add your top 3–10 brands, OEMs, or ingredients)'}\n`
  )}`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="watchlist-dialog-title"
      className="rp-dialog"
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <BellRing className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="watchlist-dialog-title" className="text-base font-bold text-slate-900">
                {lang === 'zh' ? '开通 FDA 监管预警监控' : 'Activate Automated FDA Watchlist Alerts'}
              </h2>
              <p className="text-xs text-slate-500">{selectedPlan}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={lang === 'zh' ? '关闭弹窗' : 'Close dialog'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-11 h-11 text-emerald-600 mx-auto" aria-hidden="true" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'zh' ? '监控配置单已生成！' : 'Watchlist Brief Prepared!'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                {lang === 'zh'
                  ? '点击下方按钮直接发送预填激活邮件（或在 24 小时内收到自助支付链接与首批监控周报）。早鸟期可享 7 天免费试跑监控。'
                  : 'Click below to send your pre-filled activation brief (no charge yet — includes a 7-day pilot alert run plus your self-serve checkout link within 24 hours).'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
              >
                {lang === 'zh' ? '一键发送激活邮件 (7天试用)' : 'Send Pre-Filled Activation Email (7-Day Pilot)'}
              </a>
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'zh' ? '返回继续扫描' : 'Back to Scanner'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="wl-email" className="block text-xs font-semibold text-slate-800">
                {lang === 'zh' ? '接收预警的工作邮箱 *' : 'Work Email for Alerts *'}
              </label>
              <span id="wl-email-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1">
                {lang === 'zh' ? '格式：name@company.com（仅用于推送合规告警，绝无垃圾邮件）' : 'Format: you@company.com (Used strictly for FDA alerts & checkout activation)'}
              </span>
              <input
                id="wl-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="wl-email-hint"
                placeholder="compliance@yourbrand.com"
                className="rp-field-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
              />
              <div className="rp-error-msg">
                <span role="img" aria-label="Error">⚠️</span>{' '}
                {lang === 'zh' ? '请输入有效的电子邮箱格式（如 name@company.com）。' : 'Enter a valid email address in the format you@example.com.'}
              </div>
            </div>

            <div>
              <label htmlFor="wl-channel" className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'zh' ? '首选实时推送渠道' : 'Preferred Alert Delivery Channel'}
              </label>
              <select
                id="wl-channel"
                name="channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[44px]"
              >
                <option value="Email">Email Digest &amp; Instant Alerts</option>
                <option value="Slack Webhook">Slack Webhook</option>
                <option value="WeCom / Feishu Webhook">企业微信 / 飞书群机器人 Webhook</option>
              </select>
            </div>

            <div>
              <label htmlFor="wl-keywords" className="block text-xs font-semibold text-slate-800">
                {lang === 'zh' ? '需要监控的代工厂 / 竞品品牌 / 高危成分 / 510(k) 代码' : 'Suppliers, Competitor Brands, Ingredients, or 510(k) Codes to Track'}
              </label>
              <span id="wl-kw-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1">
                {lang === 'zh' ? '逗号分隔，最多先填 10 个核心词' : 'Comma-separated (e.g., Berberine, Retinol, Manufacturer Name, Product Code OLP)'}
              </span>
              <textarea
                id="wl-keywords"
                name="keywords"
                rows={3}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                aria-describedby="wl-kw-hint"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors min-h-[48px] cursor-pointer"
            >
              {lang === 'zh' ? '申请开通监控（含 7 天免费试跑）' : 'Start 7-Day Free Watchlist Pilot'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
