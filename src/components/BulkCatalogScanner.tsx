import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Sparkles,
  Unlock,
  Upload,
} from 'lucide-react';
import { type ProductVertical } from '../data/complianceRules';
import { scanListing, type RecallRecord, type ScanResult, type WarningLetterRecord } from '../engine/scanner';
import { BILLING_CONFIG, resolveLang, type Lang } from '../lib/config';

interface Props {
  recalls: RecallRecord[];
  warningLetters?: WarningLetterRecord[];
  locale?: Lang;
}

interface ParsedSkuRow {
  sku: string;
  vertical: ProductVertical;
  title: string;
  bullets: string;
  ingredients: string;
}

interface AuditedSkuRow extends ParsedSkuRow {
  result: ScanResult;
}

const FREE_PREVIEW_LIMIT = 3;
const PAID_MAX_SKUS = 200;

// Illustrative 10-SKU multi-vertical store CSV (explicitly labeled Illustrative Example)
const DEMO_CSV_ROWS: ParsedSkuRow[] = [
  {
    sku: 'DEMO-COS-001',
    vertical: 'cosmetics',
    title: 'FDA Approved Retinol & Exosome Serum – Treats Acne & Permanently Erases Wrinkles',
    bullets: 'Clinically proven to heal eczema and repair sun damage. Antibacterial formula kills 99.9% of bacteria.',
    ingredients: 'Water, Glycerin, Retinol, Hydroquinone 2%, Fragrance',
  },
  {
    sku: 'DEMO-SUP-002',
    vertical: 'supplements',
    title: "Nature's Ozempic Berberine 1200mg – Lowers Blood Sugar & Hangover Cure",
    bullets: 'Prescription strength metabolic support. Relieves acid reflux, GERD, and lowers LDL cholesterol.',
    ingredients: 'Berberine HCl, Milk Thistle, Yohimbine HCl',
  },
  {
    sku: 'DEMO-COS-003',
    vertical: 'cosmetics',
    title: 'Daily Squalane & Ceramide Barrier Moisturizer for Dry-Looking Skin',
    bullets: 'Fragrance-free daily hydration that leaves skin looking smooth and supple. Adverse events: safety@example.com',
    ingredients: 'Water, Squalane, Glycerin, Ceramide NP, Panthenol',
  },
  {
    sku: 'DEMO-COS-004',
    vertical: 'cosmetics',
    title: '5% Lidocaine Tattoo & Microneedling Numbing Cream – Pain-Free Skin Procedure',
    bullets: 'Fast topical anesthetic gel with zero side effects. #1 Dermatologist Recommended.',
    ingredients: 'Lidocaine 5%, Prilocaine 2%, Water, Aloe Vera',
  },
  {
    sku: 'DEMO-SUP-005',
    vertical: 'supplements',
    title: 'Quercetin & Mullein Leaf Allergy Relief Drops – Natural Antihistamine & Asthma Support',
    bullets: 'Acts as an expectorant and cough suppressant. Stops seasonal allergies and sinusitis fast.',
    ingredients: 'Quercetin, Mullein Leaf Extract, Stinging Nettle',
  },
  {
    sku: 'DEMO-COS-006',
    vertical: 'cosmetics',
    title: 'Anti-Dandruff Scalp & SPF 50 Sun Protection Tinted Glow Drops',
    bullets: 'Prevents sunburn and eliminates scalp psoriasis. Regrows thinning hair follicles in 14 days.',
    ingredients: 'Water, Ketoconazole 1%, Zinc Oxide, Rosemary Oil',
  },
  {
    sku: 'DEMO-DEV-007',
    vertical: 'devices',
    title: 'Non-Invasive Blood Glucose Smartwatch & Home HIFU Face Lift Device',
    bullets: 'Medical-grade device monitors AFib and relieves chronic neuropathy pain. Product is FDA-Registered.',
    ingredients: 'Silicone strap, optical sensor, USB-C cable',
  },
  {
    sku: 'DEMO-PET-008',
    vertical: 'pets',
    title: 'CBD Dog Joint Chews – Treats Canine Arthritis, Hip Dysplasia & Hot Spots',
    bullets: 'Kills fleas and ticks naturally and stops separation anxiety with zero side effects.',
    ingredients: 'Full-Spectrum Hemp Extract (CBD 15mg), Glucosamine, Chondroitin',
  },
  {
    sku: 'DEMO-COS-009',
    vertical: 'cosmetics',
    title: 'Nano-Hydroxyapatite Whitening Toothpaste – Prevents Cavities & Cures Gingivitis',
    bullets: 'Remineralizes tooth enamel and heals bleeding gums overnight.',
    ingredients: 'Water, Sorbitol, Nano-Hydroxyapatite, Peppermint Oil',
  },
  {
    sku: 'DEMO-SUP-010',
    vertical: 'supplements',
    title: 'Magnesium Glycinate 400mg – Supports Calm Mood and Restful Sleep',
    bullets: 'Supports everyday relaxation. *These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
    ingredients: 'Magnesium Glycinate, Vegetable Cellulose Capsule, Rice Flour',
  },
];

// RFC-4180 compliant quote-aware CSV parser
function parseCsvText(rawText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];
    const next = rawText[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function normalizeVertical(raw: string, fallback: ProductVertical): ProductVertical {
  const v = (raw || '').toLowerCase().trim();
  if (v.includes('cosmetic') || v.includes('skin') || v.includes('beauty') || v.includes('hair')) return 'cosmetics';
  if (v.includes('supp') || v.includes('vitam') || v.includes('nutra') || v.includes('herb')) return 'supplements';
  if (v.includes('dev') || v.includes('led') || v.includes('med') || v.includes('watch')) return 'devices';
  if (v.includes('pet') || v.includes('dog') || v.includes('cat') || v.includes('animal')) return 'pets';
  return fallback;
}

function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function BulkCatalogScanner({ recalls, warningLetters = [], locale = 'en' }: Props) {
  const lang = resolveLang(locale);
  const [defaultVertical, setDefaultVertical] = useState<ProductVertical>('general');
  const [rows, setRows] = useState<ParsedSkuRow[]>(DEMO_CSV_ROWS);
  const [isDemoData, setIsDemoData] = useState(true);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  // License key unlock state
  const [licenseInput, setLicenseInput] = useState('');
  const [unlockedPlan, setUnlockedPlan] = useState<string | null>(null);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  const auditedRows: AuditedSkuRow[] = useMemo(() => {
    return rows.slice(0, PAID_MAX_SKUS).map((r) => ({
      ...r,
      result: scanListing(
        {
          title: r.title,
          bullets: r.bullets,
          ingredients: r.ingredients,
          vertical: r.vertical,
        },
        recalls,
        warningLetters
      ),
    }));
  }, [rows, recalls, warningLetters]);

  const summary = useMemo(() => {
    const critical = auditedRows.filter((r) => r.result.grade === 'CRITICAL').length;
    const high = auditedRows.filter((r) => r.result.grade === 'HIGH').length;
    const clean = auditedRows.filter((r) => r.result.grade === 'LOW').length;
    const totalFlags = auditedRows.reduce((acc, r) => acc + r.result.findings.length, 0);
    return { total: auditedRows.length, critical, high, clean, totalFlags };
  }, [auditedRows]);

  const isUnlocked = Boolean(unlockedPlan);
  const visibleLimit = isUnlocked ? PAID_MAX_SKUS : FREE_PREVIEW_LIMIT;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    try {
      const text = await file.text();
      const matrix = parseCsvText(text);
      if (matrix.length < 2) {
        setParseError(
          lang === 'zh'
            ? 'CSV 文件至少需要 1 行表头和 1 行 SKU 数据。'
            : 'CSV must include a header row plus at least 1 SKU row.'
        );
        return;
      }
      const headers = matrix[0].map((h) => h.toLowerCase().trim());
      const findCol = (aliases: string[]) =>
        headers.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

      const skuIdx = findCol(['sku', 'asin', 'item_sku', 'handle', 'product_id', 'id']);
      const titleIdx = findCol(['title', 'item_name', 'product_name', 'name']);
      const bulletIdx = findCol(['bullet', 'description', 'body', 'copy', 'claims', 'keywords']);
      const ingIdx = findCol(['ingredient', 'material', 'active', 'formula', 'composition']);
      const vertIdx = findCol(['vertical', 'category', 'product_type', 'department']);

      if (titleIdx === -1 && bulletIdx === -1) {
        setParseError(
          lang === 'zh'
            ? '未识别到标题或描述列。请包含列头：sku, title, bullets, ingredients（兼容 Amazon 模板与 Shopify 导出）。'
            : 'Could not detect a Title or Description column. Include headers such as: sku, title, bullets, ingredients (Amazon Flat File & Shopify CSV supported).'
        );
        return;
      }

      const parsed: ParsedSkuRow[] = [];
      for (let i = 1; i < matrix.length && parsed.length < PAID_MAX_SKUS; i++) {
        const line = matrix[i];
        const title = titleIdx >= 0 ? (line[titleIdx] || '').trim() : '';
        const bullets = bulletIdx >= 0 ? (line[bulletIdx] || '').trim() : '';
        const ingredients = ingIdx >= 0 ? (line[ingIdx] || '').trim() : '';
        if (!title && !bullets && !ingredients) continue;
        parsed.push({
          sku: skuIdx >= 0 && line[skuIdx]?.trim() ? line[skuIdx].trim() : `SKU-${String(i).padStart(3, '0')}`,
          vertical: vertIdx >= 0 ? normalizeVertical(line[vertIdx], defaultVertical) : defaultVertical,
          title,
          bullets,
          ingredients,
        });
      }

      if (parsed.length === 0) {
        setParseError(lang === 'zh' ? 'CSV 未解析出有效商品行。' : 'No non-empty product rows found in CSV.');
        return;
      }
      setRows(parsed);
      setIsDemoData(false);
      setFileName(file.name);
    } catch {
      setParseError(lang === 'zh' ? '读取 CSV 文件失败，请确认文件为 UTF-8 编码。' : 'Unable to parse CSV file. Please upload a standard UTF-8 .csv file.');
    }
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = licenseInput.trim().toUpperCase();
    if (!trimmed) return;
    setVerifyingKey(true);
    setKeyMessage('');

    try {
      // 1. Live Cloudflare Worker D1 license verification (strict server-only enforcement when API is configured)
      if (BILLING_CONFIG.apiBaseUrl) {
        const resp = await fetch(`${BILLING_CONFIG.apiBaseUrl.replace(/\/$/, '')}/api/license/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseKey: trimmed }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.valid) {
            setUnlockedPlan(data.planLabel || data.plan || 'Active License');
            setKeyMessage(
              lang === 'zh'
                ? `卡密核验成功（${data.planLabel || data.plan}），已解锁全部 200-SKU 审计与 CSV 整改导出！`
                : `License verified (${data.planLabel || data.plan}). Full 200-SKU audit & remediation CSV export unlocked.`
            );
            setVerifyingKey(false);
            return;
          }
        }
        setUnlockedPlan(null);
        setKeyMessage(
          lang === 'zh'
            ? '卡密无效或已失效，请检查购买回执邮件中的完整 License Key。'
            : 'License key not found or inactive. Check your checkout receipt email for your active key.'
        );
        setVerifyingKey(false);
        return;
      }

      // 2. Pre-launch preview mode only (disabled automatically once BILLING_CONFIG.apiBaseUrl is bound)
      if (/^RP-(BULK|PRO|AGY)-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed)) {
        const planName = trimmed.startsWith('RP-AGY-')
          ? lang === 'zh'
            ? '多店铺代运营版'
            : 'Agency & Aggregator'
          : trimmed.startsWith('RP-PRO-')
            ? lang === 'zh'
              ? 'FDA 预警监控版'
              : 'Watchlist Radar Pro'
            : lang === 'zh'
              ? '200-SKU 批量体检卡'
              : 'Bulk Catalog Pass';
        setUnlockedPlan(planName);
        setKeyMessage(
          lang === 'zh'
            ? `卡密已激活（${planName}），已解锁全部 ${auditedRows.length} 个 SKU 明细与 CSV 导出。`
            : `License activated (${planName}). Full ${auditedRows.length}-SKU audit & CSV remediation export unlocked.`
        );
      } else {
        setUnlockedPlan(null);
        setKeyMessage(
          lang === 'zh'
            ? '无效卡密格式。卡密形如 RP-BULK-XXXX-XXXX（购买后系统自动发送至您的邮箱）。'
            : 'Invalid License Key. Keys follow the format RP-BULK-XXXX-XXXX and are delivered automatically after checkout.'
        );
      }
    } catch {
      setKeyMessage(
        lang === 'zh' ? '核验服务暂时不可用，请稍后重试。' : 'Verification request failed. Please retry in a moment.'
      );
    } finally {
      setVerifyingKey(false);
    }
  };

  const downloadRemediationCsv = () => {
    const header = [
      'SKU',
      'Vertical',
      'Risk_Score',
      'Risk_Grade',
      'Critical_Flags',
      'Flagged_Rule_IDs',
      'Matched_Triggers',
      'Safe_Rewrite_Guidance',
      'Statutory_Citations',
    ];
    const lines = [header.join(',')];
    for (const row of auditedRows) {
      const critCount = row.result.findings.filter((f) => f.rule.severity === 'critical').length;
      const ruleIds = row.result.findings.map((f) => f.rule.id).join(' | ');
      const phrases = row.result.findings.flatMap((f) => f.matchedPhrases).join(' ; ');
      const rewrites = row.result.findings
        .map((f) => `[${f.rule.id}] ${lang === 'zh' ? f.rule.safeRewriteZh : f.rule.safeRewriteEn}`)
        .join(' || ');
      const statutes = row.result.findings.map((f) => f.rule.statute).join(' | ');
      lines.push(
        [
          row.sku,
          row.vertical,
          String(row.result.score),
          row.result.grade,
          String(critCount),
          ruleIds || 'NONE',
          phrases || 'NONE',
          rewrites || (lang === 'zh' ? '未检出明显高危违禁词' : 'No major statutory red flags detected'),
          statutes || 'N/A',
        ]
          .map(csvEscape)
          .join(',')
      );
    }
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regpulse-remediation-audit-${auditedRows.length}skus.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleTemplate = () => {
    const lines = ['sku,vertical,title,bullets,ingredients'];
    for (const r of DEMO_CSV_ROWS) {
      lines.push([r.sku, r.vertical, r.title, r.bullets, r.ingredients].map(csvEscape).join(','));
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regpulse-sample-10sku-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openBuyPassModal = () => {
    window.dispatchEvent(
      new CustomEvent('regpulse:open-watchlist', {
        detail: {
          plan:
            lang === 'zh'
              ? '200-SKU 批量体检卡 (¥99 单次买断)'
              : 'Bulk Catalog Pre-Flight Pass ($19 one-time)',
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Upload & Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-2">
            <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-700" aria-hidden="true" />
              {lang === 'zh'
                ? '上传 Amazon 批量模板 / Shopify 商品 CSV（100% 本地扫描）'
                : 'Upload Amazon Flat File or Shopify Product CSV (100% Browser-Local)'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'zh'
                ? '单次最高支持 200 个 SKU。您的商品表完全在浏览器本地完成 40 项 FDA/EPA/FTC 规则扫描，绝不上传私有选品或供应链数据。前 3 个 SKU 永久免费预览，输入卡密即刻解锁全部 200 行及整改 Excel/CSV 导出。'
                : 'Audit up to 200 SKUs in under 1 second against all 40 statutory FDA, MoCRA, DSHEA, CVM & EPA FIFRA rules—100% locally in your browser. Preview the first 3 SKUs free; unlock all 200 rows + Remediation CSV export with a Bulk Pass or Radar Pro License Key.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 cursor-pointer min-h-[40px]">
                <Upload className="w-4 h-4" aria-hidden="true" />
                {lang === 'zh' ? '选择 CSV 文件' : 'Upload .CSV File'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {lang === 'zh' ? '下载 10-SKU 示例模板' : 'Download Sample CSV'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRows(DEMO_CSV_ROWS);
                  setIsDemoData(true);
                  setFileName('');
                  setParseError('');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                {lang === 'zh' ? '加载 10-SKU 演示样本' : 'Load 10-SKU Demo'}
              </button>
            </div>
            {parseError && (
              <p role="alert" className="text-xs font-semibold text-red-700 pt-1">
                {parseError}
              </p>
            )}
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {isUnlocked ? (
                  <Unlock className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                ) : (
                  <KeyRound className="w-4 h-4 text-teal-700" aria-hidden="true" />
                )}
                {lang === 'zh' ? '解锁 200-SKU 全量审计与 CSV 导出' : 'Unlock Full 200-SKU Audit & Remediation Export'}
              </span>
              <select
                aria-label={lang === 'zh' ? 'CSV 无类目列时默认类目' : 'Default vertical if CSV omits category'}
                value={defaultVertical}
                onChange={(e) => setDefaultVertical(e.target.value as ProductVertical)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
              >
                <option value="general">{lang === 'zh' ? '默认：全 40 项规则' : 'Default: All 40 Rules'}</option>
                <option value="cosmetics">{lang === 'zh' ? '默认：美妆 MoCRA' : 'Default: Cosmetics'}</option>
                <option value="supplements">{lang === 'zh' ? '默认：保健品 DSHEA' : 'Default: Supplements'}</option>
                <option value="devices">{lang === 'zh' ? '默认：美容/医疗仪' : 'Default: Devices'}</option>
                <option value="pets">{lang === 'zh' ? '默认：宠物 CVM' : 'Default: Pets'}</option>
              </select>
            </div>

            <form onSubmit={handleVerifyKey} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="RP-BULK-XXXX-XXXX"
                aria-label={lang === 'zh' ? '输入激活卡密' : 'Enter License Key'}
                autoCapitalize="characters"
                spellCheck={false}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 min-h-[40px]"
              />
              <button
                type="submit"
                disabled={verifyingKey}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer min-h-[40px] shrink-0"
              >
                {verifyingKey
                  ? lang === 'zh'
                    ? '核验中...'
                    : 'Verifying...'
                  : lang === 'zh'
                    ? '验证卡密'
                    : 'Unlock'}
              </button>
            </form>

            {keyMessage && (
              <p
                role="status"
                className={`text-xs font-medium ${isUnlocked ? 'text-emerald-800' : 'text-red-700'}`}
              >
                {keyMessage}
              </p>
            )}

            {!isUnlocked && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
                <span>
                  {lang === 'zh'
                    ? '还没有卡密？¥99 单次买断 200-SKU，或 ¥199/季无限次扫描。'
                    : 'Need a key? $19 one-time Bulk Pass or unlimited scans on Radar Pro ($29/mo).'}
                </span>
                <button
                  type="button"
                  onClick={openBuyPassModal}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {lang === 'zh' ? '获取 200-SKU 体检卡 →' : 'Get Instant Bulk Pass ($19) →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Risk KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {lang === 'zh' ? '已扫描 SKU 总数' : 'SKUs Scanned'}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{summary.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {isDemoData
              ? lang === 'zh'
                ? '10-SKU 高危演示样本'
                : 'Illustrative 10-SKU Demo CSV'
              : fileName || 'Uploaded CSV'}
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
            {lang === 'zh' ? '极危下架风险 SKU' : 'CRITICAL Risk SKUs'}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-red-950 tabular-nums">{summary.critical}</div>
          <div className="text-[11px] text-red-800 mt-0.5">
            {lang === 'zh' ? '必须上架前立即整改' : 'Immediate remediation required'}
          </div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-800">
            {lang === 'zh' ? '累计命中违规规则' : 'Total Statutory Flags'}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-orange-950 tabular-nums">{summary.totalFlags}</div>
          <div className="text-[11px] text-orange-800 mt-0.5">
            {lang === 'zh' ? '覆盖 40 项联邦法规' : 'Across 40 federal rule modules'}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              {lang === 'zh' ? '安全通过 SKU' : 'Clean (LOW Risk) SKUs'}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-950 tabular-nums">{summary.clean}</div>
          </div>
          {isUnlocked && (
            <button
              type="button"
              onClick={downloadRemediationCsv}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {lang === 'zh' ? '导出完整整改 CSV' : 'Export Remediation CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Results Table with Free 3-SKU Preview & Clean Paid Gate */}
      <div tabIndex={0} role="region" aria-labelledby="bulk-table-caption" className="rp-table-wrapper shadow-sm">
        <table className="rp-table">
          <caption id="bulk-table-caption" className="visually-hidden">
            Bulk CSV Catalog FDA Compliance Pre-Flight Audit Results
          </caption>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">{lang === 'zh' ? '商品标题与类目' : 'Product Title & Vertical'}</th>
              <th scope="col">{lang === 'zh' ? '风险评分' : 'Risk Score'}</th>
              <th scope="col">{lang === 'zh' ? '命中法规项与违禁词' : 'Flagged Rules & Triggers'}</th>
              <th scope="col">{lang === 'zh' ? '首要安全改写建议' : 'Top Safe Rewrite'}</th>
            </tr>
          </thead>
          <tbody>
            {auditedRows.slice(0, visibleLimit).map((item) => (
              <tr key={item.sku}>
                <th scope="row" className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                  {item.sku}
                </th>
                <td data-label={lang === 'zh' ? '商品标题与类目' : 'Product Title & Vertical'} className="max-w-xs">
                  <div className="text-xs font-semibold text-slate-900 line-clamp-2">{item.title || '(No title)'}</div>
                  <div className="mt-1 text-[10px] uppercase font-mono text-slate-500">{item.vertical}</div>
                </td>
                <td data-label={lang === 'zh' ? '风险评分' : 'Risk Score'} className="whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                      item.result.grade === 'CRITICAL'
                        ? 'bg-red-100 text-red-900'
                        : item.result.grade === 'HIGH'
                          ? 'bg-orange-100 text-orange-900'
                          : item.result.grade === 'ELEVATED'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {item.result.grade === 'LOW' ? (
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    )}
                    {item.result.score}/100 ({item.result.grade})
                  </span>
                </td>
                <td data-label={lang === 'zh' ? '命中法规项与违禁词' : 'Flagged Rules & Triggers'} className="max-w-sm">
                  {item.result.findings.length === 0 ? (
                    <span className="text-xs text-emerald-700 font-medium">
                      {lang === 'zh' ? '通过：无高危违禁词' : 'Clean — 0 statutory triggers'}
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {item.result.findings.slice(0, 4).map((f) => (
                          <span
                            key={f.rule.id}
                            className="rounded bg-red-50 border border-red-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-900"
                          >
                            {f.rule.id}
                          </span>
                        ))}
                        {item.result.findings.length > 4 && (
                          <span className="text-[10px] text-slate-500">+{item.result.findings.length - 4}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-2">
                        {item.result.findings
                          .flatMap((f) => f.matchedPhrases)
                          .slice(0, 5)
                          .map((p) => `“${p}”`)
                          .join(', ')}
                      </div>
                    </div>
                  )}
                </td>
                <td data-label={lang === 'zh' ? '首要安全改写建议' : 'Top Safe Rewrite'} className="max-w-xs text-xs text-slate-700">
                  {item.result.findings.length > 0 ? (
                    <p className="line-clamp-3">
                      {lang === 'zh'
                        ? item.result.findings[0].rule.safeRewriteZh
                        : item.result.findings[0].rule.safeRewriteEn}
                    </p>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paywall Banner for Locked Rows 4..N */}
      {!isUnlocked && auditedRows.length > FREE_PREVIEW_LIMIT && (
        <div className="rounded-2xl border-2 border-teal-600 bg-slate-950 text-white p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 px-3 py-0.5 text-xs font-bold text-teal-300">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {lang === 'zh'
                ? `还有 ${auditedRows.length - FREE_PREVIEW_LIMIT} 个 SKU 已扫描完成并锁定（含 ${auditedRows
                    .slice(FREE_PREVIEW_LIMIT)
                    .filter((r) => r.result.grade === 'CRITICAL').length} 个极危下架风险 SKU）`
                : `${auditedRows.length - FREE_PREVIEW_LIMIT} Additional SKUs Audited & Locked (${auditedRows
                    .slice(FREE_PREVIEW_LIMIT)
                    .filter((r) => r.result.grade === 'CRITICAL').length} CRITICAL Suppression Risks Detected)`}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold">
              {lang === 'zh'
                ? '立即解锁全部 200-SKU 逐行整改明细 + 一键导出 Excel/CSV 报告'
                : 'Unlock All 200 SKUs + Downloadable Remediation CSV Report'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'zh'
                ? '付款后系统全自动发放卡密（0 人工等待）。粘贴卡密即刻解开所有受限 SKU 的违禁词标红、21 CFR 法条依据与可直接复制的改写方案，避免整店变狗。'
                : 'Instant automated License Key delivery upon checkout (zero sales calls, zero manual turnaround). Export a clean remediation spreadsheet ready for your Amazon catalog or copywriting team.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={openBuyPassModal}
              className="rounded-xl bg-teal-500 px-5 py-3 text-xs font-extrabold text-slate-950 hover:bg-teal-400 cursor-pointer text-center"
            >
              {lang === 'zh' ? '获取 200-SKU 单次体检卡（¥99）' : 'Buy 200-SKU Bulk Pass ($19 One-Time)'}
            </button>
            <span className="text-[11px] text-center text-slate-400">
              {lang === 'zh' ? '或升级 ¥199/季 无限次批量扫描 + 企微预警' : 'Or get unlimited scans with Radar Pro ($29/mo)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
