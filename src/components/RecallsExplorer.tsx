import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { RecallRecord } from '../engine/scanner';
import { getInitialLang, type Lang } from '../lib/config';

interface Props {
  recalls: RecallRecord[];
  basePath: string;
}

const VERTICALS = [
  'All',
  'Dietary Supplements',
  'Cosmetics & Skincare',
  'Medical & Beauty Devices',
  'OTC & Unapproved Drugs',
  'Food & Consumables',
];

const CLASSES = ['All', 'Class I', 'Class II', 'Class III'];

export default function RecallsExplorer({ recalls, basePath }: Props) {
  const [lang, setLang] = useState<Lang>('en');
  const [query, setQuery] = useState('');
  const [vertical, setVertical] = useState('All');
  const [classification, setClassification] = useState('All');
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    setLang(getInitialLang());
    const handler = (ev: Event) => {
      const next = (ev as CustomEvent<Lang>).detail;
      if (next === 'en' || next === 'zh') setLang(next);
    };
    window.addEventListener('regpulse:lang', handler);
    return () => window.removeEventListener('regpulse:lang', handler);
  }, []);

  const withBase = (path: string) => {
    const clean = basePath.replace(/\/$/, '');
    return `${clean}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recalls.filter((r) => {
      if (vertical !== 'All' && r.vertical !== vertical) return false;
      if (classification !== 'All' && r.classification !== classification) return false;
      if (q) {
        const hay = `${r.recallingFirm} ${r.productDescription} ${r.reasonForRecall} ${r.recallNumber} ${r.riskTags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recalls, query, vertical, classification]);

  const shown = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-5">
      <search className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-6">
            <label htmlFor="recall-search-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh'
                ? '检索供应商 / 成分 / 违规原因 / 召回编号'
                : 'Search Recalling Firm, Ingredient, Violation Reason, or Recall #'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="recall-search-input"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(40);
                }}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={lang === 'zh' ? '例如：sildenafil, lead, lotion, unapproved...' : 'e.g., sildenafil, undeclared, lotion, salmonella...'}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="recall-vertical-select" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '产品行业类目' : 'Product Vertical'}
            </label>
            <select
              id="recall-vertical-select"
              value={vertical}
              onChange={(e) => {
                setVertical(e.target.value);
                setVisibleCount(40);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="recall-class-select" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? 'FDA 召回等级' : 'FDA Class'}
            </label>
            <select
              id="recall-class-select"
              value={classification}
              onChange={(e) => {
                setClassification(e.target.value);
                setVisibleCount(40);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span role="status" aria-live="polite">
            {lang === 'zh'
              ? `当前匹配 ${filtered.length} 条真实 openFDA 执法记录（展示前 ${shown.length} 条）`
              : `Showing ${shown.length} of ${filtered.length} matching live openFDA enforcement records`}
          </span>
          {(query || vertical !== 'All' || classification !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setVertical('All');
                setClassification('All');
              }}
              className="font-semibold text-teal-700 hover:underline cursor-pointer"
            >
              {lang === 'zh' ? '重置筛选' : 'Reset filters'}
            </button>
          )}
        </div>
      </search>

      {/* Responsive accessible table following modern-web-guidance: responsive-table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="recalls-table-caption"
        className="rp-table-wrapper shadow-sm"
      >
        <table className="rp-table">
          <caption id="recalls-table-caption" className="visually-hidden">
            Live openFDA Enforcement and Recall Records
          </caption>
          <thead>
            <tr>
              <th scope="col">{lang === 'zh' ? '涉事企业 / 编号' : 'Recalling Firm / #'}</th>
              <th scope="col">{lang === 'zh' ? '等级与类目' : 'Class & Vertical'}</th>
              <th scope="col">{lang === 'zh' ? '违规召回原因' : 'Reason for Recall'}</th>
              <th scope="col">{lang === 'zh' ? '报告日期' : 'Report Date'}</th>
              <th scope="col">{lang === 'zh' ? '详情与官方源' : 'Audit Detail'}</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {lang === 'zh' ? '未找到匹配的召回记录。' : 'No matching FDA enforcement records found.'}
                </td>
              </tr>
            ) : (
              shown.map((rec) => (
                <tr key={rec.id} className="rp-feed-card">
                  <th scope="row" className="font-semibold text-slate-900 max-w-[240px]">
                    <div className="leading-snug">{rec.recallingFirm}</div>
                    <div className="mt-1 font-mono text-[11px] font-normal text-slate-500">
                      {rec.recallNumber} • {rec.state || rec.country || 'USA'}
                    </div>
                  </th>
                  <td data-label={lang === 'zh' ? '等级与类目' : 'Class & Vertical'}>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        rec.classification === 'Class I'
                          ? 'bg-red-100 text-red-900'
                          : rec.classification === 'Class II'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.classification}
                    </span>
                    <div className="mt-1 text-xs text-slate-600">{rec.vertical}</div>
                  </td>
                  <td data-label={lang === 'zh' ? '违规召回原因' : 'Reason for Recall'} className="max-w-md">
                    <p className="text-xs text-slate-800 leading-relaxed line-clamp-3">
                      {rec.reasonForRecall}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {rec.riskTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td data-label={lang === 'zh' ? '报告日期' : 'Report Date'} className="whitespace-nowrap font-mono text-xs text-slate-600">
                    {rec.reportDate}
                  </td>
                  <td data-label={lang === 'zh' ? '详情与官方源' : 'Audit Detail'} className="whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 text-xs">
                      <a
                        href={withBase(`/recalls/${rec.id}/`)}
                        className="font-semibold text-teal-700 hover:underline"
                      >
                        {lang === 'zh' ? '完整档案 →' : 'View Brief →'}
                      </a>
                      <a
                        href={rec.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline"
                      >
                        openFDA <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > visibleCount && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 40)}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            {lang === 'zh'
              ? `加载更多（剩余 ${filtered.length - visibleCount} 条）`
              : `Load More (${filtered.length - visibleCount} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
