import React, { useMemo, useState } from 'react';
import { BellRing, ExternalLink, Search } from 'lucide-react';
import type { WarningLetterRecord } from '../engine/scanner';
import { resolveLang, type Lang } from '../lib/config';

interface Props {
  letters: WarningLetterRecord[];
  basePath: string;
  locale?: Lang;
}

const WL_VERTICALS = [
  { value: 'All', en: 'All FDA Offices & Verticals', zh: '全部 FDA 执法中心/行业' },
  { value: 'Dietary Supplements & Foods', en: 'Dietary Supplements & Foods', zh: '膳食补充剂与食品' },
  { value: 'OTC & Pharma / Drugs', en: 'OTC & Pharma / Drugs (CDER)', zh: 'OTC 药品与药企 (CDER)' },
  { value: 'Medical & Beauty Devices', en: 'Medical & Beauty Devices (CDRH)', zh: '医疗与美容器械 (CDRH)' },
  { value: 'Cosmetics & Skincare', en: 'Cosmetics & Skincare', zh: '美妆护肤' },
  { value: 'Animal & Pet Products', en: 'Animal & Pet Products (CVM)', zh: '宠物与动物产品 (CVM)' },
  { value: 'Tobacco & Vaping', en: 'Tobacco & Vaping', zh: '烟草与电子烟' },
  { value: 'General FDA Enforcement', en: 'FSVP & General Enforcement', zh: 'FSVP 进口商与综合执法' },
];

const WL_VERTICAL_ZH: Record<string, string> = {
  'Dietary Supplements & Foods': '膳食补充剂与食品',
  'OTC & Pharma / Drugs': 'OTC 药品与药企',
  'Medical & Beauty Devices': '医疗/美容器械',
  'Cosmetics & Skincare': '美妆护肤',
  'Animal & Pet Products': '宠物与兽药',
  'Tobacco & Vaping': '烟草与电子烟',
  'General FDA Enforcement': 'FSVP/综合执法',
};

export default function WarningLettersExplorer({ letters, basePath, locale = 'en' }: Props) {
  const lang = resolveLang(locale);
  const [query, setQuery] = useState('');
  const [vertical, setVertical] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(40);

  const withBase = (path: string) => {
    const clean = basePath.replace(/\/$/, '');
    return `${clean}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return letters.filter((wl) => {
      if (vertical !== 'All' && wl.vertical !== vertical) return false;
      if (tagFilter === 'ChinaOEM' && !wl.riskTags.includes('China / Cross-Border Firm')) return false;
      if (tagFilter === 'OTC' && !wl.riskTags.includes('OTC Monograph Violation')) return false;
      if (tagFilter === 'Unapproved' && !wl.riskTags.includes('Unapproved New Drugs')) return false;
      if (tagFilter === 'CGMP' && !wl.riskTags.includes('CGMP / Adulterated')) return false;
      if (q) {
        const hay = `${wl.companyName} ${wl.subject} ${wl.issuingOffice} ${wl.cmsId} ${wl.riskTags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [letters, query, vertical, tagFilter]);

  const shown = filtered.slice(0, visibleCount);

  const triggerWatch = (firmName: string) => {
    window.dispatchEvent(
      new CustomEvent('regpulse:open-watchlist', {
        detail: {
          plan: lang === 'zh' ? 'FDA 实时预警季卡 (¥199/季)' : 'Watchlist Radar Pro ($29/mo)',
          prefillKeywords: firmName,
        },
      })
    );
  };

  return (
    <div className="space-y-5">
      <search className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-5">
            <label htmlFor="wl-search-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh'
                ? '检索被警告企业 / 代工厂名 / 违规主题 / CMS 编号'
                : 'Search Company / OEM Name, Subject, Office, or CMS #'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="wl-search-input"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(40);
                }}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={lang === 'zh' ? '例如：Shenzhen, OTC, CGMP, Unapproved, Device...' : 'e.g., OTC, CGMP, Unapproved, Supplement, Device...'}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="wl-vertical-select" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '执法垂直领域' : 'Enforcement Vertical'}
            </label>
            <select
              id="wl-vertical-select"
              value={vertical}
              onChange={(e) => {
                setVertical(e.target.value);
                setVisibleCount(40);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
            >
              {WL_VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>
                  {lang === 'zh' ? v.zh : v.en}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="wl-tag-select" className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '快捷违规专题筛选' : 'Violation Filter'}
            </label>
            <select
              id="wl-tag-select"
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
            >
              <option value="All">{lang === 'zh' ? '全部警告信' : 'All Violations'}</option>
              <option value="OTC">{lang === 'zh' ? 'OTC 专论违规' : 'OTC Monograph Violations'}</option>
              <option value="Unapproved">{lang === 'zh' ? '未获批新药宣称' : 'Unapproved New Drugs'}</option>
              <option value="CGMP">{lang === 'zh' ? 'CGMP / 掺假缺陷' : 'CGMP / Adulterated'}</option>
              <option value="ChinaOEM">{lang === 'zh' ? '中国/跨境涉事工厂' : 'Overseas / Foreign Manufacturers'}</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span role="status" aria-live="polite">
            {lang === 'zh'
              ? `当前匹配 ${filtered.length} 封 FDA 官方警告信（展示前 ${shown.length} 封）`
              : `Showing ${shown.length} of ${filtered.length} live official FDA Warning Letters`}
          </span>
          {(query || vertical !== 'All' || tagFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setVertical('All');
                setTagFilter('All');
              }}
              className="font-semibold text-teal-700 hover:underline cursor-pointer"
            >
              {lang === 'zh' ? '重置筛选' : 'Reset filters'}
            </button>
          )}
        </div>
      </search>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby="wl-table-caption"
        className="rp-table-wrapper shadow-sm"
      >
        <table className="rp-table">
          <caption id="wl-table-caption" className="visually-hidden">
            Live Official FDA Warning Letters Enforcement Database
          </caption>
          <thead>
            <tr>
              <th scope="col">{lang === 'zh' ? '涉事企业与官方编号' : 'Company & FDA CMS ID'}</th>
              <th scope="col">{lang === 'zh' ? '执法部门与类目' : 'Issuing Office & Vertical'}</th>
              <th scope="col">{lang === 'zh' ? 'FDA 违规主题与标签' : 'Statutory Violation Subject'}</th>
              <th scope="col">{lang === 'zh' ? '公示 / 签发日' : 'Posted / Issued'}</th>
              <th scope="col">{lang === 'zh' ? '操作与原文' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {lang === 'zh' ? '未找到匹配的 FDA 警告信。' : 'No matching FDA Warning Letters found.'}
                </td>
              </tr>
            ) : (
              shown.map((wl) => (
                <tr key={wl.id} className="rp-feed-card">
                  <th scope="row" className="font-semibold text-slate-900 max-w-[260px]">
                    <div className="leading-snug">{wl.companyName}</div>
                    {wl.cmsId && (
                      <div className="mt-1 font-mono text-[11px] font-normal text-slate-500">
                        CMS #{wl.cmsId}
                      </div>
                    )}
                  </th>
                  <td data-label={lang === 'zh' ? '执法部门与类目' : 'Issuing Office & Vertical'}>
                    <span className="inline-flex items-center rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-teal-900">
                      {lang === 'zh' ? WL_VERTICAL_ZH[wl.vertical] || wl.vertical : wl.vertical}
                    </span>
                    <div className="mt-1 text-[11px] text-slate-500 max-w-[220px] leading-snug">
                      {wl.issuingOffice}
                    </div>
                  </td>
                  <td data-label={lang === 'zh' ? 'FDA 违规主题与标签' : 'Statutory Violation Subject'} className="max-w-md">
                    <p className="text-xs text-slate-800 leading-relaxed">{wl.subject}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {wl.riskTags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            tag === 'China / Cross-Border Firm'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tag === 'China / Cross-Border Firm' && lang === 'en' ? 'Foreign / Overseas Firm' : tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td data-label={lang === 'zh' ? '公示 / 签发日' : 'Posted / Issued'} className="whitespace-nowrap font-mono text-xs text-slate-600">
                    <div>{wl.postedDate}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'zh' ? '签发 ' : 'Issued '}
                      {wl.letterIssueDate}
                    </div>
                  </td>
                  <td data-label={lang === 'zh' ? '操作与原文' : 'Actions'} className="whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 text-xs">
                      {lang === 'en' && (
                        <a
                          href={withBase(`/warning-letters/${wl.id}/`)}
                          className="font-semibold text-teal-700 hover:underline"
                        >
                          View Brief →
                        </a>
                      )}
                      <a
                        href={wl.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        {lang === 'zh' ? 'FDA 警告信全文' : 'Official Letter'}{' '}
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => triggerWatch(wl.companyName)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800 cursor-pointer text-left"
                      >
                        <BellRing className="w-3 h-3" aria-hidden="true" />
                        {lang === 'zh' ? '监控类似企业' : 'Track Firm'}
                      </button>
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
              ? `加载更多（剩余 ${filtered.length - visibleCount} 封）`
              : `Load More (${filtered.length - visibleCount} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
