'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { buildChatRequestBody } from '@/lib/chatRequestBody';
import Sidebar from '@/components/Sidebar';
import FloatingChat from '@/components/FloatingChat';
import type { CampaignRecord, ShopProfile } from '@/lib/types';
import { DEMO_PROFILE, DEMO_CHAT, DEMO_PLAN, DEMO_CAMPAIGNS, DEMO_WEEKLY_REPORT } from '@/lib/demoData';
import { applyTheme, type ThemeMode } from '@/components/ThemeClient';
import AdCaseShowcase from '@/components/AdCaseShowcase';
import { notifyDemoModeChanged } from '@/lib/isDemo';

/* ─────────── 登录视图 ─────────── */
function LoginView({ onLogin, onDemo }: { onLogin: () => void; onDemo: () => void }) {
  const [loading, setLoading] = useState<'wechat' | 'qq' | null>(null);

  const handleLogin = (type: 'wechat' | 'qq') => {
    setLoading(type);
    setTimeout(() => { setLoading(null); onLogin(); }, 1200);
  };

  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-900">小推</p>
          <p className="text-xs text-zinc-400">AI 广告助手</p>
        </div>
      </div>

      {/* 登录卡片 */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-100 w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-zinc-900 text-center mb-1.5">欢迎使用小推</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">为小店老板设计的 AI 广告助手</p>

        {/* 登录按钮 */}
        <div className="space-y-3">
          <button
            onClick={() => handleLogin('wechat')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#07C160] hover:bg-[#06AD56] text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading === 'wechat' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
              </svg>
            )}
            微信登录
          </button>

          <button
            onClick={() => handleLogin('qq')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#12B7F5] hover:bg-[#0FA8E0] text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading === 'qq' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.297 1.094.668 1.094.304 0 .614-.24.87-.837C5.5 19.154 6.65 20 8.2 20c0 0 .828-1 2-1.5V17c-2-1-3-3-3-5 0 0 1 1 4 1s4-1 4-1c0 2-1 4-3 5v1.5c1.172.5 2 1.5 2 1.5 1.55 0 2.7-.846 3.11-2.267.257.597.567.837.871.837.37 0 .668-.43.668-1.094 0-2.514-2.163-6.954-2.163-6.954V9.325C20.29 3.364 16.268 2 12.003 2z"/>
              </svg>
            )}
            QQ 登录
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-zinc-400">或者</span>
          </div>
        </div>

        <button
          onClick={onDemo}
          className="w-full py-3 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors active:scale-[0.98]"
        >
          使用演示模式体验
        </button>

        <p className="text-[11px] text-zinc-300 text-center mt-5 leading-relaxed">
          登录即代表你同意使用条款 · 数据仅存储在本地
        </p>
      </div>
    </div>
  );
}

/* ─────────── 建档向导 ─────────── */
const SETUP_STEPS = [
  {
    key: 'store_name' as const,
    emoji: '🏪',
    q: '你的店叫什么名字？',
    hint: '填一个顾客记得住的名字就行',
    type: 'text' as const,
    placeholder: '例：老街包子铺',
  },
  {
    key: 'store_type' as const,
    emoji: '🧁',
    q: '主要卖什么？',
    hint: '最多选 3 个，也可以自己加',
    type: 'tags' as const,
    max: 3,
    options: ['面包', '蛋糕', '甜品', '饼干点心', '咖啡饮品', '早餐/下午茶', '节日礼盒', '低糖/控糖', '儿童款', '定制款', '手工现烤', '外卖配送'],
    allowCustom: true,
    customPlaceholder: '其他品类…',
  },
  {
    key: 'location' as const,
    emoji: '📍',
    q: '店在哪里？',
    hint: '写区域或小区名就够，AI 会用来生成本地化建议',
    type: 'location' as const,
    placeholder: '例：深圳 南山区 科兴科学园',
  },
  {
    key: 'target_audience' as const,
    emoji: '👥',
    q: '你最想吸引哪些人？',
    hint: '最多选 3 个，选你最想拿下的那些人',
    type: 'tags' as const,
    max: 3,
    options: ['附近上班族', '学生党', '宝妈/带娃', '情侣约会', '小区住户', '写字楼白领', '追求性价比', '看重低糖健康', '爱拍照打卡', '有送礼需求', '生日聚会'],
    allowCustom: true,
    customPlaceholder: '其他人群…',
  },
  {
    key: 'monthly_budget' as const,
    emoji: '💰',
    q: '每月推广预算大概多少？',
    hint: '没有对错，让 AI 给你更合适的建议',
    type: 'tags' as const,
    max: 1,
    options: ['随便先试试', '≤300 元/月', '300–800 元/月', '800–2000 元/月', '2000 元以上'],
    allowCustom: false,
  },
  {
    key: 'stated_goal' as const,
    emoji: '🎯',
    q: '你最想解决哪个问题？',
    hint: '最多选 2 个，选你最痛的那个',
    type: 'tags' as const,
    max: 2,
    options: ['吸引附近新顾客', '让老顾客回头', '节日促销冲销量', '推广某个主打产品', '提升品牌知名度', '增加外卖/到店订单', '不知道从哪里开始'],
    allowCustom: true,
    customPlaceholder: '其他需求…',
  },
];

type SetupAnswers = Partial<Record<string, string>>;

function SetupWizard({ onComplete, onDemo }: { onComplete: (p: ShopProfile) => void; onDemo: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SetupAnswers>({});
  const [textVal, setTextVal] = useState('');
  const [locVal, setLocVal] = useState('');
  const [locSuggestions, setLocSuggestions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [entering, setEntering] = useState(true);
  const locTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cur = SETUP_STEPS[step];
  const total = SETUP_STEPS.length;

  // 初始化当前步骤的 text 值
  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 20);
    if (cur.type === 'text') setTextVal(answers[cur.key] ?? '');
    if (cur.type === 'location') setLocVal(answers[cur.key] ?? '');
    setCustomInput('');
    return () => clearTimeout(t);
  }, [step]);

  // 位置搜索
  const searchLoc = useCallback((q: string) => {
    if (locTimer.current) clearTimeout(locTimer.current);
    if (!q.trim()) { setLocSuggestions([]); return; }
    locTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setLocSuggestions(data.suggestions ?? []);
      } catch { setLocSuggestions([]); }
    }, 350);
  }, []);

  const getTagsForStep = (key: string): string[] => {
    const v = answers[key];
    if (!v) return [];
    return v.split('、').filter(Boolean);
  };

  const toggleTag = (key: string, tag: string, max: number) => {
    const cur = getTagsForStep(key);
    const next = cur.includes(tag)
      ? cur.filter((t) => t !== tag)
      : cur.length < max ? [...cur, tag] : cur;
    setAnswers((p) => ({ ...p, [key]: next.join('、') }));
  };

  const addCustom = (key: string, max: number) => {
    const val = customInput.trim();
    if (!val) return;
    const cur = getTagsForStep(key);
    if (cur.length < max && !cur.includes(val)) {
      setAnswers((p) => ({ ...p, [key]: [...cur, val].join('、') }));
    }
    setCustomInput('');
  };

  const canNext = () => {
    const v = answers[cur.key];
    if (cur.type === 'text') return !!(textVal.trim());
    if (cur.type === 'location') return !!(locVal.trim());
    return !!(v && v.trim());
  };

  const goNext = () => {
    // 保存当前步骤值
    if (cur.type === 'text') setAnswers((p) => ({ ...p, [cur.key]: textVal.trim() }));
    if (cur.type === 'location') setAnswers((p) => ({ ...p, [cur.key]: locVal.trim() }));
    if (step < total - 1) { setStep((s) => s + 1); }
    else { finish(); }
  };

  const finish = () => {
    const a = { ...answers };
    if (cur.type === 'text') a[cur.key] = textVal.trim();
    if (cur.type === 'location') a[cur.key] = locVal.trim();
    const profile: ShopProfile = {
      store_name:         a.store_name         ?? '',
      store_type:         a.store_type         ?? '',
      location:           a.location           ?? '',
      surroundings:       a.surroundings       ?? '',
      main_products:      a.main_products      ?? '',
      price_range:        a.price_range        ?? '',
      target_audience:    a.target_audience    ?? '',
      monthly_budget:     a.monthly_budget     ?? '',
      current_platforms:  a.current_platforms  ?? '',
      past_promotions:    a.past_promotions    ?? '',
      stated_goal:        a.stated_goal        ?? '',
      owner_selling_points: a.owner_selling_points ?? '',
    };
    onComplete(profile);
  };

  const tags = cur.type === 'tags' ? getTagsForStep(cur.key) : [];
  const isLast = step === total - 1;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-10">
      {/* 进度条 */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400">建立店铺档案</span>
          <span className="text-xs text-zinc-400">{step + 1} / {total}</span>
        </div>
        <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${((step + 1) / total) * 100}%`, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }}
          />
        </div>
      </div>

      {/* 问题卡片 */}
      <div
        className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-7 shadow-lg shadow-zinc-100"
        style={{
          opacity: entering ? 0 : 1,
          transform: entering ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 280ms ease, transform 280ms cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {/* 表情 + 问题 */}
        <div className="mb-6">
          <span className="text-3xl">{cur.emoji}</span>
          <h2 className="text-lg font-bold text-zinc-900 mt-2 leading-snug">{cur.q}</h2>
          <p className="text-xs text-zinc-400 mt-1">{cur.hint}</p>
        </div>

        {/* 文本输入 */}
        {cur.type === 'text' && (
          <input
            autoFocus
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canNext() && goNext()}
            placeholder={cur.placeholder}
            className="w-full border border-zinc-200 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-300 outline-none transition-colors bg-zinc-50"
          />
        )}

        {/* 位置搜索 */}
        {cur.type === 'location' && (
          <div className="relative">
            <input
              autoFocus
              value={locVal}
              onChange={(e) => { setLocVal(e.target.value); searchLoc(e.target.value); }}
              placeholder={cur.placeholder}
              className="w-full border border-zinc-200 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-300 outline-none transition-colors bg-zinc-50"
            />
            {locSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-2xl shadow-lg overflow-hidden z-10">
                {locSuggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setLocVal(s); setLocSuggestions([]); }}
                    className="w-full text-left text-sm text-zinc-700 px-4 py-2.5 hover:bg-zinc-50 transition-colors"
                  >
                    📍 {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标签选择 */}
        {cur.type === 'tags' && 'options' in cur && (
          <div>
            <div className="flex flex-wrap gap-2">
              {cur.options.map((opt) => {
                const selected = tags.includes(opt);
                const maxed = !selected && tags.length >= cur.max;
                return (
                  <button
                    key={opt}
                    onClick={() => toggleTag(cur.key, opt, cur.max)}
                    disabled={maxed}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-95 ${
                      selected
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : maxed
                        ? 'border-zinc-100 text-zinc-300 bg-zinc-50 cursor-not-allowed'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    {selected && <span className="mr-1 text-xs">✓</span>}
                    {opt}
                  </button>
                );
              })}
            </div>

            {cur.allowCustom && tags.length < cur.max && (
              <div className="mt-3 flex gap-2">
                <input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom(cur.key, cur.max)}
                  placeholder={cur.customPlaceholder}
                  className="flex-1 border border-dashed border-zinc-300 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder-zinc-300 outline-none transition-colors bg-transparent"
                />
                <button
                  onClick={() => addCustom(cur.key, cur.max)}
                  disabled={!customInput.trim()}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors"
                >
                  添加
                </button>
              </div>
            )}

            {tags.length > 0 && (
              <p className="text-xs text-zinc-400 mt-2.5">
                已选：{tags.map((t) => (
                  <button key={t} onClick={() => toggleTag(cur.key, t, cur.max)} className="inline-flex items-center gap-0.5 ml-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                    {t} <span className="text-[10px]">×</span>
                  </button>
                ))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="w-full max-w-md mt-5 flex items-center justify-between">
        <button
          onClick={() => step > 0 && setStep((s) => s - 1)}
          disabled={step === 0}
          className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-0"
        >
          ← 上一步
        </button>
        <button
          onClick={goNext}
          disabled={!canNext()}
          className="px-8 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-2xl hover:bg-zinc-700 disabled:opacity-30 transition-all active:scale-[0.97]"
        >
          {isLast ? '完成建档 →' : '下一步 →'}
        </button>
      </div>

      <button onClick={onDemo} className="mt-4 text-xs text-zinc-300 hover:text-zinc-500 transition-colors">
        先看演示案例
      </button>
    </div>
  );
}

/* ─────────── 新建广告项目 Modal ─────────── */
/* ══════════ 广告创建向导 常量 ══════════ */
const MARKET_OBJS = [
  { id: '商品销售', desc: '推动产品直接购买，提升销售额' },
  { id: '品牌宣传', desc: '提升店铺知名度，建立口碑形象' },
  { id: '加粉互动', desc: '积累粉丝私域，提高用户互动' },
];
const PRODUCT_TAGS = [
  '手工面包', '定制蛋糕', '饼干曲奇', '咖啡饮品', '节日礼盒', '低糖健康',
  '新品上市', '优惠套餐', '外卖配送', '堂食体验', '生日蛋糕', '下午茶套餐',
  '婚礼蛋糕', '网红爆款', '营养早餐', '儿童甜品',
];
const CARRIERS = ['Android', 'iOS', '页面跳转', '视频号', '公众号'];
const PLACEMENTS = [
  { id: 'moments',   name: '朋友圈',    desc: '日活12亿社交广告位', bg: '#07C160', ltype: 'wechat' },
  { id: 'channels',  name: '微信视频号', desc: '短视频信息流高完播', bg: '#07C160', ltype: 'channels' },
  { id: 'qqbrowser', name: '腾讯浏览器', desc: '搜索场景精准触达',   bg: '#1677FF', ltype: 'browser' },
  { id: 'qq',        name: 'QQ',        desc: '年轻用户聚集平台',   bg: '#1677FF', ltype: 'qq' },
  { id: 'qqmusic',   name: 'QQ音乐',    desc: '音乐场景伴随广告',   bg: '#2DC84D', ltype: 'music' },
  { id: 'txvideo',   name: '腾讯视频',   desc: '长视频贴片高品质',  bg: '#00B4C5', ltype: 'video' },
];
const AGE_OPTS    = ['不限', '18-24岁', '25-34岁', '35-44岁', '45岁以上'];
const GENDER_OPTS = ['不限', '男性', '女性'];
const EDU_OPTS    = ['不限', '高中及以下', '大专', '本科', '研究生及以上'];
const DAILY_BUDGETS = ['暂不设置', '≤50元/天', '50-200元/天', '200-500元/天', '500元+/天'];
const TOTAL_BUDGETS = ['暂不设置', '≤300元',   '300-800元',   '800-2000元',   '2000元以上'];

/* 平台图标 */
function PlatLogo({ ltype, size = 18 }: { ltype: string; size?: number }) {
  const s = size;
  if (ltype === 'wechat' || ltype === 'channels') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white">
      {ltype === 'channels'
        ? <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/>
        : <path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 1.9.94 3.61 2.46 4.82L4 17l2.08-1.04C7 16.31 8.2 16.5 9.5 16.5c.25 0 .5-.01.75-.03C10.09 16 10 15.5 10 15c0-2.76 2.69-5 6-5 .25 0 .5.01.75.03C16.02 7.22 13.14 4 9.5 4zm-2 3.75a.75.75 0 110 1.5.75.75 0 010-1.5zm3.5 0a.75.75 0 110 1.5.75.75 0 010-1.5zM16 11c-2.76 0-5 1.79-5 4s2.24 4 5 4c.6 0 1.17-.1 1.69-.28L20 20l-.38-1.62A3.97 3.97 0 0021 15c0-2.21-2.24-4-5-4zm-1.5 2.75a.75.75 0 110 1.5.75.75 0 010-1.5zm3 0a.75.75 0 110 1.5.75.75 0 010-1.5z"/>
      }
    </svg>
  );
  if (ltype === 'qq') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white">
      <path d="M12 2C7.5 2 4 5.6 4 10c0 2.4 1 4.6 2.6 6.1L6 19l3-1.5c1 .3 2 .5 3 .5s2-.2 3-.5L18 19l-.6-2.9C18.9 14.6 20 12.4 20 10c0-4.4-3.6-8-8-8zM9.5 11.5a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
  );
  if (ltype === 'music') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white">
      <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
    </svg>
  );
  if (ltype === 'browser') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
  /* video */
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

/* ══════════ 新建广告项目（4步向导） ══════════ */
function NewCampaignModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (c: CampaignRecord) => void;
}) {
  const { shopProfile, planState, weeklyReport, campaigns } = useApp();
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [marketObj,   setMarketObj]   = useState('');
  const [selProducts, setSelProducts] = useState<string[]>([]);
  const [selCarriers, setSelCarriers] = useState<string[]>([]);

  /* Step 2 */
  const [selPlacements, setSelPlacements] = useState<string[]>([]);
  const [aiAnalyzing,   setAiAnalyzing]   = useState(false);
  const [aiSuggestion,  setAiSuggestion]  = useState('');

  /* Step 3 */
  const [ageRange, setAgeRange] = useState('不限');
  const [gender,   setGender]   = useState('不限');
  const [selEdu,   setSelEdu]   = useState<string[]>(['不限']);
  const [location, setLocation] = useState(
    shopProfile?.location ? shopProfile.location.split(' ')[0] : '深圳'
  );

  /* Step 4 */
  const [projName,    setProjName]    = useState('');
  const [budgetType,  setBudgetType]  = useState<'日预算' | '总预算'>('日预算');
  const [budgetAmt,   setBudgetAmt]   = useState('');
  const [note,        setNote]        = useState('');

  const step1OK  = !!marketObj;
  const step2OK  = selPlacements.length > 0;
  const canFinish = projName.trim().length > 0 && step2OK;

  const toggleProduct   = (p: string) => setSelProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : prev.length < 3 ? [...prev, p] : prev);
  const toggleCarrier   = (c: string) => setSelCarriers(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const togglePlacement = (id: string) => setSelPlacements(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleEdu = (e: string) => {
    if (e === '不限') { setSelEdu(['不限']); return; }
    setSelEdu(prev => {
      const without = prev.filter(x => x !== '不限');
      const next = without.includes(e) ? without.filter(x => x !== e) : [...without, e];
      return next.length === 0 ? ['不限'] : next;
    });
  };

  const handleAiAnalyze = async () => {
    setAiAnalyzing(true);
    setAiSuggestion('');
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('isDemo') === '1';
    try {
      const profileDesc = shopProfile
        ? `店铺：${shopProfile.store_name}，主营：${shopProfile.main_products || '暂未提供'}，地区：${shopProfile.location}`
        : isDemo
          ? '烘焙小店，深圳'
          : '本地实体小店（请在店铺档案中补全主营与地区）';
      const productDesc = selProducts.length > 0 ? selProducts.join('、') : isDemo ? '烘焙产品' : '主营商品';
      const prompt = `你是广告顾问。根据以下信息，推荐最合适的2个腾讯系广告版位。店铺：${profileDesc}。营销目标：${marketObj}。推广产品：${productDesc}。可选版位：朋友圈、微信视频号、腾讯浏览器、QQ、QQ音乐、腾讯视频。格式：推荐：[版位1]、[版位2]。理由：[一句话不超过30字]`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildChatRequestBody(shopProfile!, [{ role: 'user', content: prompt }], {
            mode: 'advisor',
            isDemo,
            planState,
            weeklyReport,
            campaigns,
          })
        ),
      });
      const text = await res.text();
      const lines = text.split('\n').filter(l => l.startsWith('data:'));
      let full = '';
      for (const line of lines) {
        try { const d = JSON.parse(line.slice(5)); if (d.content) full += d.content; } catch { /* noop */ }
      }
      const auto: string[] = [];
      if (full.includes('朋友圈'))   auto.push('moments');
      if (full.includes('视频号'))   auto.push('channels');
      if (full.includes('腾讯浏览器') || (full.includes('浏览器') && !full.includes('微信'))) auto.push('qqbrowser');
      if (full.includes('QQ音乐'))   auto.push('qqmusic');
      if (full.includes('腾讯视频')) auto.push('txvideo');
      if (full.includes('QQ') && !full.includes('QQ音乐') && !auto.includes('qqbrowser')) auto.push('qq');
      if (auto.length > 0) setSelPlacements(auto.slice(0, 2));
      setAiSuggestion(
        full ||
          (isDemo
            ? '推荐：朋友圈、微信视频号。理由：烘焙产品视觉呈现强，本地用户覆盖效果最佳。'
            : '推荐：朋友圈、微信视频号。理由：熟人链路与短视频内容适合触达周边潜在顾客。'),
      );
    } catch {
      setAiSuggestion(
        isDemo
          ? '推荐：朋友圈、微信视频号。理由：烘焙产品适合视觉营销，本地覆盖效果佳。'
          : '推荐：朋友圈、微信视频号。理由：适合多数本地小店的日常触达与内容种草。',
      );
      setSelPlacements(['moments', 'channels']);
    } finally { setAiAnalyzing(false); }
  };

  const handleCreate = () => {
    if (!canFinish) return;
    const names = selPlacements.map(id => PLACEMENTS.find(p => p.id === id)?.name || id);
    const record: CampaignRecord = {
      id: `camp-${Date.now()}`,
      name: projName.trim(),
      goal: marketObj,
      platform: names.join(' + '),
      status: 'planning',
      budget: budgetAmt && budgetAmt !== '暂不设置' ? `${budgetType} ${budgetAmt}` : '暂不设预算',
      startDate: '立即开始',
      note: note.trim(),
      createdAt: Date.now(),
      views: 0, clicks: 0, ctr: 0, spend: 0,
    };
    onSave(record);
    onClose();
  };

  const STEP_LABELS = ['营销内容', '广告版位', '定向设置', '预算 & 命名'];
  const budgets = budgetType === '日预算' ? DAILY_BUDGETS : TOTAL_BUDGETS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col animate-[scale-in_0.2s_ease-out_both]"
        style={{ maxHeight: '90vh' }}>

        {/* ── 顶部 ── */}
        <div className="px-7 pt-6 pb-5 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-zinc-900">新建广告项目</h2>
              <p className="text-xs text-zinc-400 mt-0.5">第 {step} 步 / 4 步 · {STEP_LABELS[step - 1]}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-xl leading-none">
              ×
            </button>
          </div>
          {/* 步骤指示器 */}
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                  i + 1 < step  ? 'bg-amber-500 text-white' :
                  i + 1 === step ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' :
                                  'bg-zinc-100 text-zinc-400'}`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block truncate transition-colors ${
                  i + 1 === step ? 'font-semibold text-zinc-800' :
                  i + 1 < step  ? 'text-amber-600' : 'text-zinc-300'}`}>
                  {label}
                </span>
                {i < 3 && <div className={`h-px flex-1 w-4 min-w-4 transition-colors ${i + 1 < step ? 'bg-amber-400' : 'bg-zinc-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── 内容区 ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6 min-h-0">

          {/* ─ Step 1: 营销内容 ─ */}
          {step === 1 && (
            <div className="space-y-7">
              {/* 营销目标 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">营销目标 <span className="text-red-400 normal-case">*</span></div>
                <p className="text-xs text-zinc-400 mb-3">这次投广告最想达到什么效果？</p>
                <div className="grid grid-cols-3 gap-3">
                  {MARKET_OBJS.map(obj => (
                    <button key={obj.id} onClick={() => setMarketObj(obj.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${marketObj === obj.id ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}>
                      <div className={`text-sm font-bold mb-1 ${marketObj === obj.id ? 'text-amber-800' : 'text-zinc-800'}`}>{obj.id}</div>
                      <div className="text-[11px] text-zinc-400 leading-snug">{obj.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 推广产品 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">推广产品</div>
                <p className="text-xs text-zinc-400 mb-3">这次主推什么？最多选 3 个</p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TAGS.map(tag => {
                    const on = selProducts.includes(tag);
                    const maxed = !on && selProducts.length >= 3;
                    return (
                      <button key={tag} onClick={() => toggleProduct(tag)} disabled={maxed}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${on ? 'bg-zinc-900 text-white border-zinc-900' : maxed ? 'border-zinc-100 text-zinc-300 cursor-not-allowed' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'}`}>
                        {on && '✓ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 营销载体 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">营销载体</div>
                <p className="text-xs text-zinc-400 mb-3">用户点击广告后落地到哪里？可多选</p>
                <div className="flex flex-wrap gap-2">
                  {CARRIERS.map(c => {
                    const on = selCarriers.includes(c);
                    return (
                      <button key={c} onClick={() => toggleCarrier(c)}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all active:scale-95 ${on ? 'bg-zinc-900 text-white border-zinc-900 font-medium' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                        {on && '✓ '}{c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 2: 广告版位 ─ */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">广告版位 <span className="text-red-400 normal-case">*</span></div>
                <p className="text-xs text-zinc-400 mb-4">AI 帮你选，或者自己指定</p>
              </div>

              {/* AI 分析区 */}
              <div className={`rounded-2xl border-2 p-5 transition-all ${aiSuggestion ? 'border-violet-300 bg-violet-50/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2zm-2.5 11a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-zinc-900">AI 一键分析推荐版位</span>
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded-full font-medium">智能</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">根据你的店铺、营销目标和产品，AI 自动匹配最优投放版位组合</p>
                    {!aiAnalyzing && !aiSuggestion && (
                      <button onClick={handleAiAnalyze}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.97] shadow-sm">
                        开始分析 →
                      </button>
                    )}
                    {aiAnalyzing && (
                      <div className="flex items-center gap-2 text-xs text-violet-600 font-medium">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                          <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                        </svg>
                        AI 正在分析你的店铺数据…
                      </div>
                    )}
                    {aiSuggestion && !aiAnalyzing && (
                      <div className="mt-1 p-3 bg-white rounded-xl border border-violet-100 text-xs text-zinc-700 leading-relaxed">
                        {aiSuggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 手动版位选择 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-zinc-400">选择特定版位</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-[10px] text-zinc-400">可多选</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {PLACEMENTS.map(plat => {
                    const on = selPlacements.includes(plat.id);
                    return (
                      <button key={plat.id} onClick={() => togglePlacement(plat.id)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${on ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}>
                        {on && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 4l2 2 3-3"/></svg>
                          </div>
                        )}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm" style={{ backgroundColor: plat.bg }}>
                          <PlatLogo ltype={plat.ltype} size={18} />
                        </div>
                        <div className={`text-xs font-bold mb-0.5 ${on ? 'text-amber-800' : 'text-zinc-800'}`}>{plat.name}</div>
                        <div className="text-[10px] text-zinc-400 leading-snug">{plat.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {selPlacements.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-400">已选版位：</span>
                    {selPlacements.map(id => {
                      const p = PLACEMENTS.find(x => x.id === id);
                      return p ? (
                        <span key={id} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-amber-800 bg-amber-100">{p.name}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Step 3: 定向设置 ─ */}
          {step === 3 && (
            <div className="space-y-7">
              {/* 年龄 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">年龄段</div>
                <p className="text-xs text-zinc-400 mb-3">你的目标顾客主要是哪个年龄段？</p>
                <div className="flex flex-wrap gap-2">
                  {AGE_OPTS.map(a => (
                    <button key={a} onClick={() => setAgeRange(a)}
                      className={`px-4 py-2 rounded-xl text-sm border transition-all active:scale-95 ${ageRange === a ? 'bg-zinc-900 text-white border-zinc-900 font-medium' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              {/* 性别 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">性别</div>
                <div className="flex gap-2">
                  {GENDER_OPTS.map(g => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`px-6 py-2.5 rounded-xl text-sm border transition-all active:scale-95 ${gender === g ? 'bg-zinc-900 text-white border-zinc-900 font-medium' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              {/* 学历 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">学历</div>
                <p className="text-xs text-zinc-400 mb-3">可多选</p>
                <div className="flex flex-wrap gap-2">
                  {EDU_OPTS.map(e => {
                    const on = selEdu.includes(e);
                    return (
                      <button key={e} onClick={() => toggleEdu(e)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${on ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                        {on && '✓ '}{e}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 地理位置 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">地理位置</div>
                <p className="text-xs text-zinc-400 mb-3">广告投放到哪个城市或区域？</p>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="例：深圳市南山区"
                  className="w-full border border-zinc-200 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-300 outline-none transition-colors bg-zinc-50"
                />
              </div>
            </div>
          )}

          {/* ─ Step 4: 预算 & 命名 ─ */}
          {step === 4 && (
            <div className="space-y-6">
              {/* 项目名称 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">项目名称 <span className="text-red-400 normal-case">*</span></div>
                <p className="text-xs text-zinc-400 mb-3">给这个广告项目起个好记的名字</p>
                <input
                  autoFocus
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  placeholder="例：端午礼盒预售 · 朋友圈"
                  className="w-full border border-zinc-200 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-300 outline-none transition-colors bg-zinc-50"
                />
              </div>

              {/* 预算 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">预算设置</div>
                <div className="flex gap-2 mb-3">
                  {(['日预算', '总预算'] as const).map(t => (
                    <button key={t} onClick={() => { setBudgetType(t); setBudgetAmt(''); }}
                      className={`px-5 py-2 rounded-xl text-sm border transition-all active:scale-95 ${budgetType === t ? 'bg-zinc-900 text-white border-zinc-900 font-medium' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {budgets.map(b => (
                    <button key={b} onClick={() => setBudgetAmt(b)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${budgetAmt === b ? 'bg-amber-50 border-amber-400 text-amber-800 font-semibold' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* 摘要卡片 */}
              <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">项目摘要</div>
                <div className="space-y-2 text-xs">
                  {[
                    ['营销目标', marketObj || '—'],
                    ['推广产品', selProducts.length > 0 ? selProducts.join('、') : '未选择'],
                    ['营销载体', selCarriers.length > 0 ? selCarriers.join('、') : '未选择'],
                    ['广告版位', selPlacements.map(id => PLACEMENTS.find(p => p.id === id)?.name).filter(Boolean).join(' + ') || '未选择'],
                    ['定向',     `${ageRange} · ${gender} · ${location || '全国'}`],
                    ['预算',     budgetAmt && budgetAmt !== '暂不设置' ? `${budgetType} ${budgetAmt}` : '暂不设置'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-zinc-400 w-14 flex-shrink-0">{k}</span>
                      <span className="font-medium text-zinc-800 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">备注（选填）</div>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="可以记下这个项目的思路或备忘" rows={2}
                  className="w-full border border-zinc-200 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-zinc-700 placeholder-zinc-300 outline-none transition-colors bg-zinc-50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 底部导航 ── */}
        <div className="px-7 py-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-sm text-zinc-400 hover:text-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
            {step > 1 ? '← 上一步' : '取消'}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !step1OK : step === 2 ? !step2OK : false}
              className="px-7 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-30 transition-all active:scale-[0.97]">
              下一步 →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!canFinish}
              className="px-7 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-all active:scale-[0.97] shadow-sm">
              创建项目 ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* 状态徽章 */
const STATUS_MAP = {
  active:   { label: '运行中', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused:   { label: '暂停中', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  planning: { label: '计划中', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ended:    { label: '已结束', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

/* ─────────── 广告项目库 ─────────── */
function CampaignSection({ campaigns, setCampaigns }: {
  campaigns: CampaignRecord[];
  setCampaigns: (fn: (prev: CampaignRecord[]) => CampaignRecord[]) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleSave = (c: CampaignRecord) =>
    setCampaigns((prev) => [c, ...prev]);
 
  const toggleStatus = (id: string) =>
    setCampaigns((prev) => prev.map((c) =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : c.status === 'paused' ? 'active' : c.status } : c
    ));

  const total = campaigns.reduce((acc, c) => ({
    views:  acc.views  + (c.views  ?? 0),
    clicks: acc.clicks + (c.clicks ?? 0),
    spend:  acc.spend  + (c.spend  ?? 0),
  }), { views: 0, clicks: 0, spend: 0 });

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {/* 区块头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">广告项目库</h2>
              <span className="text-xs text-zinc-400 bg-zinc-100 rounded-lg px-2 py-0.5">{campaigns.length} 个项目</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">先建项目，再投广告——每个项目对应一条推广计划</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-700 transition-all active:scale-[0.97]"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/>
            </svg>
            新建广告项目
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-zinc-300">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">还没有广告项目</p>
            <p className="text-xs text-zinc-400">点击「新建广告项目」开始你的第一条推广计划</p>
          </div>
        ) : (
          <>
            {/* 表头 */}
            <div className="hidden sm:grid px-5 py-2 bg-zinc-50 border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: '1fr 80px 90px 90px 80px 88px' }}>
              <span>项目名称</span>
              <span className="text-right">曝光人数</span>
              <span className="text-right">点击次数</span>
              <span className="text-right">点击率</span>
              <span className="text-right">已花费</span>
              <span className="text-right">启停</span>
            </div>

            {/* 项目行 */}
            <div className="divide-y divide-zinc-100">
              {campaigns.map((c) => {
                const st = STATUS_MAP[c.status];
                const canToggle = c.status === 'active' || c.status === 'paused';
                return (
                  <div
                    key={c.id}
                    className="grid items-center px-5 py-3.5 hover:bg-zinc-50/60 transition-colors"
                    style={{ gridTemplateColumns: '1fr 80px 90px 90px 80px 88px' }}
                  >
                    {/* 项目信息 */}
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-400">{c.goal}</span>
                        <span className="text-zinc-200">·</span>
                        <span className="text-[11px] text-zinc-400">{c.platform}</span>
                      </div>
                      {c.note && (
                        <p className="text-[11px] text-zinc-300 mt-0.5 truncate max-w-xs">{c.note}</p>
                      )}
                    </div>

                    {/* 曝光 */}
                    <div className="text-right">
                      {(c.views ?? 0) > 0
                        ? <p className="text-sm font-semibold text-zinc-900">{(c.views ?? 0).toLocaleString()}</p>
                        : <p className="text-sm text-zinc-300">—</p>}
                      <p className="text-[10px] text-zinc-400">人次</p>
                    </div>

                    {/* 点击 */}
                    <div className="text-right">
                      {(c.clicks ?? 0) > 0
                        ? <p className="text-sm font-semibold text-zinc-900">{(c.clicks ?? 0).toLocaleString()}</p>
                        : <p className="text-sm text-zinc-300">—</p>}
                      <p className="text-[10px] text-zinc-400">次</p>
                    </div>

                    {/* 点击率 */}
                    <div className="text-right">
                      {(c.ctr ?? 0) > 0 ? (
                        <>
                          <p className={`text-sm font-semibold ${(c.ctr ?? 0) >= 10 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                            {(c.ctr ?? 0).toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-zinc-400">点击率</p>
                        </>
                      ) : <p className="text-sm text-zinc-300">—</p>}
                    </div>

                    {/* 花费 */}
                    <div className="text-right">
                      {(c.spend ?? 0) > 0
                        ? <p className="text-sm font-semibold text-zinc-900">¥{c.spend}</p>
                        : <p className="text-sm text-zinc-300">—</p>}
                      <p className="text-[10px] text-zinc-400">元</p>
                    </div>

                    {/* 启停开关：黄黑主题，iOS 比例（轨道/滑块位移精确对齐） */}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.status === 'active'}
                        onClick={() => canToggle && toggleStatus(c.id)}
                        disabled={!canToggle}
                        title={canToggle ? (c.status === 'active' ? '点击暂停投放' : '点击启动投放') : c.status === 'planning' ? '计划中，尚未开始' : '已结束，无法切换'}
                        className={[
                          'relative h-[22px] w-[42px] shrink-0 rounded-full border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
                          'transition-[background-color,border-color,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                          canToggle ? 'cursor-pointer active:scale-[0.97]' : 'cursor-not-allowed opacity-55',
                          c.status === 'active'
                            ? 'border-amber-700/25 bg-gradient-to-b from-amber-400 to-amber-600'
                            : 'border-zinc-200 bg-zinc-100',
                        ].join(' ')}
                      >
                        <span
                          aria-hidden
                          className={[
                            'pointer-events-none absolute top-[3px] left-[3px] h-4 w-4 rounded-full',
                            'shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]',
                            'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform',
                            c.status === 'active'
                              ? 'translate-x-[20px] bg-zinc-950'
                              : 'translate-x-0 bg-white',
                          ].join(' ')}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 汇总行 */}
            <div
              className="grid items-center px-5 py-3 bg-zinc-50 border-t border-zinc-200 text-xs font-semibold text-zinc-500"
              style={{ gridTemplateColumns: '1fr 80px 90px 90px 80px 88px' }}
            >
              <span>合计 {campaigns.length} 个项目</span>
              <span className="text-right text-zinc-700">{total.views.toLocaleString()}</span>
              <span className="text-right text-zinc-700">{total.clicks.toLocaleString()}</span>
              <span className="text-right text-zinc-700">
                {total.views > 0 ? `${(total.clicks / total.views * 100).toFixed(1)}%` : '—'}
              </span>
              <span className="text-right text-zinc-700">¥{total.spend}</span>
              <span />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <NewCampaignModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </>
  );
}

/* ─────────── 主工作台（已登录 + 已建档） ─────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return '还在忙呢';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

/** 工作台「往期周报」示意（演示/空数据时也有档案感；与当前周报周次去重） */
const WORKBENCH_REPORT_ARCHIVE: { key: string; weekLabel: string; summary: string }[] = [
  { key: 'arch-16', weekLabel: '2026年第16周', summary: '朋友圈「本周出炉」系列完结，收藏与私信咨询略升，到店仍偏少。' },
  { key: 'arch-15', weekLabel: '2026年第15周', summary: '试吃海报点击不错，转化偏弱；收银台话术统一后，犹豫客户减少。' },
  { key: 'arch-14', weekLabel: '2026年第14周', summary: '下午茶套餐小测：14:00–17:00 客流有改善，需观察客单价。' },
  { key: 'arch-13', weekLabel: '2026年第13周', summary: '新店招拍照打卡引导上线，曝光稳定，评论互动首次破百。' },
];

function MainWorkbench({
  shopProfile,
  planState,
  weeklyReport,
  campaigns,
  setCampaigns,
  isDemo,
  onExitDemo,
  isNight,
}: {
  shopProfile: NonNullable<ReturnType<typeof useApp>['shopProfile']>;
  planState: ReturnType<typeof useApp>['planState'];
  weeklyReport: ReturnType<typeof useApp>['weeklyReport'];
  campaigns: ReturnType<typeof useApp>['campaigns'];
  setCampaigns: ReturnType<typeof useApp>['setCampaigns'];
  isDemo: boolean;
  onExitDemo: () => void;
  isNight: boolean;
}) {
  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const name = shopProfile.store_name.replace(/烘焙|面包|蛋糕|甜品/g, '').trim() || '老板';

  const reportChoices = useMemo(() => {
    type Row = { key: string; weekLabel: string; blurb: string; isLatest?: boolean };
    const rows: Row[] = [];
    if (weeklyReport) {
      rows.push({
        key: `live-${weeklyReport.generatedAt ?? 'current'}`,
        weekLabel: weeklyReport.weekLabel,
        blurb: weeklyReport.headline || weeklyReport.summary || '本周复盘已生成，可在效果分析查看详情。',
        isLatest: true,
      });
    }
    for (const a of WORKBENCH_REPORT_ARCHIVE) {
      if (weeklyReport && a.weekLabel === weeklyReport.weekLabel) continue;
      rows.push({ key: a.key, weekLabel: a.weekLabel, blurb: a.summary });
    }
    return rows;
  }, [weeklyReport]);

  const [reportPick, setReportPick] = useState<string | null>(null);

  useEffect(() => {
    if (reportChoices.length === 0) {
      setReportPick(null);
      return;
    }
    setReportPick((prev) => {
      if (prev && reportChoices.some((r) => r.key === prev)) return prev;
      const latest = reportChoices.find((r) => r.isLatest);
      return (latest ?? reportChoices[0]).key;
    });
  }, [reportChoices]);

  const pickedReport = reportChoices.find((r) => r.key === reportPick) ?? reportChoices[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[min(100%,90rem)] px-6 sm:px-8 lg:px-10 xl:px-12 py-8 space-y-5">

        {isDemo && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-sm font-semibold text-amber-900">演示模式</span>
              <span className="text-xs text-amber-600 hidden sm:inline">已内置示例店铺与全链路演示数据</span>
            </div>
            <button onClick={onExitDemo} className="text-xs font-semibold text-amber-600 hover:text-amber-900 transition-colors ml-3">
              退出演示 →
            </button>
          </div>
        )}

        <div>
          <p className="text-xs text-zinc-400">{today}</p>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">{getGreeting()}，{name}</h1>
        </div>

        {/* 全宽单列：避免 lg 5 列布局下右侧 2 列空占位导致宽屏大片留白 */}
        <div className="space-y-4">
            <AdCaseShowcase campaigns={campaigns} focusLine={planState?.mainGoal} useDemoFallback={isDemo} />

            {reportChoices.length > 0 && pickedReport && (
              <div
                className={
                  isNight
                    ? 'overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/55 text-zinc-100 shadow-[0_10px_36px_rgba(0,0,0,0.55)] ring-1 ring-amber-950/25 transition-shadow hover:shadow-[0_14px_44px_rgba(0,0,0,0.62)]'
                    : 'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 transition-shadow hover:shadow-md'
                }
              >
                <div
                  className={
                    isNight
                      ? 'flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-gradient-to-r from-white/[0.05] to-amber-950/[0.12] px-5 py-3'
                      : 'flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-3'
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={
                        isNight
                          ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-700/20 ring-1 ring-amber-400/25'
                          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80'
                      }
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={isNight ? 'h-4 w-4 text-amber-200' : 'h-4 w-4 text-amber-800'}
                      >
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isNight ? 'text-zinc-50' : 'text-zinc-900'}`}>周报档案</p>
                      <p className={`text-[11px] truncate ${isNight ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        切换周次快速回顾结论
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="workbench-report-week" className="sr-only">
                      选择周报周次
                    </label>
                    <select
                      id="workbench-report-week"
                      value={reportPick ?? pickedReport.key}
                      onChange={(e) => setReportPick(e.target.value)}
                      className={
                        isNight
                          ? 'min-w-0 w-full max-w-full sm:max-w-[240px] lg:max-w-[min(100%,320px)] cursor-pointer rounded-lg border border-white/12 bg-zinc-900/80 py-1.5 pl-2.5 pr-8 text-xs font-semibold text-zinc-100 shadow-inner shadow-black/40 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25'
                          : 'min-w-0 w-full max-w-full sm:max-w-[240px] lg:max-w-[min(100%,320px)] cursor-pointer rounded-lg border border-zinc-200 bg-white py-1.5 pl-2.5 pr-8 text-xs font-semibold text-zinc-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30'
                      }
                    >
                      {reportChoices.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.weekLabel}
                          {r.isLatest ? ' · 最新' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-zinc-500">{pickedReport.weekLabel}</p>
                  <p className={`mt-1.5 text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>{pickedReport.blurb}</p>
                </div>
                <div
                  className={
                    isNight
                      ? 'flex items-center justify-between gap-3 border-t border-white/[0.08] bg-zinc-950/40 px-5 py-3'
                      : 'flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3'
                  }
                >
                  <span className={`text-[11px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {pickedReport.isLatest ? '完整数据在效果分析' : '往期摘要（示意）'}
                  </span>
                  <Link
                    href="/dashboard"
                    className={
                      isNight
                        ? 'inline-flex items-center gap-1 text-xs font-bold text-amber-200/95 hover:text-amber-100 transition-colors'
                        : 'inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors'
                    }
                  >
                    查看完整周报
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
        </div>

        {/* 广告项目库 */}
        <CampaignSection campaigns={campaigns} setCampaigns={setCampaigns} />

      </div>
    </div>
  );
}

/* ─────────── 登录状态下的顶栏 ─────────── */
function WorkbenchHeader({
  title, subtitle, shopProfile, onLogout,
}: {
  title: string;
  subtitle?: string;
  shopProfile: ReturnType<typeof useApp>['shopProfile'];
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-6 bg-white border-b border-zinc-100 relative z-10">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-zinc-900 text-sm truncate">{title}</span>
        {subtitle && <span className="text-xs text-zinc-400 hidden md:block">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* 用户头像 / 登出菜单 */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors"
          >
            {shopProfile?.store_name?.[0] ?? '我'}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-100 overflow-hidden min-w-[140px]">
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400"><path fillRule="evenodd" d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 100-5.86 2.929 2.929 0 000 5.858z" clipRule="evenodd"/></svg>
                  店铺设置
                </Link>
                <button onClick={() => { setMenuOpen(false); onLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 3.75a.75.75 0 00-1.5 0v4.19L7.03 6.47a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l2.5-2.5a.75.75 0 00-1.06-1.06L10 7.94V3.75z" clipRule="evenodd"/><path fillRule="evenodd" d="M3 2.75A2.75 2.75 0 015.75 0h4.5A2.75 2.75 0 0113 2.75v.5a.75.75 0 01-1.5 0v-.5c0-.69-.56-1.25-1.25-1.25h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5c.69 0 1.25-.56 1.25-1.25v-.5a.75.75 0 011.5 0v.5A2.75 2.75 0 0110.25 16h-4.5A2.75 2.75 0 013 13.25V2.75z" clipRule="evenodd"/></svg>
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─────────── 主页面 ─────────── */
export default function WorkbenchPage() {
  const { isLoggedIn, login, logout, shopProfile, setShopProfile, clearShopProfile, setPlanState, setChatHistory, setCampaigns, setWeeklyReport, planState, weeklyReport, campaigns } = useApp();
  const [isDemo, setIsDemo] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');

  useEffect(() => { setIsDemo(localStorage.getItem('isDemo') === '1'); }, [isLoggedIn, shopProfile]);
  useEffect(() => {
    const stored = (localStorage.getItem('theme_mode') as ThemeMode | null) ?? 'day';
    const m: ThemeMode = stored === 'night' ? 'night' : 'day';
    setThemeMode(m);
    applyTheme(m);
  }, []);

  /* 演示模式 */
  const loadDemo = () => {
    login();
    setShopProfile(DEMO_PROFILE);
    setChatHistory(DEMO_CHAT);
    setPlanState(DEMO_PLAN);
    setCampaigns(DEMO_CAMPAIGNS);
    setWeeklyReport(DEMO_WEEKLY_REPORT);
    localStorage.setItem('isDemo', '1');
    setIsDemo(true);
    notifyDemoModeChanged();
  };

  const exitDemo = () => {
    localStorage.removeItem('isDemo');
    clearShopProfile();
    setIsDemo(false);
    notifyDemoModeChanged();
  };

  const handleLogout = () => {
    localStorage.removeItem('isDemo');
    setIsDemo(false);
    notifyDemoModeChanged();
    logout();
  };

  /* ① 未登录 */
  if (!isLoggedIn) {
    return <LoginView onLogin={login} onDemo={loadDemo} />;
  }

  /* ② 已登录，未建档 */
  if (!shopProfile) {
    return (
      <div className="flex h-dvh overflow-hidden bg-zinc-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <WorkbenchHeader title="建立店铺档案" subtitle="只需 1 分钟" shopProfile={null} onLogout={handleLogout} />
          <SetupWizard onComplete={(p) => { setShopProfile(p); }} onDemo={loadDemo} />
        </div>
      </div>
    );
  }

  /* ③ 已登录 + 已建档 */
  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <WorkbenchHeader
          title="工作台"
          subtitle={new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          shopProfile={shopProfile}
          onLogout={handleLogout}
        />
        <MainWorkbench
          shopProfile={shopProfile}
          planState={planState}
          weeklyReport={weeklyReport}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          isDemo={isDemo}
          onExitDemo={exitDemo}
          isNight={themeMode === 'night'}
        />
      </div>
      <FloatingChat />

      {/* 左下角：白天/黑夜模式（iOS 手感） */}
      <div className="fixed left-6 bottom-6 z-[70]">
        <button
          type="button"
          onClick={() => {
            const next: ThemeMode = themeMode === 'night' ? 'day' : 'night';
            setThemeMode(next);
            localStorage.setItem('theme_mode', next);
            applyTheme(next);
          }}
          className="group relative inline-flex items-center"
          aria-label="切换白天/黑夜模式"
          title="白天/黑夜模式"
        >
          <span
            className={`relative w-12 h-7 rounded-full border backdrop-blur-md shadow-sm transition-colors duration-300 ease-out ${
              themeMode === 'night'
                ? 'bg-zinc-900/70 border-zinc-700/60'
                : 'bg-zinc-200/70 border-zinc-300/70'
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out flex items-center justify-center text-[11px] ${
                themeMode === 'night' ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            >
              <span className={`transition-colors ${themeMode === 'night' ? 'text-zinc-700' : 'text-amber-500'}`}>
                {themeMode === 'night' ? '☾' : '☀'}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
