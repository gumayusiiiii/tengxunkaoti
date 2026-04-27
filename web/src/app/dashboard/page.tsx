'use client';

import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/AppContext';
import { buildChatRequestBody } from '@/lib/chatRequestBody';
import { streamChat } from '@/lib/streamChat';
import type { WeeklyReport } from '@/lib/types';
import { getIsDemoFromStorage } from '@/lib/isDemo';

function getWeekLabel() {
  const now = new Date();
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return `${now.getFullYear()}年第${week}周`;
}

type PushStatus = 'idle' | 'pushing' | 'success' | 'copied' | 'error';

function fmt(n: number) {
  if (!Number.isFinite(n)) return '—';
  return n >= 1000 ? n.toLocaleString() : String(n);
}

function Badge({ children, tone = 'zinc' }: { children: React.ReactNode; tone?: 'zinc' | 'amber' | 'emerald' | 'blue' }) {
  const cls =
    tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    tone === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-zinc-50 text-zinc-600 border-zinc-200';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>{children}</span>;
}

function safeJsonObject(text: string) {
  // 取“最后一个完整配平”的 JSON 对象（支持嵌套对象）
  // 从后往前找：先定位最后一个 '}'，再向前配平 '{'
  const s = text.trim();
  let end = s.lastIndexOf('}');
  while (end !== -1) {
    let depth = 0;
    for (let i = end; i >= 0; i--) {
      const ch = s[i];
      if (ch === '}') depth++;
      else if (ch === '{') {
        depth--;
        if (depth === 0) {
          const candidate = s.slice(i, end + 1);
          try {
            const obj = JSON.parse(candidate);
            if (obj && typeof obj === 'object') return obj;
          } catch {}
          break;
        }
      }
    }
    end = s.lastIndexOf('}', end - 1);
  }
  return null;
}

export default function DashboardPage() {
  const { shopProfile, weeklyReport, setWeeklyReport, planState, campaigns } = useApp();

  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    const sync = () => setIsDemo(getIsDemoFromStorage());
    sync();
    window.addEventListener('xlt-demo-mode', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('xlt-demo-mode', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle');

  const [scope, setScope] = useState<string>('all');

  const selected = useMemo(() => {
    if (scope === 'all') return campaigns ?? [];
    return (campaigns ?? []).filter((c) => c.id === scope);
  }, [campaigns, scope]);

  const agg = useMemo(() => {
    const views = selected.reduce((s, c) => s + (c.views ?? 0), 0);
    const clicks = selected.reduce((s, c) => s + (c.clicks ?? 0), 0);
    const spend = selected.reduce((s, c) => s + (c.spend ?? 0), 0);
    const ctr = views > 0 ? (clicks / views * 100) : null;
    const cpc = clicks > 0 ? (spend / clicks) : null;
    return { views, clicks, spend, ctr, cpc };
  }, [selected]);

  const hasFlowData = (agg.views > 0) || (agg.clicks > 0) || (agg.spend > 0);

  /* 一键周报（自动） */
  const generateReport = async () => {
    if (!shopProfile || !hasFlowData) return;
    setGeneratingReport(true);
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('isDemo') === '1';

    const scopeLabel = scope === 'all'
      ? `全部项目（${selected.length}个）`
      : (selected[0]?.name ? `项目「${selected[0].name}」` : '所选项目');

    const prompt = `你是推广顾问。把“本周投放结果”写成老板一眼能读懂的周报。只用我给的数据，不要编造到店/下单。
店铺：${shopProfile.store_name}；位置：${shopProfile.location}；目标客群：${shopProfile.target_audience}。
范围：${scopeLabel}
流量数据：曝光${agg.views}，点击${agg.clicks}，点击率${agg.ctr !== null ? agg.ctr.toFixed(1) + '%' : '未知'}，花费${agg.spend}元，每次点击成本${agg.cpc !== null ? agg.cpc.toFixed(1) + '元' : '未知'}。
只返回 JSON（不要额外文字）：
{"weekLabel":"${getWeekLabel()}","headline":"12字内的周报标题","kpi":{"views":${agg.views},"clicks":${agg.clicks},"ctr":${agg.ctr === null ? null : Number(agg.ctr.toFixed(2))},"spend":${agg.spend},"cpc":${agg.cpc === null ? null : Number(agg.cpc.toFixed(2))}},"conclusions":["结论1（可验证）","结论2（可执行）"],"action":{"what":"下周只做一件事（12字内）","where":"在哪做（10字内）","check":"怎么验收（16字内）"},"missing":["如果要判断生意结果，缺什么业务数据（如到店/下单/客单价/加微信数），没有就空数组"]}`;

    try {
      let full = '';
      await streamChat({
        body: buildChatRequestBody(shopProfile, [{ role: 'user', content: prompt }], {
          mode: 'task',
          isDemo,
          planState,
          weeklyReport,
          campaigns,
        }),
        firstTokenTimeoutMs: 9000,
        totalTimeoutMs: 75000,
        retryOnce: true,
        onDelta: (d) => { full += d; },
      });

      const obj = safeJsonObject(full) as any;
      if (!obj?.weekLabel) throw new Error('bad_format');
      setWeeklyReport({ ...obj, generatedAt: Date.now() } as WeeklyReport);
    } catch {
      alert('生成失败，请重试');
    } finally {
      setGeneratingReport(false);
    }
  };

  /* 微信推送 */
  const pushReport = async () => {
    if (!weeklyReport || !shopProfile) return;
    setPushStatus('pushing');
    const token = localStorage.getItem('pushplus_token') ?? '';
    const hook  = localStorage.getItem('wechat_webhook_url') ?? '';
    const title = weeklyReport.headline || weeklyReport.summary || '本周复盘';
    const k = weeklyReport.kpi;
    const c = weeklyReport.conclusions ?? [];
    const action = weeklyReport.action;
    const legacyHighlights = weeklyReport.highlights ?? [];
    const legacyIssues = weeklyReport.issues ?? [];
    const legacyNext = weeklyReport.nextAction ?? '';
    const lines = [
      `【${weeklyReport.weekLabel}周报】${shopProfile.store_name}`,
      title,
      k ? `数据：曝光${k.views} / 点击${k.clicks} / 点击率${k.ctr === null ? '—' : k.ctr.toFixed(1) + '%'} / 花费¥${k.spend} / 单次点击¥${k.cpc === null ? '—' : k.cpc.toFixed(1)}` : '',
      c.length ? `结论：\n- ${c.slice(0, 3).join('\n- ')}` : '',
      action ? `下周只做一件事：${action.what}（${action.where}；验收：${action.check}）` : (legacyNext ? `下周只做一件事：${legacyNext}` : ''),
      legacyHighlights.length ? `做对了：\n- ${legacyHighlights.slice(0, 3).join('\n- ')}` : '',
      legacyIssues.length ? `需改进：\n- ${legacyIssues.slice(0, 3).join('\n- ')}` : '',
    ].filter(Boolean);
    const plain = lines.join('\n');
    const report = {
      weekLabel: weeklyReport.weekLabel,
      storeName: shopProfile.store_name,
      headline: weeklyReport.headline,
      summary: weeklyReport.summary,
      kpi: weeklyReport.kpi,
      conclusions: weeklyReport.conclusions,
      action: weeklyReport.action,
      highlights: weeklyReport.highlights,
      issues: weeklyReport.issues,
      nextAction: weeklyReport.nextAction,
      generatedAt: weeklyReport.generatedAt,
    };
    try {
      const res = await fetch('/api/wechat-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { pushplusToken: token, report } : { webhookUrl: hook || undefined, report }) });
      const data = await res.json();
      if (data.success) { setPushStatus('success'); }
      else { await navigator.clipboard.writeText(plain).catch(() => {}); setPushStatus('copied'); }
    } catch { await navigator.clipboard.writeText(plain).catch(() => {}); setPushStatus('copied'); }
    setTimeout(() => setPushStatus('idle'), 4500);
  };

  return (
    <AppLayout title="效果分析" subtitle="自动读数 · AI 解读 · 一键周报">
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">

          {/* 范围选择 */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div>
              <p className="text-sm font-semibold text-zinc-900">选择分析范围</p>
              <p className="text-xs text-zinc-400 mt-1">
                {isDemo
                  ? '从「广告项目库」自动读取曝光/点击/花费等数据（当前为演示模式，含内置样例）。'
                  : '从「广告项目库」自动读取曝光/点击/花费等数据。'}
              </p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-600">项目</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="mt-2 w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value="all">全部项目汇总</option>
                  {(campaigns ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={generateReport}
                  disabled={!hasFlowData || generatingReport}
                  className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-30 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {generatingReport && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />}
                  生成周报
                </button>
              </div>
            </div>
          </div>

          {/* 数据摘要：流量&业务影响（强调链路） */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-zinc-200 rounded-2xl p-4">
              <p className="text-2xl font-bold text-zinc-900">{fmt(agg.views)}</p>
              <p className="text-xs text-zinc-500 mt-1">看到广告的人（曝光）</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-4">
              <p className="text-2xl font-bold text-zinc-900">{fmt(agg.clicks)}</p>
              <p className="text-xs text-zinc-500 mt-1">点进来的人（点击）</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-zinc-900">{agg.ctr === null ? '—' : `${agg.ctr.toFixed(1)}%`}</p>
                {agg.ctr !== null && (
                  <span className={`text-xs font-semibold ${agg.ctr >= 2 ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {agg.ctr >= 2 ? '封面标题有吸引力' : '更像“没人想点”'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">点进来的比例（点击率）</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-4">
              <p className="text-2xl font-bold text-zinc-900">¥{fmt(agg.spend)}</p>
              <p className="text-xs text-zinc-500 mt-1">这段时间广告花费</p>
            </div>
          </div>

          {/* 周报卡 */}
          <div className="space-y-4">
            {generatingReport ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center gap-3">
                <span className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">AI 正在整理本周情况…</p>
              </div>
            ) : weeklyReport ? (
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-zinc-500">{weeklyReport.weekLabel}</p>
                      <p className="text-base font-bold text-zinc-900 mt-0.5">
                        {weeklyReport.headline || weeklyReport.summary || '本周复盘'}
                      </p>
                    </div>
                    {!!weeklyReport.missing?.length && (
                      <Badge tone="amber">缺业务数据</Badge>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {weeklyReport.kpi && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="bg-white border border-zinc-200 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">曝光</p>
                        <p className="text-lg font-bold text-zinc-900 mt-0.5">{fmt(weeklyReport.kpi.views)}</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">点击</p>
                        <p className="text-lg font-bold text-zinc-900 mt-0.5">{fmt(weeklyReport.kpi.clicks)}</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">点击率</p>
                        <p className="text-lg font-bold text-zinc-900 mt-0.5">{weeklyReport.kpi.ctr === null ? '—' : `${weeklyReport.kpi.ctr.toFixed(1)}%`}</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">花费</p>
                        <p className="text-lg font-bold text-zinc-900 mt-0.5">¥{fmt(weeklyReport.kpi.spend)}</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">单次点击</p>
                        <p className="text-lg font-bold text-zinc-900 mt-0.5">{weeklyReport.kpi.cpc === null ? '—' : `¥${weeklyReport.kpi.cpc.toFixed(1)}`}</p>
                      </div>
                    </div>
                  )}

                  {weeklyReport.conclusions?.length ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">结论（可验证）</p>
                      <ul className="space-y-1.5">
                        {weeklyReport.conclusions.slice(0, 3).map((x, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <>
                      {!!weeklyReport.highlights?.length && (
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">做对了</p>
                          <ul className="space-y-1.5">
                            {weeklyReport.highlights.slice(0, 3).map((h, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"><path fillRule="evenodd" d="M13.707 3.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 9.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!!weeklyReport.issues?.length && (
                        <div>
                          <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-2">需要改进</p>
                          <ul className="space-y-1.5">
                            {weeklyReport.issues.slice(0, 3).map((issue, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-orange-400 shrink-0 mt-0.5"><path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 018 2zm0 10a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {(weeklyReport.action || weeklyReport.nextAction) && (
                    <div className="bg-zinc-900 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">下周只做这一件事</p>
                      {weeklyReport.action ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{weeklyReport.action.what}</p>
                          <p className="text-xs text-zinc-300">在哪：{weeklyReport.action.where} · 验收：{weeklyReport.action.check}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-white">{weeklyReport.nextAction}</p>
                      )}
                    </div>
                  )}

                  {!!weeklyReport.missing?.length && (
                    <div className="flex flex-wrap gap-2">
                      {weeklyReport.missing.slice(0, 4).map((m, i) => (
                        <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                          还缺：{m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-zinc-900">还没有周报</p>
                <p className="text-xs text-zinc-400 mt-1">点击上方“生成周报”，AI 会基于项目库数据自动输出复盘。</p>
              </div>
            )}

            {weeklyReport && !generatingReport && (
              <div className="space-y-2.5">
                <button
                  onClick={pushReport}
                  disabled={pushStatus === 'pushing'}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                    pushStatus === 'success' ? 'bg-emerald-500 text-white' :
                    pushStatus === 'copied'  ? 'bg-blue-500 text-white' :
                    pushStatus === 'error'   ? 'bg-red-500 text-white' :
                    'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {pushStatus === 'pushing' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {pushStatus === 'idle'    && (
                    <>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15">
                        <svg viewBox="0 0 64 64" className="w-4 h-4" aria-hidden="true">
                          <circle cx="32" cy="32" r="30" fill="#07C160" />
                          <path
                            d="M22.5 17.5c-8 0-14.5 5.4-14.5 12.1 0 3.7 2 7.1 5.4 9.4l-1.4 5.3 6-3.1c1.4.3 2.9.5 4.5.5 8 0 14.5-5.4 14.5-12.1S30.5 17.5 22.5 17.5z"
                            fill="#FFFFFF"
                            opacity="0.95"
                          />
                          <path
                            d="M41.2 27c-6.8 0-12.3 4.6-12.3 10.3 0 3.1 1.7 6 4.6 7.9l-1.1 4.5 5.1-2.6c1.2.3 2.4.4 3.7.4 6.8 0 12.3-4.6 12.3-10.3S48 27 41.2 27z"
                            fill="#FFFFFF"
                            opacity="0.9"
                          />
                          <circle cx="18.8" cy="29.2" r="1.5" fill="#07C160" />
                          <circle cx="25.2" cy="29.2" r="1.5" fill="#07C160" />
                          <circle cx="37.8" cy="37" r="1.3" fill="#07C160" />
                          <circle cx="43.2" cy="37" r="1.3" fill="#07C160" />
                        </svg>
                      </span>
                      推送到微信
                    </>
                  )}
                  {pushStatus === 'pushing' && '推送中…'}
                  {pushStatus === 'success' && '✓ 推送成功！'}
                  {pushStatus === 'copied'  && '已复制到剪贴板'}
                  {pushStatus === 'error'   && '推送失败，请重试'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
