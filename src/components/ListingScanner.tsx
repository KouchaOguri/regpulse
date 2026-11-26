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
    hintEn: 'Serums, creams, hair/lash, SPF/dandruff checks',
    hintZh: '精华/面霜/洗护/防晒/去屑检测',
  },
  {
    value: 'supplements',
    labelEn: 'Dietary Supplements (DSHEA)',
    labelZh: '膳食补充剂 / 保健品',
    hintEn: 'Capsules, gummies, botanicals, vitamins',
    hintZh: '胶囊/软糖/草本/维生素/护肝',
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

const CATEGORY_ZH: Record<string, string> = {
  'Drug Claim': '药物宣称越界',
  'Disease Claim': '疾病治疗宣称',
  'OTC Monograph Drug': 'OTC 药品专论触发',
  'FDA Terminology Misuse': 'FDA 术语/背书违规',
  'Prohibited / Tainted Ingredient': '禁用/非法添加成分',
  'EPA Pesticide Trap': 'EPA 农药扫号陷阱',
  'FTC Substantiation': 'FTC 临床证据红线',
};

const SEVERITY_ZH: Record<string, string> = {
  critical: '极危',
  high: '高危',
  medium: '中危',
};

function extractMonitorKeywords(ingredients: string, vertical: ProductVertical): string {
  const cleaned = ingredients
    .split(/[,;\n]+/)
    .map((s) => s.replace(/\d+%|\d+mg|\d+ml/gi, '').trim())
    .filter((s) => s.length >= 4 && !/^(water|aqua|glycerin|fragrance|vegetable cellulose|rice flour)$/i.test(s))
    .slice(0, 6);
  if (cleaned.length > 0) return cleaned.join(', ');
  if (vertical === 'cosmetics') return 'Retinol, Hydroquinone, Cosmetics OEM';
  if (vertical === 'supplements') return 'Berberine, Ashwagandha, Supplement OEM';
  if (vertical === 'devices') return 'LED Mask, IPL Device, 510(k) Product Code GEX';
  return 'Brand Name, OEM Manufacturer, Key Ingredients';
}

export default function ListingScanner({ recalls, basePath }: Props) {
  const [lang, setLang] = useState<Lang>('en');
  const [vertical, setVertical] = useState<ProductVertical>('cosmetics');
  const [title, setTitle] = useState(SAMPLE_LISTINGS.cosmetic.title);
  const [bullets, setBullets] = useState(SAMPLE_LISTINGS.cosmetic.bullets);
  const [ingredients, setIngredients] = useState(SAMPLE_LISTINGS.cosmetic.ingredients);
  const [isDemoLoaded, setIsDemoLoaded] = useState(true);
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
    setIsDemoLoaded(true);
    const res = scanListing(
      { title: s.title, bullets: s.bullets, ingredients: s.ingredients, vertical: s.vertical },
      recalls
    );
    setResult(res);
    setStatusMsg(
      lang === 'zh'
        ? `已加载高危演示样本「${s.labelZh}」并完成扫描（风险分 ${res.score}/100）。`
        : `Loaded illustrative risk example "${s.labelEn}" and scanned (Risk score ${res.score}/100).`
    );
  };

  const clearForm = () => {
    setTitle('');
    setBullets('');
    setIngredients('');
    setIsDemoLoaded(false);
    setResult(null);
    setStatusMsg(lang === 'zh' ? '已清空输入内容。' : 'Inputs cleared.');
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
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
          prefillKeywords: extractMonitorKeywords(ingredients, vertical),
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

        {/* Preset one-click illustrative risk examples */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            {lang === 'zh'
              ? '一键加载高危演示样本（Illustrative Risk Example）快速体验：'
              : 'Load an Illustrative Risk Example (demo copy) in 1 click:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SAMPLE_LISTINGS).map(([key, sample]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadSample(key as keyof typeof SAMPLE_LISTINGS)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-teal-600 shrink-0" aria-hidden="true" />
                {lang === 'zh' ? sample.labelZh : sample.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Radio Group */}
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
              ? '100% 浏览器本地瞬时检测（<50ms），不上传你的私有文案草稿'
              : 'Processed locally in your browser (<50ms). Your private draft copy never leaves your device.'}
          </span>
          <input
            id="rp-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDemoLoaded(false);
            }}
            aria-describedby="rp-title-hint"
            placeholder={lang === 'zh' ? '粘贴英文商品标题...' : 'e.g., Vitamin C Brightening Facial Serum...'}
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
              ? '自动识别并放行标准 DSHEA 免责声明与“Not FDA Approved”否定语境'
              : 'Automatically exempts standard FDA DSHEA disclaimers and "not FDA approved" negation phrases.'}
          </span>
          <textarea
            id="rp-bullets"
            name="bullets"
            rows={5}
            value={bullets}
            onChange={(e) => {
              setBullets(e.target.value);
              setIsDemoLoaded(false);
            }}
            aria-describedby="rp-bullets-hint"
            placeholder={lang === 'zh' ? '粘贴五点描述与详情页卖点...' : 'Paste Amazon bullet points, A+ copy, or packaging claims...'}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-y"
          />
        </div>

        {/* Ingredients & Materials */}
        <div className="mt-4">
          <label htmlFor="rp-ingredients" className="block text-xs font-semibold text-slate-800">
            {lang === 'zh' ? '成分表 / 原料 / 包装标签文本（用于交叉比对同行业 FDA 召回库）' : 'Ingredients / Active Compounds / Label Footer'}
          </label>
          <span id="rp-ing-hint" className="block text-[11px] text-slate-500 mt-0.5 mb-1.5">
            {lang === 'zh'
              ? '筛查 21 CFR 700 禁用成分、高危西药（支持 1 字母拼写容错）及同行业 openFDA 召回'
              : 'Screened against 21 CFR 700 bans, hidden drug APIs (with typo guard) & vertical-matched openFDA recalls.'}
          </span>
          <textarea
            id="rp-ingredients"
            name="ingredients"
            rows={3}
            value={ingredients}
            onChange={(e) => {
              setIngredients(e.target.value);
              setIsDemoLoaded(false);
            }}
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
              {lang === 'zh'
                ? '粘贴商品文案或点击左侧高危演示样本，即可在 0.1 秒内生成法规体检报告'
                : 'Paste your listing copy or load an Illustrative Risk Example on the left to generate an instant statutory audit report.'}
            </p>
          </div>
        ) : (
          <>
            {/* Score Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm print-card">
              {isDemoLoaded && (
                <div className="mb-3 rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-700 flex items-center justify-between gap-2 no-print">
                  <span>
                    {lang === 'zh'
                      ? '当前显示为【高危演示样本】扫描结果——清空左侧输入框即可检测你的真实 Listing。'
                      : 'Showing audit for an Illustrative Risk Example — click Clear on the left to scan your own real listing.'}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{lang === 'zh' ? 'RegPulse 合规风险体检报告' : 'RegPulse Statutory Audit Summary'}</span>
                    <span>•</span>
                    <span>
                      {result.scannedWordCount} {lang === 'zh' ? '词' : 'words'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
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
                    {lang === 'zh' ? '订阅 7×24 预警监控' : 'Monitor Supplier / Ingredients'}
                  </button>
                </div>
              </div>

              <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                <div
                  className={`h-full transition-all duration-300 ${gradeBadge?.bar || 'bg-teal-600'}`}
                  style={{ width: result.score === 0 ? '0%' : `${Math.max(4, result.score)}%` }}
                />
              </div>

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
                    {lang === 'zh' ? '同行业 FDA 召回' : 'Matched FDA Recalls'}
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
                            {lang === 'zh' ? SEVERITY_ZH[rule.severity] || rule.severity : rule.severity}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {lang === 'zh' ? CATEGORY_ZH[rule.category] || rule.category : rule.category}
                          </span>
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
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

            {/* Vertical-Scoped Live OpenFDA Recall Cross-Reference */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'zh'
                    ? '同行业 openFDA 官方召回库成分交叉比对'
                    : 'Vertical-Matched openFDA Enforcement Recall Cross-Check'}
                </h3>
                <a
                  href={withBase('/recalls/')}
                  className="text-xs font-semibold text-teal-700 hover:underline no-print"
                >
                  {lang === 'zh' ? `浏览全部 ${recalls.length} 条实时召回 →` : `Browse all ${recalls.length} live recalls →`}
                </a>
              </div>

              {result.matchedRecalls.length === 0 ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'zh'
                    ? '当前成分表未精确命中同行业最新 openFDA 召回记录（系统已启用严格同行业+整词边界匹配，避免无关食品/医疗器械误匹配）。建议订阅监控，在未来出现相同成分或代工厂召回时实时预警。'
                    : 'No exact whole-word ingredient matches in the current vertical openFDA enforcement feed (cross-vertical food/hospital noise is strictly filtered out). Subscribe to a Watchlist for ongoing supplier & ingredient monitoring.'}
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
                      {rec.productShort && (
                        <p className="mt-1 text-[11px] font-medium text-slate-600">{rec.productShort}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-800 line-clamp-2">{rec.reasonForRecall}</p>
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
