import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, FileDown } from 'lucide-react';
import { resolveLang, type Lang } from '../lib/config';

interface CheckItem {
  id: string;
  statute: string;
  titleEn: string;
  titleZh: string;
  descEn: string;
  descZh: string;
  amazonTipEn: string;
  amazonTipZh: string;
}

const MOCRA_ITEMS: CheckItem[] = [
  {
    id: 'facility-reg',
    statute: 'FD&C Act §607(a)',
    titleEn: 'Contract Manufacturer Facility Registration (FEI Number)',
    titleZh: '代工厂已完成 MoCRA 设施注册并取得 FEI 编号',
    descEn:
      'Every domestic or foreign facility manufacturing or processing cosmetic products for U.S. distribution must register with FDA via Cosmetics Direct and renew biennially (unless qualified under the Small Business Exemption).',
    descZh:
      '所有向美国供货的本土及海外（含中国）化妆品生产/加工厂均须通过 FDA Cosmetics Direct 完成设施注册并每两年续期（小微企业豁免除外）。',
    amazonTipEn:
      'Amazon Trap: FDA does NOT issue paper certificates. Keep your official Cosmetics Direct submission confirmation & FEI number on file for Amazon ungating.',
    amazonTipZh:
      'Amazon 避坑：FDA 官方不发纸质“FDA 证书”。请向代工厂索要官方 Cosmetics Direct 提交回执截图与 FEI 号留底应对申诉。',
  },
  {
    id: 'product-listing',
    statute: 'FD&C Act §607(c)',
    titleEn: 'Brand Owner ("Responsible Person") Cosmetic Product Listing',
    titleZh: '品牌方（Responsible Person）已完成单品配方列名',
    descEn:
      'Facility registration is the manufacturer’s duty, but Product Listing (including full ingredient list and facility FEI links) is the legal responsibility of the Responsible Person whose name appears on the label.',
    descZh:
      '工厂注册归代工厂，但单品列名（含完整成分表与对应工厂 FEI 关联）的法定责任主体是标签上的品牌方（Responsible Person）。',
    amazonTipEn:
      'Must be updated annually; private-label sellers often get suppressed because they assumed their OEM handled product listings.',
    amazonTipZh:
      '单品列名须每年更新。大量贴牌卖家误以为代工厂包办一切，导致在 Amazon 核验时拿不出单品列名回执。',
  },
  {
    id: 'adverse-contact',
    statute: 'FD&C Act §609(a)',
    titleEn: 'U.S. Adverse-Event Contact on Physical Packaging',
    titleZh: '实物外包装已印制美国本土不良事件上报联系方式',
    descEn:
      'Product labels must display a U.S. domestic address, U.S. domestic phone number, or electronic contact information (e.g., dedicated web portal or email) through which the Responsible Person receives consumer adverse event reports.',
    descZh:
      '实物外包装必须清晰印刷美国本土地址、美国本土电话或电子联系方式（如专用反馈网页/邮箱），用于接收消费者不良反应上报。',
    amazonTipEn:
      'Missing U.S. contact info on six-sided packaging photos is an automatic Amazon label review rejection.',
    amazonTipZh:
      '提交六面包装实拍审核时，缺少美国不良事件联系方式会直接触发自动驳回并要求换标。',
  },
  {
    id: 'safety-sub',
    statute: 'FD&C Act §608',
    titleEn: 'Adequate Safety Substantiation Dossier Maintained',
    titleZh: '已留存充分的成品安全评估档案（Safety Substantiation）',
    descEn:
      'The Responsible Person must maintain records demonstrating adequate safety substantiation (toxicological review, RIPT / stability / microbial tests, or qualified safety assessor dossier) before marketing.',
    descZh:
      '上市销售前必须留存完整的成品安全性证明记录（毒理评估、稳定性/微生物测试、安全评估师签字报告等）。',
    amazonTipEn:
      'FDA can demand safety substantiation records during inspections or following serious adverse event reports.',
    amazonTipZh:
      '发生严重不良事件或抽检时，FDA 有权直接调取成品安全证明档案。',
  },
  {
    id: 'sae-sop',
    statute: 'FD&C Act §605',
    titleEn: '15-Business-Day Serious Adverse Event (SAE) Reporting SOP',
    titleZh: '已建立 15 个工作日严重不良事件（SAE）上报机制与 6 年留档',
    descEn:
      'Serious adverse events (hospitalization, infection, significant disfigurement, severe rashes/burns) must be reported to FDA within 15 business days via MedWatch, with records retained for 6 years (3 years for small businesses).',
    descZh:
      '一旦接到严重不良反应（住院、感染、严重毁容/灼伤等），须在 15 个工作日内通过 MedWatch 上报 FDA，全部记录保存 6 年（小微企业 3 年）。',
    amazonTipEn:
      'Monitor negative 1-star Amazon reviews weekly for words like "chemical burn", "swollen eyes", or "ER visit" to catch SAEs early.',
    amazonTipZh:
      '务必每周巡检 Amazon 1 星差评中的“burn / swollen / rash / ER”字样，避免漏报严重不良事件。',
  },
  {
    id: 'no-drug-claims',
    statute: 'FD&C Act §201(g)',
    titleEn: 'Zero Drug Claims & Zero Prohibited 21 CFR 700 Ingredients',
    titleZh: '详情页零药物宣称且不含 21 CFR 700 禁用成分',
    descEn:
      'Confirm listing bullets, A+ graphics, and backend search terms avoid acne/eczema/anti-inflammatory/hair-growth claims, hydroquinone, mercury, and EPA antibacterial triggers.',
    descZh:
      '确保标题、五点、A+ 图片文字及后台关键词完全不含祛痘/湿疹/抗炎/生发/氢醌及 EPA 杀菌词。',
    amazonTipEn:
      'Run every new SKU and A+ revision through RegPulse Listing Scanner prior to upload.',
    amazonTipZh:
      '每次上新或修改 A+ 文案前先过一遍 RegPulse 违禁词体检引擎。',
  },
];

export default function MocraChecklist({ locale = 'en' }: { locale?: Lang }) {
  const lang = resolveLang(locale);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('regpulse_mocra_checks_v1') || '{}');
      if (saved && typeof saved === 'object') setChecked(saved);
    } catch {
      // ignore
    }
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('regpulse_mocra_checks_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const completedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((completedCount / MOCRA_ITEMS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 print-card">
        <div className="min-w-[240px] flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>{lang === 'zh' ? 'MoCRA 2026 合规就绪度评分' : 'MoCRA 2026 Compliance Readiness Score'}</span>
            <span className="tabular-nums text-teal-800">
              {completedCount}/{MOCRA_ITEMS.length} ({pct}%)
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${pct === 100 ? 'bg-emerald-600' : 'bg-teal-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer no-print"
        >
          <FileDown className="w-4 h-4" aria-hidden="true" />
          {lang === 'zh' ? '打印/导出自查表 PDF' : 'Print / Save PDF Checklist'}
        </button>
      </div>

      <div className="space-y-4">
        {MOCRA_ITEMS.map((item) => {
          const isDone = !!checked[item.id];
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 transition-colors print-card ${
                isDone ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  id={`mocra-${item.id}`}
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(item.id)}
                  className="mt-1 h-5 w-5 accent-teal-700 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`mocra-${item.id}`}
                      className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer"
                    >
                      {lang === 'zh' ? item.titleZh : item.titleEn}
                    </label>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      {item.statute}
                    </span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {lang === 'zh' ? item.descZh : item.descEn}
                  </p>
                  <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-950 flex items-start gap-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span>{lang === 'zh' ? item.amazonTipZh : item.amazonTipEn}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
