import { COMPLIANCE_RULES, type ComplianceRule, type ProductVertical, type RuleSeverity } from '../data/complianceRules';

export interface RecallRecord {
  id: string;
  recallNumber: string;
  eventId: string;
  sourceCategory: string;
  vertical: string;
  classification: string;
  status: string;
  recallingFirm: string;
  city: string;
  state: string;
  country: string;
  productDescription: string;
  reasonForRecall: string;
  reportDate: string;
  initiationDate: string;
  voluntaryMandated: string;
  distributionPattern: string;
  riskTags: string[];
  officialSourceUrl: string;
}

export interface ScanFinding {
  rule: ComplianceRule;
  matchedPhrases: string[];
  snippets: string[];
}

export interface MandatoryCheckItem {
  id: string;
  passed: boolean;
  severity: RuleSeverity;
  titleEn: string;
  titleZh: string;
  detailEn: string;
  detailZh: string;
  statute: string;
}

export interface ScanResult {
  score: number; // 0 = safest, 100 = critical suppression risk
  grade: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  vertical: ProductVertical;
  findings: ScanFinding[];
  mandatoryChecks: MandatoryCheckItem[];
  matchedRecalls: RecallRecord[];
  highlightedHtml: string;
  scannedWordCount: number;
  scannedAtIso: string;
}

const DSHEA_DISCLAIMER_REGEX =
  /these\s+statements\s+have\s+not\s+been\s+evaluated\s+by\s+the\s+(u\.?s\.?\s+)?food\s+and\s+drug\s+administration[^.\n]*\.?\s*(this\s+product\s+is\s+not\s+intended\s+to\s+diagnose[^.\n]*\.?)?/gi;

const NOT_INTENDED_DISCLAIMER_REGEX =
  /not\s+intended\s+to\s+diagnose,?\s*treat,?\s*cure,?\s*(or\s+)?prevent\s+any\s+disease\.?/gi;

const STRUCTURE_FUNCTION_TRIGGER =
  /\b(supports?|promotes?|maintains?|helps?\s+maintain|boosts?\s+energy|immune\s+support|joint\s+comfort|restful\s+sleep|healthy\s+metabolism|gut\s+health|digestive\s+health)\b/i;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function maskDisclaimer(text: string): { masked: string; hasDsheaDisclaimer: boolean } {
  const hasFull = DSHEA_DISCLAIMER_REGEX.test(text);
  DSHEA_DISCLAIMER_REGEX.lastIndex = 0;
  const hasSecond = NOT_INTENDED_DISCLAIMER_REGEX.test(text);
  NOT_INTENDED_DISCLAIMER_REGEX.lastIndex = 0;
  const masked = text
    .replace(DSHEA_DISCLAIMER_REGEX, (m) => ' '.repeat(m.length))
    .replace(NOT_INTENDED_DISCLAIMER_REGEX, (m) => ' '.repeat(m.length));
  return { masked, hasDsheaDisclaimer: hasFull || hasSecond };
}

function extractContext(fullText: string, index: number, length: number): string {
  const start = Math.max(0, index - 42);
  const end = Math.min(fullText.length, index + length + 42);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < fullText.length ? '…' : '';
  return `${prefix}${fullText.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

export function scanListing(
  input: {
    title: string;
    bullets: string;
    ingredients: string;
    vertical: ProductVertical;
  },
  recallsCorpus: RecallRecord[] = []
): ScanResult {
  const combinedRaw = [input.title, input.bullets, input.ingredients]
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n');

  const { masked, hasDsheaDisclaimer } = maskDisclaimer(combinedRaw);
  const wordCount = combinedRaw.trim() ? combinedRaw.trim().split(/\s+/).length : 0;

  const findings: ScanFinding[] = [];
  const highlightRanges: Array<{ start: number; end: number; severity: RuleSeverity; ruleId: string }> = [];

  for (const rule of COMPLIANCE_RULES) {
    // Apply rule if it covers selected vertical or 'general'
    const applies =
      input.vertical === 'general' ||
      rule.verticals.includes(input.vertical) ||
      rule.verticals.includes('general');
    if (!applies) continue;

    const matchedSet = new Set<string>();
    const snippets: string[] = [];

    for (const pat of rule.patterns) {
      const re = new RegExp(pat, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(masked)) !== null) {
        if (m[0].length === 0) break;
        const phrase = combinedRaw.slice(m.index, m.index + m[0].length);
        const norm = phrase.toLowerCase().trim();
        if (!matchedSet.has(norm)) {
          matchedSet.add(norm);
          if (snippets.length < 3) {
            snippets.push(extractContext(combinedRaw, m.index, m[0].length));
          }
        }
        highlightRanges.push({
          start: m.index,
          end: m.index + m[0].length,
          severity: rule.severity,
          ruleId: rule.id,
        });
      }
    }

    if (matchedSet.size > 0) {
      findings.push({
        rule,
        matchedPhrases: Array.from(matchedSet).slice(0, 6),
        snippets,
      });
    }
  }

  // Sort findings: critical -> high -> medium, then weight desc
  const sevRank: Record<RuleSeverity, number> = { critical: 3, high: 2, medium: 1 };
  findings.sort((a, b) => sevRank[b.rule.severity] - sevRank[a.rule.severity] || b.rule.weight - a.rule.weight);

  // Mandatory vertical structural checks
  const mandatoryChecks: MandatoryCheckItem[] = [];
  if (input.vertical === 'supplements') {
    const usesStructFunc = STRUCTURE_FUNCTION_TRIGGER.test(masked);
    if (usesStructFunc || findings.some((f) => f.rule.category === 'Disease Claim')) {
      mandatoryChecks.push({
        id: 'MAND-DSHEA-01',
        passed: hasDsheaDisclaimer,
        severity: 'high',
        titleEn: 'Mandatory FDA DSHEA Disclaimer (21 CFR 101.93)',
        titleZh: '保健品强制 DSHEA 免责声明（21 CFR 101.93）',
        detailEn: hasDsheaDisclaimer
          ? 'Standard FDA DSHEA disclaimer detected and excluded from false-positive disease matching.'
          : 'Your listing makes wellness/structure-function claims without the mandatory disclaimer: "*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."',
        detailZh: hasDsheaDisclaimer
          ? '已检测到标准 FDA DSHEA 免责声明（系统已自动屏蔽该免责段落，防止误报）。'
          : '文案包含功能/健康支持宣称，但缺少法定强制免责声明：“*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.”',
        statute: '21 CFR 101.93(b)–(d)',
      });
    }
  }

  if (input.vertical === 'cosmetics') {
    const hasContact =
      /\b(adverse\s+event|report\s+(a\s+)?reaction|questions\s+or\s+comments|1-8\d{2}|@\w+\.\w+|distributed\s+by|responsible\s+person)\b/i.test(
        combinedRaw
      );
    mandatoryChecks.push({
      id: 'MAND-MOCRA-01',
      passed: hasContact,
      severity: 'medium',
      titleEn: 'MoCRA U.S. Adverse-Event Contact Requirement',
      titleZh: 'MoCRA 化妆品美国不良事件联系信息核验',
      detailEn: hasContact
        ? 'Contact / Responsible Person wording detected. Verify the physical outer label also displays a U.S. domestic address, phone number, or electronic contact.'
        : 'MoCRA requires physical cosmetic labels to display a U.S. domestic address, U.S. phone number, or electronic portal where consumers can report adverse events. Missing this triggers Amazon cosmetic compliance failures.',
      detailZh: hasContact
        ? '已检测到责任人/联系方式线索。请同步核对产品外包装实物印刷有美国本土地址、电话或电子上报入口。'
        : 'MoCRA 强制要求化妆品实物标签印有美国本土地址、电话或不良事件电子上报入口。缺失该项是 2025–2026 年 Amazon 美妆审核驳回高频原因。',
      statute: 'FD&C Act §609(a) (MoCRA)',
    });
  }

  if (input.vertical === 'devices') {
    const has510kNum = /\bK\d{6}\b/i.test(combinedRaw);
    mandatoryChecks.push({
      id: 'MAND-510K-01',
      passed: has510kNum,
      severity: 'medium',
      titleEn: 'FDA 510(k) Clearance Number Check',
      titleZh: '器械 510(k) 许可号（K-Number）核查',
      detailEn: has510kNum
        ? '510(k) format K-number detected. Verify your exact SKU and intended use match the cleared predicate in the openFDA 510(k) database.'
        : 'No 510(k) K-number detected. If you make therapeutic/medical claims, Amazon requires verified 510(k) clearance matching your product code; otherwise strictly limit copy to non-medical general wellness.',
      detailZh: has510kNum
        ? '检测到 K 开头 510(k) 编号。请确保在售型号及宣称功效与 FDA 核准的预期用途完全一致。'
        : '未检测到 510(k) 编号。若未获 510(k) 许可，切勿使用医疗/理疗宣称，否则将触发 Amazon 医疗器械类目限售封锁。',
      statute: '21 CFR 807.81',
    });
  }

  // Compute Risk Score (0-100)
  let rawScore = 0;
  for (const f of findings) {
    rawScore += f.rule.weight + Math.min(6, (f.matchedPhrases.length - 1) * 3);
  }
  for (const mc of mandatoryChecks) {
    if (!mc.passed) {
      rawScore += mc.severity === 'high' ? 14 : 8;
    }
  }
  const score = Math.min(100, rawScore);
  const grade: ScanResult['grade'] =
    score >= 65 ? 'CRITICAL' : score >= 35 ? 'HIGH' : score >= 15 ? 'ELEVATED' : 'LOW';

  // Cross-reference live OpenFDA Recalls corpus by ingredient & product tokens
  const stopWords = new Set([
    'water', 'aqua', 'glycerin', 'oil', 'extract', 'powder', 'capsule', 'capsules',
    'tablet', 'tablets', 'cream', 'serum', 'lotion', 'mask', 'formula', 'complex',
    'natural', 'organic', 'daily', 'blend', 'product', 'approved', 'healthy',
    'support', 'supports', 'skin', 'hair', 'body', 'face', 'facial', 'with', 'from',
    'contains', 'proprietary', 'fragrance', 'acid', 'root', 'leaf', 'bark', 'mg', 'ml',
  ]);
  const tokens = Array.from(
    new Set(
      `${input.ingredients} ${input.title}`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 4 && !stopWords.has(t))
    )
  ).slice(0, 24);

  const scoredRecalls: Array<{ rec: RecallRecord; hits: number }> = [];
  if (tokens.length > 0 && recallsCorpus.length > 0) {
    for (const rec of recallsCorpus) {
      const hay = `${rec.recallingFirm} ${rec.productDescription} ${rec.reasonForRecall}`.toLowerCase();
      let hits = 0;
      for (const tok of tokens) {
        if (hay.includes(tok)) hits += 1;
      }
      if (hits > 0) {
        scoredRecalls.push({ rec, hits });
      }
    }
  }
  scoredRecalls.sort((a, b) => b.hits - a.hits || b.rec.reportDate.localeCompare(a.rec.reportDate));
  const matchedRecalls = scoredRecalls.slice(0, 5).map((x) => x.rec);

  // Build safe inline highlighted HTML
  highlightRanges.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: typeof highlightRanges = [];
  for (const r of highlightRanges) {
    const prev = merged[merged.length - 1];
    if (!prev || r.start >= prev.end) {
      merged.push({ ...r });
    } else if (r.end > prev.end) {
      prev.end = r.end;
      if (sevRank[r.severity] > sevRank[prev.severity]) {
        prev.severity = r.severity;
      }
    }
  }

  let cursor = 0;
  const htmlParts: string[] = [];
  for (const r of merged) {
    if (r.start > cursor) {
      htmlParts.push(escapeHtml(combinedRaw.slice(cursor, r.start)));
    }
    const cls =
      r.severity === 'critical'
        ? 'mark-critical'
        : r.severity === 'high'
          ? 'mark-high'
          : 'mark-medium';
    htmlParts.push(`<mark class="${cls}" data-rule="${escapeHtml(r.ruleId)}">${escapeHtml(combinedRaw.slice(r.start, r.end))}</mark>`);
    cursor = r.end;
  }
  if (cursor < combinedRaw.length) {
    htmlParts.push(escapeHtml(combinedRaw.slice(cursor)));
  }

  return {
    score,
    grade,
    vertical: input.vertical,
    findings,
    mandatoryChecks,
    matchedRecalls,
    highlightedHtml: htmlParts.join('').replace(/\n/g, '<br />'),
    scannedWordCount: wordCount,
    scannedAtIso: new Date().toISOString(),
  };
}
