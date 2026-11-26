import React, { useState } from 'react';
import { BellRing, CheckCircle2, KeyRound, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { BILLING_CONFIG, resolveLang, type Lang } from '../lib/config';

interface Props {
  locale?: Lang;
}

export default function AlertPortal({ locale = 'en' }: Props) {
  const lang = resolveLang(locale);
  const [licenseKey, setLicenseKey] = useState('');
  const [verified, setVerified] = useState(false);
  const [planLabel, setPlanLabel] = useState('');
  const [email, setEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelType, setChannelType] = useState(lang === 'zh' ? 'wecom' : 'slack');
  const [trackers, setTrackers] = useState<string[]>([
    'Berberine',
    'Hydroquinone',
    'Lidocaine',
  ]);
  const [newTracker, setNewTracker] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = licenseKey.trim().toUpperCase();
    if (!key) return;
    setBusy(true);
    setStatusMsg('');
    setIsError(false);

    try {
      if (BILLING_CONFIG.apiBaseUrl) {
        const resp = await fetch(`${BILLING_CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/watchlist`, {
          method: 'GET',
          headers: { 'X-License-Key': key },
        });
        if (resp.ok) {
          const data = await resp.json();
          setVerified(true);
          setPlanLabel(data.planLabel || data.plan || 'Watchlist Radar Pro');
          setEmail(data.email || '');
          setWebhookUrl(data.webhookUrl || '');
          setChannelType(data.channelType || (lang === 'zh' ? 'wecom' : 'slack'));
          if (Array.isArray(data.keywords) && data.keywords.length > 0) {
            setTrackers(data.keywords);
          }
          setStatusMsg(
            lang === 'zh'
              ? '已连接实时监控后端，您可随时增删监控词与群机器人 Webhook。'
              : 'Connected to live watchlist backend. Update your OEMs, ingredients, or webhook anytime.'
          );
          setBusy(false);
          return;
        }
      }

      if (/^RP-(PRO|AGY)-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
        setVerified(true);
        setPlanLabel(key.startsWith('RP-AGY-') ? 'Agency & Aggregator' : 'Watchlist Radar Pro');
        setStatusMsg(
          lang === 'zh'
            ? '卡密格式已识别（离线预览模式）。待自定义域名 API 节点就绪后将自动同步至云端 7×24 巡检队列。'
            : 'License key recognized (local preview mode — syncs live once api.regpulsehq.com Worker is connected).'
        );
      } else {
        setIsError(true);
        setStatusMsg(
          lang === 'zh'
            ? '请输入有效的预警订阅卡密（形如 RP-PRO-XXXX-XXXX）。'
            : 'Enter an active Watchlist Radar Pro or Agency license key (format: RP-PRO-XXXX-XXXX).'
        );
      }
    } catch {
      setIsError(true);
      setStatusMsg(lang === 'zh' ? '连接监控网关失败，请稍后重试。' : 'Failed to connect to watchlist API.');
    } finally {
      setBusy(false);
    }
  };

  const addTracker = () => {
    const val = newTracker.trim();
    if (!val || trackers.includes(val)) return;
    setTrackers((prev) => [...prev, val]);
    setNewTracker('');
  };

  const removeTracker = (kw: string) => {
    setTrackers((prev) => prev.filter((k) => k !== kw));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg('');
    setIsError(false);

    try {
      if (BILLING_CONFIG.apiBaseUrl) {
        const resp = await fetch(`${BILLING_CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-License-Key': licenseKey.trim().toUpperCase(),
          },
          body: JSON.stringify({
            email: email.trim(),
            channelType,
            webhookUrl: webhookUrl.trim(),
            keywords: trackers,
          }),
        });
        if (!resp.ok) throw new Error('Save failed');
        setStatusMsg(
          lang === 'zh'
            ? '监控配置已实时保存至云端！每 12 小时 FDA 同步命中后将自动推送告警。'
            : 'Watchlist saved live! Automated alerts will fire whenever FDA posts matching Warning Letters or Recalls.'
        );
      } else {
        localStorage.setItem(
          'regpulse_watchlist_draft',
          JSON.stringify({ email, channelType, webhookUrl, keywords: trackers })
        );
        setStatusMsg(
          lang === 'zh'
            ? '配置已在浏览器本地暂存（待 api.regpulsehq.com 绑定后实时同步至云端 D1 队列）。'
            : 'Saved locally in preview mode (writes directly to Cloudflare D1 once custom domain API is active).'
        );
      }
    } catch {
      setIsError(true);
      setStatusMsg(lang === 'zh' ? '保存失败，请检查卡密状态或稍后重试。' : 'Could not save watchlist settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lightweight 1-2-3 Alert Setup Guide + Sample Notification Preview */}
      <div className="max-w-3xl mx-auto grid gap-4 md:grid-cols-12 items-stretch">
        <ol
          aria-label={lang === 'zh' ? '自动预警配置三步流程' : 'How automated FDA alerts work'}
          className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs"
        >
          <li className="flex items-start gap-2.5 text-xs">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white shrink-0 mt-0.5">1</span>
            <div>
              <span className="font-bold text-slate-900">
                {lang === 'zh' ? '下单自动发放专属卡密' : 'Receive Instant License Key After Checkout'}
              </span>
              <p className="text-slate-600 mt-0.5">
                {lang === 'zh'
                  ? '付款后系统秒级发出 RP-PRO-XXXX-XXXX 格式卡密，无需等人工开通。'
                  : 'Our fulfillment webhook emails your RP-PRO-XXXX-XXXX key immediately—zero onboarding calls.'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 text-xs">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white shrink-0 mt-0.5">2</span>
            <div>
              <span className="font-bold text-slate-900">
                {lang === 'zh' ? '填入代工厂名、成分与群机器人 Webhook' : 'Add OEMs, Ingredients & Delivery Webhook'}
              </span>
              <p className="text-slate-600 mt-0.5">
                {lang === 'zh'
                  ? '输入您的代工厂全称、高危活性成分、竞品或 510(k) 代码，并绑定邮箱或企微/飞书机器人。'
                  : 'Enter your contract manufacturers, active ingredients, competitor brands, or 510(k) codes plus Email/Slack.'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 text-xs">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white shrink-0 mt-0.5">3</span>
            <div>
              <span className="font-bold text-slate-900">
                {lang === 'zh' ? '每 12 小时双库巡检，命中即推（0 重复）' : '12-Hour Automated FDA Sync & Deduplicated Alerts'}
              </span>
              <p className="text-slate-600 mt-0.5">
                {lang === 'zh'
                  ? '每次同步 FDA 官方警告信与 openFDA 召回后自动比对并推送，幂等去重绝不刷屏。'
                  : 'Every 12h sync scans new FDA Warning Letters and openFDA Recalls and fires deduplicated alerts automatically.'}
              </p>
            </div>
          </li>
        </ol>

        <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-teal-400 mb-2">
              <span>{lang === 'zh' ? '告警推送格式示例' : 'Illustrative Alert Format'}</span>
              <span>{lang === 'zh' ? '企微 / 飞书 / 邮件' : 'Slack / Email / JSON'}</span>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed text-slate-200 whitespace-pre-wrap break-words bg-slate-900/90 border border-slate-800 rounded-xl p-3">
{lang === 'zh'
  ? `[RegPulse 实时预警] 命中关键词：Lidocaine
类型：FDA 官方警告信（CDER / OTC）
主体：[代工厂或品牌示例]
摘要：OTC 麻膏专论违规 / CGMP 缺陷
官方原文：https://www.fda.gov/...`
  : `[RegPulse Alert] Keyword: Lidocaine
Source: Official FDA Warning Letter (CDER)
Subject: CGMP / Unapproved OTC Violation
Official URL: https://www.fda.gov/...`}
            </pre>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            {lang === 'zh'
              ? '注：上方为推送排版格式示例，真实告警直连 FDA.gov 官方原文。'
              : 'Illustrative format example. Live alerts link directly to official FDA.gov & openFDA records.'}
          </p>
        </div>
      </div>

      {!verified ? (
        <form onSubmit={handleLogin} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {lang === 'zh' ? '自助管理您的 7×24 FDA 预警词库' : 'Self-Serve FDA Watchlist & Alert Portal'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'zh'
                  ? '输入付款后自动发出的卡密（License Key），零人工工单自助配置监控词与推送群机器人'
                  : 'Enter the License Key emailed upon checkout to configure OEMs, ingredients, and webhook alerts with zero support tickets.'}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="portal-key" className="block text-xs font-semibold text-slate-800 mb-1">
              {lang === 'zh' ? '订阅卡密（License Key）' : 'Subscriber License Key'}
            </label>
            <input
              id="portal-key"
              type="text"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="RP-PRO-XXXX-XXXX"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm min-h-[44px]"
            />
          </div>

          {statusMsg && (
            <p role="alert" className={`text-xs font-semibold ${isError ? 'text-red-700' : 'text-teal-800'}`}>
              {statusMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 cursor-pointer min-h-[48px]"
          >
            {busy
              ? lang === 'zh'
                ? '验证中...'
                : 'Authenticating...'
              : lang === 'zh'
                ? '进入自助预警控制台'
                : 'Open Watchlist Control Panel'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-slate-950">{planLabel}</h2>
                <p className="font-mono text-xs text-slate-500">{licenseKey.trim().toUpperCase()}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
              <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
              {lang === 'zh' ? '7×24 监控激活中（含警告信 + 召回）' : 'Active — Monitoring Warning Letters + Recalls'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="portal-email" className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'zh' ? '告警接收邮箱' : 'Alert Email Address'}
              </label>
              <input
                id="portal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="compliance@yourbrand.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="portal-channel" className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'zh' ? '即时推送 Webhook 类型' : 'Instant Webhook Channel'}
              </label>
              <select
                id="portal-channel"
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[44px]"
              >
                {lang === 'zh' ? (
                  <>
                    <option value="email">仅邮件告警与周一简报</option>
                    <option value="wecom">企业微信群机器人 Webhook</option>
                    <option value="feishu">飞书群机器人 Webhook</option>
                  </>
                ) : (
                  <>
                    <option value="email">Email Alerts &amp; Weekly Digest Only</option>
                    <option value="slack">Slack Incoming Webhook</option>
                    <option value="webhook">Custom JSON Webhook (Zapier / Make / Teams)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {channelType !== 'email' && (
            <div>
              <label htmlFor="portal-webhook" className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'zh' ? '机器人 Webhook URL' : 'Webhook Endpoint URL'}
              </label>
              <input
                id="portal-webhook"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={lang === 'zh' ? 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...' : 'https://hooks.slack.com/services/...'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs min-h-[44px]"
              />
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-slate-800 mb-2">
              {lang === 'zh'
                ? '已监控关键词（代工厂全称 / 核心成分 / 竞品品牌 / 510(k) 代码）'
                : 'Tracked Keywords (OEM Names, Active Ingredients, Competitor Brands, 510(k) Codes)'}
            </span>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTracker}
                onChange={(e) => setNewTracker(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTracker();
                  }
                }}
                placeholder={lang === 'zh' ? '输入新的监控词，例如：Retinol 或代工厂名' : 'Add keyword, e.g., Retinol, Ashwagandha, or OEM Name'}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[40px]"
              />
              <button
                type="button"
                onClick={addTracker}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {lang === 'zh' ? '添加' : 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {trackers.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-900"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeTracker(kw)}
                    aria-label={`Remove ${kw}`}
                    className="text-teal-700 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {statusMsg && (
            <div
              role="status"
              className={`rounded-xl border p-3 text-xs font-medium flex items-center gap-2 ${
                isError
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {busy
              ? lang === 'zh'
                ? '保存中...'
                : 'Saving...'
              : lang === 'zh'
                ? '保存 7×24 自动预警配置'
                : 'Save Automated Watchlist Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
