import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  FileDown,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SAMPLE_LISTINGS, type ProductVertical } from '../data/complianceRules';
import { scanListing, type RecallRecord, type ScanResult } from '../engine/scanner';
import { getInitialLang, type Lang } from '../lib/config';

interface Props {
  recalls: RecallRecord[];
  basePath: string;
}

const VERTICAL_OPTIONS: Array<{
  value: ProductVertical;
  labelEn: string;
  labelZh: string;
  hintEn: string;
  hintZh: string;
}> = [
  {
    value: 'cosmetics',
    labelEn: 'Cosmetics & Skincare (MoCRA)',
    labelZh: '美妆护肤（MoCRA）',
    hintEn: 'Serums, creams, hair/lash, cleansers',
    hintZh: '精华/面霜/洗护/睫毛液',
  },
  {
    value: 'supplements',
    labelEn: 'Dietary Supplements (DSHEA)',
    labelZh: '膳食补充剂 / 保健品',
    hintEn: 'Capsules, gummies, botanicals, vitamins',
    hintZh: '胶囊/软糖/草本/维生素',
  },
  {
    value: 'devices',
    labelEn: 'Beauty & Light Medical Devices',
    labelZh: '美容仪 / 轻医疗器械',
    hintEn: 'LED masks, EMS, IPL, TENS, wearables',
    hintZh: '红光仪/微电流/脱毛仪/穿戴',
  },
  {
    value: 'general',
    labelEn: 'General / Multi-Category',
    labelZh: '通用 / 全类目扫描',
    hintEn: 'Run all FDA, FTC & EPA FIFRA rules',
    hintZh: '全量扫描 FDA + FTC + EPA 农药词',
  },
];

export default function ListingScanner({ recalls, basePath }: Props) {
  const [lang, setLang] = useState<Lang>('en');
  const [vertical, setVertical] = useState<ProductVertical>('cosmetics');
  const [title, setTitle] = useState(SAMPLE_LISTINGS.cosmetic.title);
  const [bullets, setBullets] = useState(SAMPLE_LISTINGS.cosmetic.bullets);
  const [ingredients, setIngredients] = useState(SAMPLE_LISTINGS.cosmetic.ingredients);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    setLang(getInitialLang());
    const handler = (ev: Event) => {
      const next = (ev as CustomEvent<Lang>).detail;
      if (next === 'en' || next === 'zh') setLang(next);
    };
    window.addEventListener('regpulse:lang', handler);
    return () => window.removeEventListener('regpulse:lang', handler);
  }, []);

  // Run initial scan on mount so visitor immediately sees rich commercial value
  useEffect(() => {
    const initial = scanListing(
      {
        title: SAMPLE_LISTINGS.cosmetic.title,
        bullets: SAMPLE_LISTINGS.cosmetic.bullets,
        ingredients: SAMPLE_LISTINGS.cosmetic.ingredients,
        vertical: 'cosmetics',
      },
      recalls
    );
    setResult(initial);
  }, [recalls]);

  const withBase = (path: string) => {
    const clean = basePath.replace(/\/$/, '');
    return `${clean}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const handleRunScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = scanListing({ title, bullets, ingredients, vertical }, recalls);
    setResult(res);
    setStatusMsg(
      lang === 'zh'
        ? `扫描完成：风险评分 ${res.score}/100，共检出 ${res.findings.length} 项高危法规触发点。`
        : `Scan complete: Risk score ${res.score}/100 with ${res.findings.length} statutory findings.`
    );
  };

  const loadSample = (key: keyof typeof SAMPLE_LISTINGS) => {
    const s = SAMPLE_LISTINGS[key];
    setVertical(s.vertical);
    setTitle(s.title);
    setBullets(s.bullets);
    setIngredients(s.ingredients);
    const res = scanListing(
      { title: s.title, bullets: s.bullets, ingredients: s.ingredients, vertical: s.vertical },
      recalls
    );
    setResult(res);
    setStatusMsg(
      lang === 'zh'
        ? `已加载示例「${s.labelZh}」并完成扫描（风险分 ${res.score}/100）。`
        : `Loaded "${s.labelEn}" and scanned (Risk score ${res.score}/100).`
    );
  };

  const clearForm = () => {
    setTitle('');
    setBullets('');
    setIngredients('');
    setResult(null);
    setStatusMsg(lang === 'zh' ? '已清空输入内容。' : 'Inputs cleared.');
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // fallback ignored
    }
  };

  const gradeBadge = useMemo(() => {
    if (!result) return null;
    switch (result.grade) {
      case 'CRITICAL':
        return {
          cls: 'bg-red-50 text-red-900 border-red-300',
          bar: 'bg-red-600',
          labelEn: 'CRITICAL — High ASIN Suppression Risk',
          labelZh: '极危 — 极高 Amazon 扫号下架风险',
        };
      case 'HIGH':
        return {
          cls: 'bg-orange-50 text-orange-900 border-orange-300',
          bar: 'bg-orange-500',
          labelEn: 'HIGH — Likely Regulatory / Bot Trigger',
          labelZh: '高危 — 高度疑似触发 FDA/平台风控',
        };
      case 'ELEVATED':
        return {
          cls: 'bg-amber-50 text-amber-900 border-amber-300',
          bar: 'bg-amber-500',
          labelEn: 'ELEVATED — Review Before Publishing',
          labelZh: '中危 — 上架前建议修正隐患项',
        };
      default:
        return {
          cls: 'bg-emerald-50 text-emerald-900 border-emerald-300',
          bar: 'bg-emerald-600',
          labelEn: 'LOW — No Major Statutory Red Flags',
          labelZh: '低危 — 暂未检出明显法规硬伤',
        };
    }
  }, [result]);

  const openWatchlist = () => {
    window.dispatchEvent(
      new CustomEvent('regpulse:open-watchlist', {
        detail: {
          plan: lang === 'zh' ? '中文跨境监控季卡 (¥199/季)' : 'Starter Watchlist ($29/mo)',
          prefillKeywords: title.slice(0, 80),
        },
      })
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* Left Input Form */}
      <form
        onSubmit={handleRunScan}
        aria-labelledby="scanner-form-heading"
        className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm no-print"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <h2 id="scanner-form-heading" className="text-base font-bold text-slate-900">
            {lang === 'zh' ? '1. 输入你的商品 Listing 与成分' : '1. Paste Your Product Listing & Ingredients'}
          </h2>
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {lang === 'zh' ? '清空' : 'Clear'}
          </button>
        </div>

        {/* Preset one-click samples */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            {lang === 'zh' ? '一键加载高危真实示例体验：' : 'Load a high-risk example in 1 click:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SAMPLE_LISTINGS).map(([key, sample]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadSample(key as keyof typeof SAMPLE_LISTINGS)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-teal-600" aria-hidden="true" />
                {lang === 'zh' ? sample.labelZh : sample.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Radio Group (per modern-web-guidance: 2-5 exclusive options -> visible radios in fieldset/legend) */}
        <fieldset className="mt-5">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
            {lang === 'zh' ? '选择产品类目（决定适用 FDA 法规集）' : 'Product Category (Sets Applicable FDA Statutes)'}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VERTICAL_OPTIONS.map((opt) => {
              const checked = vertical === opt.value;
              const id = `vertical-${opt.value}`;
              return (
                <label
                  key={opt.value}
                  htmlFor={id}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                    checked
                      ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name="product_vertical"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setVertical(opt.value)}
                    className="mt-0.5 accent-teal-700 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-900 leading-snug">
                      {lang === 'zh' ? opt.labelZh : opt.labelEn}
                    </span>
                    <span className="block text-[11px] text-slate-500 leading-tight mt-0.5">
                      {lang === 'zh' ? opt.hintZh : opt.hintEn}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Product Title */}
        <div className="mt-4">
          <label htmlFor="rp-title" className="block text-xs font-semibold text-slate-800">
            {lang === 'zh' ? '商品标题（Amazon / TikTok Shop / 独立站 Title）' : 'Product Title'}
          </label>
          <span id="rp-title-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1.5">
            {lang === 'zh'
              ? '含品牌名、卖点词、功效词（100% 浏览器本地瞬时检测，不上传私有文案）'
              : 'Processed locally in your browser (<50ms). Your private draft copy never leaves your device.'}
          </span>
          <input
            id="rp-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="rp-title-hint"
            placeholder={lang === 'zh' ? '粘贴英文商品标题...' : 'e.g., Vitamin C Anti-Aging Facial Serum...'}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Bullets & Description */}
        <div className="mt-4">
          <label htmlFor="rp-bullets" className="block text-xs font-semibold text-slate-800">
            {lang === 'zh' ? '五点描述 / A+ 文案 / 后台 Search Terms' : 'Bullet Points, Description & Backend Keywords'}
          </label>
          <span id="rp-bullets-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1.5">
            {lang === 'zh'
              ? '自动识别并放行标准 DSHEA 免责声明，防止误报'
              : 'Standard FDA DSHEA disclaimers are automatically recognized and exempted from false positives.'}
          </span>
          <textarea
            id="rp-bullets"
            name="bullets"
            rows={5}
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            aria-describedby="rp-bullets-hint"
            placeholder={lang === 'zh' ? '粘贴五点描述与详情页卖点...' : 'Paste Amazon bullet points, A+ copy, or packaging claims...'}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-y"
          />
        </div>

        {/* Ingredients & Materials */}
        <div className="mt-4">
          <label htmlFor="rp-ingredients" className="block text-xs font-semibold text-slate-800">
            {lang === 'zh' ? '成分表 / 原料 / 包装标签文本（用于交叉比对 FDA 召回库）' : 'Ingredients / Active Compounds / Label Footer'}
          </label>
          <span id="rp-ing-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1.5">
            {lang === 'zh'
              ? '自动筛查 FDA 禁用成分、非法添加西药及近 260 条实时 openFDA 召回关联'
              : 'Screened against 21 CFR 700 bans, FDA tainted-product adulterants & live openFDA recalls.'}
          </span>
          <textarea
            id="rp-ingredients"
            name="ingredients"
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            aria-describedby="rp-ing-hint"
            placeholder={lang === 'zh' ? '例如：Water, Retinol, Niacinamide, Berberine...' : 'e.g., Water, Glycerin, Niacinamide, Fragrance...'}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-y"
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-colors min-h-[48px] cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          {lang === 'zh' ? '立即运行 FDA & Amazon 合规风险扫描' : 'Run Free FDA & Amazon Risk Audit'}
        </button>

        {/* Polite Live Region for Screen Readers */}
        <div role="status" aria-live="polite" className="visually-hidden">
          {statusMsg}
        </div>
      </form>

      {/* Right Results Report */}
      <div className="lg:col-span-7 space-y-5">
        {!result ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-800">
              {lang === 'zh' ? '粘贴商品文案或点击上方示例即可在 0.1 秒内生成合规体检报告' : 'Paste your listing copy or click an example above to generate an instant statutory audit report.'}
            </p>
          </div>
        ) : (
          <>
            {/* Score Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm print-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{lang === 'zh' ? 'RegPulse 合规风险体检报告' : 'RegPulse Statutory Audit Summary'}</span>
                    <span>•</span>
                    <span>{result.scannedWordCount} {lang === 'zh' ? '词' : 'words'}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                      {result.score}
                      <span className="text-lg font-medium text-slate-400">/100</span>
                    </span>
                    {gradeBadge && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${gradeBadge.cls}`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {lang === 'zh' ? gradeBadge.labelZh : gradeBadge.labelEn}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                    {lang === 'zh' ? '导出审计 PDF' : 'Export Audit PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={openWatchlist}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    {lang === 'zh' ? '订阅 7×24 预警监控' : 'Monitor Supplier / Category'}
                  </button>
                </div>
              </div>

              {/* Progress meter */}
              <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                <div
                  className={`h-full transition-all duration-300 ${gradeBadge?.bar || 'bg-teal-600'}`}
                  style={{ width: `${Math.max(4, result.score)}%` }}
                />
              </div>

              {/* Quick KPI Strip */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-red-50/70 border border-red-100 p-3">
                  <div className="text-[11px] font-semibold text-red-800">
                    {lang === 'zh' ? '极危红线项' : 'Critical Flags'}
                  </div>
                  <div className="text-xl font-extrabold text-red-950 tabular-nums mt-0.5">
                    {result.findings.filter((f) => f.rule.severity === 'critical').length}
                  </div>
                </div>
                <div className="rounded-xl bg-orange-50/70 border border-orange-100 p-3">
                  <div className="text-[11px] font-semibold text-orange-800">
                    {lang === 'zh' ? '高危警示项' : 'High Risk Flags'}
                  </div>
                  <div className="text-xl font-extrabold text-orange-950 tabular-nums mt-0.5">
                    {result.findings.filter((f) => f.rule.severity === 'high').length}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-semibold text-slate-600">
                    {lang === 'zh' ? '必检合规项缺失' : 'Missing Mandates'}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                    {result.mandatoryChecks.filter((m) => !m.passed).length}
                  </div>
                </div>
                <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-3">
                  <div className="text-[11px] font-semibold text-teal-800">
                    {lang === 'zh' ? '命中 FDA 真实召回' : 'FDA Recall Matches'}
                  </div>
                  <div className="text-xl font-extrabold text-teal-950 tabular-nums mt-0.5">
                    {result.matchedRecalls.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Annotated Inline Preview */}
            {result.findings.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                  {lang === 'zh' ? '原文高危词实时标红定位' : 'Annotated Listing Preview (Flagged Triggers Highlighted)'}
                </h3>
                <div
                  className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 break-words"
                  dangerouslySetInnerHTML={{ __html: result.highlightedHtml }}
                />
              </div>
            )}

            {/* Detailed Citation-Backed Findings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'zh'
                  ? `检出法规触发明细与安全改写建议（${result.findings.length} 项）`
                  : `Statutory Trigger Breakdown & Safe Rewrites (${result.findings.length})`}
              </h3>

              {result.findings.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-emerald-950">
                      {lang === 'zh' ? '未检出高危 FDA 药物宣称或 EPA 农药扫号词' : 'No High-Risk FDA Drug Claims or EPA Pesticide Triggers Detected'}
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      {lang === 'zh'
                        ? '请继续核对下方强制标签项（如 DSHEA 免责声明或 MoCRA 美国联系地址），并保持对供应商召回的持续监控。'
                        : 'Verify the mandatory structural checks below (such as DSHEA disclaimers or MoCRA U.S. adverse-event contact info) before publishing.'}
                    </p>
                  </div>
                </div>
              ) : (
                result.findings.map(({ rule, matchedPhrases }) => {
                  const isCrit = rule.severity === 'critical';
                  const rewriteText = lang === 'zh' ? rule.safeRewriteZh : rule.safeRewriteEn;
                  return (
                    <article
                      key={rule.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-card"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                              isCrit
                                ? 'bg-red-50 text-red-900 border-red-200'
                                : 'bg-orange-50 text-orange-900 border-orange-200'
                            }`}
                          >
                            {rule.severity}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">{rule.category}</span>
                          <span className="text-[11px] font-mono text-slate-400">{rule.id}</span>
                        </div>
                        <a
                          href={withBase(`/rules/${rule.slug}/`)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline no-print"
                        >
                          {lang === 'zh' ? '查看完整法规指南 →' : 'Full Rule Guide →'}
                        </a>
                      </div>

                      <h4 className="mt-2 text-base font-bold text-slate-900">
                        {lang === 'zh' ? rule.titleZh : rule.titleEn}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {matchedPhrases.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center rounded bg-red-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-red-900"
                          >
                            “{p}”
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-700">
                        <strong className="text-slate-900">
                          {lang === 'zh' ? '违规原因与扫号机制：' : 'Why FDA / Amazon Flags This: '}
                        </strong>
                        {lang === 'zh' ? rule.whyFlaggedZh : rule.whyFlaggedEn}
                      </p>

                      {/* Official citation bar */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                        <span className="font-mono text-slate-700">
                          <strong>{lang === 'zh' ? '法条依据：' : 'Statute: '}</strong>
                          {rule.statute}
                        </span>
                        <a
                          href={rule.officialRefUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                        >
                          {rule.officialRefLabel}
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>

                      {/* Compliant Rewrite Box */}
                      <div className="mt-3 rounded-xl bg-emerald-50/80 border border-emerald-200 p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-emerald-900">
                            {lang === 'zh' ? '安全合规改写建议' : 'Safe Compliant Rewrite Guidance'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(rule.id, rewriteText)}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-300 px-2 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 cursor-pointer no-print"
                          >
                            {copiedId === rule.id ? (
                              <>
                                <Check className="w-3 h-3" aria-hidden="true" />
                                {lang === 'zh' ? '已复制' : 'Copied'}
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" aria-hidden="true" />
                                {lang === 'zh' ? '复制建议' : 'Copy Rewrite'}
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed text-emerald-950">{rewriteText}</p>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Mandatory Structural Checks */}
            {result.mandatoryChecks.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-card">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {lang === 'zh' ? '类目强制合规结构核验' : 'Mandatory Category Compliance Checks'}
                </h3>
                <ul className="space-y-3">
                  {result.mandatoryChecks.map((mc) => (
                    <li
                      key={mc.id}
                      className={`rounded-xl border p-3.5 ${
                        mc.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {mc.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                          )}
                          {lang === 'zh' ? mc.titleZh : mc.titleEn}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{mc.statute}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                        {lang === 'zh' ? mc.detailZh : mc.detailEn}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live OpenFDA Recall Cross-Reference */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'zh'
                    ? '实时 openFDA 官方召回库关联命中'
                    : 'Live openFDA Enforcement & Recall Cross-Reference'}
                </h3>
                <a
                  href={withBase('/recalls/')}
                  className="text-xs font-semibold text-teal-700 hover:underline no-print"
                >
                  {lang === 'zh' ? `浏览全部 ${recalls.length} 条实时召回 →` : `Browse all ${recalls.length} live recalls →`}
                </a>
              </div>

              {result.matchedRecalls.length === 0 ? (
                <p className="text-xs text-slate-600">
                  {lang === 'zh'
                    ? '当前输入的成分/品名未直接命中最新 260 条 openFDA 召回记录。建议订阅监控以在未来出现相关供应商/成分召回时第一时间收到告警。'
                    : 'No direct keyword matches in the latest 260 openFDA enforcement reports. Subscribe to a Watchlist to receive real-time alerts if your ingredients or suppliers appear in future recalls.'}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {result.matchedRecalls.map((rec) => (
                    <li key={rec.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              rec.classification === 'Class I'
                                ? 'bg-red-100 text-red-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {rec.classification}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{rec.recallingFirm}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {rec.recallNumber} • {rec.reportDate}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-700 line-clamp-2">{rec.reasonForRecall}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px]">
                        <a
                          href={withBase(`/recalls/${rec.id}/`)}
                          className="font-semibold text-teal-700 hover:underline"
                        >
                          {lang === 'zh' ? '查看召回详情' : 'View Recall Record'}
                        </a>
                        <a
                          href={rec.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                        >
                          openFDA JSON <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
