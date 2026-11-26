import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Check, CheckCircle2, Copy, Mail, X } from 'lucide-react';
import { BILLING_CONFIG, resolveLang, type Lang } from '../lib/config';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Props {
  locale?: Lang;
}

export default function WatchlistModal({ locale = 'en' }: Props) {
  const lang = resolveLang(locale);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(
    lang === 'zh' ? 'FDA 实时预警季卡 (¥199/季)' : 'Watchlist Radar Pro ($29/mo)'
  );
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [channel, setChannel] = useState('Email');
  const [keywords, setKeywords] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverCaptured, setServerCaptured] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ plan?: string; prefillKeywords?: string }>).detail;
      if (detail?.plan) setSelectedPlan(detail.plan);
      if (detail?.prefillKeywords !== undefined) setKeywords(detail.prefillKeywords);
      setEmailError('');
      setSubmitted(false);
      setServerCaptured(false);
      setCopiedBrief(false);
      dialogRef.current?.showModal();
    };
    window.addEventListener('regpulse:open-watchlist', onOpen);
    return () => window.removeEventListener('regpulse:open-watchlist', onOpen);
  }, []);

  const close = () => dialogRef.current?.close();

  const validateEmail = (val: string): boolean => {
    if (!EMAIL_REGEX.test(val.trim())) {
      setEmailError(
        lang === 'zh'
          ? '请输入有效的电子邮箱格式（如 compliance@yourbrand.com）。'
          : 'Enter a valid work email address in the format you@company.com.'
      );
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      emailInputRef.current?.focus();
      return;
    }

    // Strict locale-isolated checkout routing
    if (lang === 'en') {
      if (selectedPlan.includes('$19') && BILLING_CONFIG.creemBulkPassUrl) {
        window.open(BILLING_CONFIG.creemBulkPassUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
      if (selectedPlan.includes('$29') && BILLING_CONFIG.creemStarterUrl) {
        window.open(BILLING_CONFIG.creemStarterUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
      if (selectedPlan.includes('$79') && BILLING_CONFIG.creemProUrl) {
        window.open(BILLING_CONFIG.creemProUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
    } else {
      if (selectedPlan.includes('99') && !selectedPlan.includes('199') && !selectedPlan.includes('599') && BILLING_CONFIG.mianbaoduoBulkUrl) {
        window.open(BILLING_CONFIG.mianbaoduoBulkUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
      if (selectedPlan.includes('199') && BILLING_CONFIG.mianbaoduoQuarterlyUrl) {
        window.open(BILLING_CONFIG.mianbaoduoQuarterlyUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
      if (selectedPlan.includes('599') && BILLING_CONFIG.mianbaoduoProUrl) {
        window.open(BILLING_CONFIG.mianbaoduoProUrl, '_blank', 'noopener,noreferrer');
        setServerCaptured(true);
        setSubmitted(true);
        return;
      }
    }

    // Self-owned Cloudflare Worker lead capture API (zero third-party form dependency)
    if (BILLING_CONFIG.apiBaseUrl) {
      setSubmitting(true);
      try {
        const resp = await fetch(`${BILLING_CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan,
            email: email.trim(),
            channel,
            keywords: keywords.trim(),
            lang,
            source: window.location.href,
          }),
        });
        if (resp.ok) {
          setServerCaptured(true);
        }
      } catch {
        setServerCaptured(false);
      } finally {
        setSubmitting(false);
      }
    }

    setSubmitted(true);
  };

  const briefPlainText =
    lang === 'zh'
      ? `RegPulse 跨境合规监控 / 批量体检开通申请
选择方案：${selectedPlan}
工作邮箱：${email.trim()}
推送渠道：${channel}
重点监控词（代工厂 / 竞品 / 成分 / 510(k)）：${keywords.trim() || '（待补充）'}`
      : `RegPulse Regulatory Monitoring / Bulk Pass Request
Plan: ${selectedPlan}
Work Email: ${email.trim()}
Alert Channel: ${channel}
Tracked OEMs / Ingredients / Product Codes: ${keywords.trim() || '(To be provided)'}`;

  const mailtoHref = `mailto:${BILLING_CONFIG.contactEmail}?subject=${encodeURIComponent(
    `[RegPulse Request] ${selectedPlan}`
  )}&body=${encodeURIComponent(briefPlainText)}`;

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefPlainText);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      // ignore
    }
  };

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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              <BellRing className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="watchlist-dialog-title" className="text-base font-bold text-slate-900">
                {lang === 'zh' ? '开通 FDA 预警监控 / 批量体检卡' : 'Activate Automated FDA Monitoring or Bulk Pass'}
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
          <div className="py-5 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-teal-50/70 border border-teal-200 p-4">
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-slate-800 leading-relaxed">
                <p className="font-bold text-slate-950 text-sm">
                  {serverCaptured
                    ? lang === 'zh'
                      ? '开通请求已实时登记！'
                      : 'Request Logged Instantly!'
                    : lang === 'zh'
                      ? '最后一步：发送您的配置单（免费激活 7 天试跑）'
                      : 'Final Step: Send Your Brief to Start Your 7-Day Free Pilot'}
                </p>
                <p className="mt-1">
                  {serverCaptured
                    ? lang === 'zh'
                      ? '系统已记录您的邮箱与监控词，将在 24 小时内发出专属卡密（License Key）与自助管理入口。'
                      : 'Your license key and automated watchlist portal credentials will be dispatched within 24 hours.'
                    : lang === 'zh'
                      ? '自助结账网关正在完成商户最终审核。请点击下方发送预填邮件或复制配置单，24 小时内为您发出激活卡密与 7 天免费试跑权限。'
                      : 'Self-serve card checkout is completing merchant onboarding. Send the pre-filled email below (or copy the brief for webmail) and we will issue your License Key for a free 7-day pilot.'}
                </p>
              </div>
            </div>

            {!serverCaptured && (
              <pre className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] font-mono text-slate-700 whitespace-pre-wrap break-words">
                {briefPlainText}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              {!serverCaptured && (
                <>
                  <a
                    href={mailtoHref}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    {lang === 'zh' ? '打开邮件客户端发送' : 'Open Email App to Send'}
                  </a>
                  <button
                    type="button"
                    onClick={copyBrief}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedBrief ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        {lang === 'zh' ? '已复制配置单' : 'Copied Brief'}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        {lang === 'zh' ? '复制配置单（网页邮箱用）' : 'Copy Brief (For Webmail)'}
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="wl-email" className="block text-xs font-semibold text-slate-800">
                {lang === 'zh' ? '接收卡密与预警的工作邮箱 *' : 'Work Email for License Key & Alerts *'}
              </label>
              <span id="wl-email-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1">
                {lang === 'zh'
                  ? '格式：name@company.com（仅用于发放卡密与合规告警，绝无垃圾邮件）'
                  : 'Format: you@company.com (Used strictly for License Key delivery & FDA alerts)'}
              </span>
              <input
                ref={emailInputRef}
                id="wl-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError && EMAIL_REGEX.test(e.target.value.trim())) {
                    setEmailError('');
                  }
                }}
                onBlur={() => {
                  if (email.trim()) validateEmail(email);
                }}
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'wl-email-hint wl-email-err' : 'wl-email-hint'}
                placeholder="compliance@yourbrand.com"
                className={`w-full rounded-lg border px-3 py-2 text-sm min-h-[44px] ${
                  emailError ? 'border-red-600 bg-red-50' : 'border-slate-300 bg-white'
                }`}
              />
              {emailError && (
                <div id="wl-email-err" role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠️</span> {emailError}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="wl-channel" className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'zh' ? '首选实时告警推送渠道' : 'Preferred Alert Delivery Channel'}
              </label>
              <select
                id="wl-channel"
                name="channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[44px]"
              >
                {lang === 'zh' ? (
                  <>
                    <option value="Email">邮件周报 + 实时高危告警</option>
                    <option value="WeCom Webhook">企业微信群机器人 Webhook</option>
                    <option value="Feishu Webhook">飞书群机器人 Webhook</option>
                  </>
                ) : (
                  <>
                    <option value="Email">Email Digest &amp; Instant Alerts</option>
                    <option value="Slack Webhook">Slack Channel Webhook</option>
                    <option value="Custom JSON Webhook">Custom JSON Webhook (Teams / Zapier / Make)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="wl-keywords" className="block text-xs font-semibold text-slate-800">
                {lang === 'zh'
                  ? '需要监控的代工厂 / 竞品品牌 / 核心成分 / 510(k) 代码'
                  : 'Suppliers, OEMs, Competitor Brands, Ingredients, or 510(k) Codes'}
              </label>
              <span id="wl-kw-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1">
                {lang === 'zh'
                  ? '逗号分隔，最多先填 10 个核心监控词（涵盖 Warning Letters 与 Recalls）'
                  : 'Comma-separated (tracks both live FDA Warning Letters & openFDA Recalls)'}
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
              disabled={submitting}
              className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors min-h-[48px] cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? lang === 'zh'
                  ? '提交中...'
                  : 'Submitting...'
                : lang === 'zh'
                  ? '申请开通（含 7 天免费试跑）'
                  : 'Continue to Activation (7-Day Free Pilot)'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
