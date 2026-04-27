'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/AppContext';
import { buildChatRequestBody } from '@/lib/chatRequestBody';
import { usePush } from '@/lib/usePush';
import { getIsDemoFromStorage } from '@/lib/isDemo';

type TabKey = 'plan' | 'copy' | 'image' | 'video';
type Version = { label: string; body: string };

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'plan',  label: '推广方案',   desc: 'AI 给出本周/本月打法' },
  { key: 'copy',  label: '创意文案',   desc: '一键生成可直接发布' },
  { key: 'image', label: '图片素材库', desc: '上传/管理 + AI 生图（概念）' },
  { key: 'video', label: '视频工坊',   desc: '上传视频 + AI 短片创意（概念）' },
];

const PLATFORMS = ['小红书', '微信朋友圈', '大众点评', '抖音'];

const DEMO_IMAGE_SHELF = [
  { id: 'AL1', name: '演示素材 01', url: '/demo/chenjie/AL1.jpg' },
  { id: 'AL2', name: '演示素材 02', url: '/demo/chenjie/AL2.jpg' },
  { id: 'AL3', name: '演示素材 03', url: '/demo/chenjie/AL3.jpg' },
  { id: 'AL4', name: '演示素材 04', url: '/demo/chenjie/AL4.jpg' },
];

async function readSSEStream(res: Response, onDelta?: (delta: string) => void) {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try {
          const d = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content ?? '';
          if (d) {
            full += d;
            onDelta?.(d);
          }
        } catch {}
      }
    }
  }
  return full;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      {label}·即将上线
    </span>
  );
}

export default function StudioPage() {
  const {
    shopProfile,
    planState, setPlanState,
    weeklyReport,
    campaigns,
  } = useApp();

  const { push: pushPlan, status: pushStatus } = usePush();

  const [tab, setTab] = useState<TabKey>('plan');
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

  // ── plan ─────────────────────────────────────────────
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const generatePlan = async () => {
    if (!shopProfile) return;
    setPlanLoading(true);
    setPlanError('');
    setExpanded(false);
    const prompt = `请帮我为「${shopProfile.store_name}」生成一份本月推广方案。
店铺信息：类型${shopProfile.store_type}，位置${shopProfile.location}，目标客群${shopProfile.target_audience}，月预算${shopProfile.monthly_budget}，现有平台${shopProfile.current_platforms}，主要诉求${shopProfile.stated_goal}。
用 JSON 返回：{"diagnosis":"A/B/C/D","diagnosisLabel":"白话解释最大问题（15字内）","mainGoal":"本月唯一目标（15字内）","primaryPlatform":"主推平台","budget":"预算分配（15字内）","weeklyActions":["行动1","行动2","行动3"]}
只返回 JSON。`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildChatRequestBody(shopProfile, [{ role: 'user', content: prompt }], {
            mode: 'task',
            isDemo,
            planState,
            weeklyReport,
            campaigns,
          })
        ),
      });
      if (!res.ok) throw new Error();
      const full = await readSSEStream(res);
      const match = full.match(/\{[\s\S]*\}/);
      if (!match) throw new Error();
      setPlanState({ ...JSON.parse(match[0]), generatedAt: Date.now() });
    } catch {
      setPlanError('生成失败，请稍后重试');
    } finally {
      setPlanLoading(false);
    }
  };

  // ── copy ─────────────────────────────────────────────
  const [platform, setPlatform] = useState('小红书');
  const [scene, setScene] = useState('');
  const [promo, setPromo] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState<{ label: string; reason: string; tweak: string } | null>(null);

  const generateCopy = async () => {
    if (!scene.trim() || !shopProfile) return;
    setCopyLoading(true);
    setCopyError('');
    setVersions([]);
    setPick(null);

    const promoLine = promo.trim()
      ? `店主确认本次真实活动/优惠：${promo.trim()}。只能使用这一条活动信息，不得自行发明。`
      : '店主没有提供任何活动/优惠信息：禁止写买二送一/折扣/满减/优惠券/送礼等活动。';

    const prompt = `你是「${shopProfile.store_name}」的推广文案助手。你必须更有创意，避免模板化复述。
店铺：${shopProfile.store_type}，位于${shopProfile.location}，面向${shopProfile.target_audience}。
${promoLine}

请为以下场景，针对「${platform}」平台，生成 3 版推广文案：
场景：${scene}

要求：
1. 情感款：用一个生活场景或顾客心情开头（别写鸡汤），结尾给“怎么来/怎么联系”
2. 口感款：必须写出2个具体口感细节（如外脆内软、黄油香、回甘），避免空形容词
3. 行动款：强调“时间/数量/预约”这种真实行动点；如果没有活动信息，不允许写任何优惠
通用：必须像真实老板口吻；每版80-120字；不要出现与我未提供事实冲突的内容。

以 JSON 格式返回：
[
  {"label": "情感款", "body": "文案内容"},
  {"label": "口感款", "body": "文案内容"},
  {"label": "行动款", "body": "文案内容"}
]
只返回 JSON。`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildChatRequestBody(shopProfile, [{ role: 'user', content: prompt }], {
            mode: 'task',
            isDemo,
            planState,
            weeklyReport,
            campaigns,
          })
        ),
      });
      if (!res.ok) throw new Error();
      const full = await readSSEStream(res);
      const match = full.match(/\[[\s\S]*\]/);
      if (!match) throw new Error();
      setVersions(JSON.parse(match[0]));
    } catch {
      setCopyError('生成失败，请重试');
    } finally {
      setCopyLoading(false);
    }
  };

  const pickOne = async () => {
    if (!shopProfile || versions.length === 0) return;
    setPicking(true);
    setPick(null);
    const prompt = `你是推广顾问。店主不懂设计，请你在下列3条文案里选“最适合本周目标的一条”。禁止编造活动：${
      promo.trim() ? `只能使用活动「${promo.trim()}」` : '没有活动信息就不允许出现任何优惠/买赠'
    }。
店铺：${shopProfile.store_name}；位置：${shopProfile.location}；目标：${planState?.mainGoal ?? shopProfile.stated_goal}
平台：${platform}
候选文案：
${versions.map((v, i) => `${i + 1}) ${v.label}: ${v.body}`).join('\n')}
只返回 JSON：{"pickLabel":"情感款/口感款/行动款","reason":"两句以内说明为什么更适合（面向店主、口语化）","tweak":"一句话告诉我怎么微调更好（不新增活动）"}`;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildChatRequestBody(shopProfile, [{ role: 'user', content: prompt }], {
            mode: 'task',
            isDemo,
            planState,
            weeklyReport,
            campaigns,
          })
        ),
      });
      if (!res.ok) throw new Error();
      const full = await readSSEStream(res);
      const match = full.match(/\{[\s\S]*\}/);
      if (!match) throw new Error();
      const obj = JSON.parse(match[0]);
      setPick({ label: obj.pickLabel ?? '', reason: obj.reason ?? '', tweak: obj.tweak ?? '' });
    } catch {
      // ignore
    } finally {
      setPicking(false);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── image library (concept) ───────────────────────────
  const [images, setImages] = useState<{ id: string; name: string; url: string }[]>([]);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [imgGenError, setImgGenError] = useState('');
  const [activeImg, setActiveImg] = useState<{ name: string; url: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const addImages = (files: FileList | null) => {
    if (!files) return;
    const next: { id: string; name: string; url: string }[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      next.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: f.name, url: URL.createObjectURL(f) });
    }
    if (next.length) setImages((p) => [...next, ...p].slice(0, 24));
  };
  const removeImage = (id: string) => setImages((p) => p.filter((x) => x.id !== id));

  const imagePromptDraft = useMemo(() => {
    if (!shopProfile) return '（请先建立店铺档案）';
    const name = shopProfile.store_name.trim() || '本店';
    return `干净醒目的竖版商业海报（9:16），店名「${name}」清晰可读，突出店内主打产品与整洁陈列，暖色灯光、现代版式，写实风格、高清细节，适合社交平台发布`;
  }, [shopProfile]);

  const generateImage = async () => {
    if (!shopProfile) return;
    const prompt = (imgPrompt || imagePromptDraft).trim();
    if (!prompt) return;
    setImgGenLoading(true);
    setImgGenError('');
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.b64) {
        const msg =
          data?.error === 'openai_error'
            ? `生图失败：${data?.message || data?.code || 'OpenAI 错误'}`
            : (data?.error ? `${data.error}${data.status ? `(${data.status})` : ''}` : '生成失败');
        throw new Error(msg);
      }
      // 服务端返回 jpeg base64。为了适配 9:16（更像社媒竖版），前端做一次中心裁剪。
      const srcUrl = `data:image/jpeg;base64,${data.b64}`;
      const url = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const w = img.naturalWidth || 1024;
            const h = img.naturalHeight || 1536;
            // 目标 9:16，保持高度，裁掉左右
            const targetW = Math.round(h * 9 / 16);
            const cropW = Math.min(w, targetW);
            const sx = Math.max(0, Math.round((w - cropW) / 2));
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(srcUrl);
            ctx.drawImage(img, sx, 0, cropW, h, 0, 0, cropW, h);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch {
            resolve(srcUrl);
          }
        };
        img.onerror = () => resolve(srcUrl);
        img.src = srcUrl;
      });
      setImages((p) => [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: `AI生成-9:16-${new Date().toLocaleTimeString('zh-CN')}`, url }, ...p].slice(0, 24));
      setImgPrompt('');
    } catch (e: any) {
      setImgGenError(String(e?.message ?? '生成失败，请重试'));
    } finally {
      setImgGenLoading(false);
    }
  };

  // ── video workshop (concept) ──────────────────────────
  const [videos, setVideos] = useState<{ id: string; name: string }[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const addVideos = (files: FileList | null) => {
    if (!files) return;
    const next: { id: string; name: string }[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('video/')) continue;
      next.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: f.name });
    }
    if (next.length) setVideos((p) => [...next, ...p].slice(0, 12));
  };
  const removeVideo = (id: string) => setVideos((p) => p.filter((x) => x.id !== id));

  const title = '推广工坊';
  const subtitle = '方案 + 文案 + 素材（图片/视频概念）';

  return (
    <AppLayout title={title} subtitle={subtitle}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 space-y-5">

          {/* Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-3">
              <div className="bg-white border border-zinc-200 rounded-3xl p-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`w-full text-left px-4 py-3 rounded-2xl transition-all ${tab === t.key ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${tab === t.key ? '' : 'text-zinc-900'}`}>{t.label}</span>
                      {(t.key === 'image' || t.key === 'video') && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === t.key ? 'bg-white/10 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          Beta
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${tab === t.key ? 'text-white/70' : 'text-zinc-400'}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-9 space-y-5">

              {/* Tab: plan */}
              {tab === 'plan' && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-zinc-900">AI 提供推广方案</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {isDemo
                          ? '根据档案 + 站内数据生成本月计划（演示模式含内置样例，便于体验）。'
                          : '根据档案与站内已录入的数据生成本月计划。'}
                      </p>
                    </div>
                    <button
                      onClick={generatePlan}
                      disabled={planLoading}
                      className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center gap-2"
                    >
                      {planLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {planLoading ? '生成中…' : (planState ? '重新生成' : '生成方案')}
                    </button>
                  </div>

                  {planError && <p className="text-sm text-red-500 mt-3">{planError}</p>}

                  {!planState ? (
                    <div className="mt-6 rounded-2xl bg-zinc-50 border border-zinc-200 p-5">
                      <p className="text-sm font-semibold text-zinc-900">还没有方案</p>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        点击“生成方案”，我会给你一个本月唯一目标 + 本周 1-3 步行动。
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      <div className="bg-zinc-900 rounded-2xl px-6 py-6 text-white">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">本月唯一目标</p>
                        <p className="text-xl font-bold leading-snug">{planState.mainGoal}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 border border-white/10">
                            主推 · {planState.primaryPlatform}
                          </span>
                        </div>
                      </div>

                      {planState.weeklyActions?.length > 0 && (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">本周第一步</p>
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                            <p className="text-sm font-medium text-zinc-900 leading-relaxed pt-0.5">{planState.weeklyActions[0]}</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setExpanded((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-2xl text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all"
                      >
                        <span className="font-medium">{expanded ? '收起详情' : '查看完整方案详情'}</span>
                        <svg viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {expanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">本周行动（全部）</p>
                            <ol className="space-y-3">
                              {(planState.weeklyActions ?? []).map((a, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                    i === 0 ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-500'
                                  }`}>{i + 1}</span>
                                  <p className="text-sm text-zinc-700 leading-relaxed">{a}</p>
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">预算策略</p>
                            <p className="text-sm text-zinc-700">{planState.budget}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-xs text-zinc-400">生成于 {new Date(planState.generatedAt).toLocaleDateString('zh-CN')}</p>
                              <button
                                onClick={() => pushPlan({
                                  weekLabel: '本月推广方案',
                                  storeName: shopProfile?.store_name ?? '',
                                  summary: `目标：${planState.mainGoal}`,
                                  highlights: planState.weeklyActions,
                                  issues: [`主推：${planState.primaryPlatform}`, `预算：${planState.budget}`],
                                  nextAction: planState.weeklyActions?.[0] ?? '',
                                  generatedAt: planState.generatedAt,
                                })}
                                disabled={pushStatus === 'pushing'}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                                  pushStatus === 'success' ? 'bg-emerald-500 text-white' :
                                  pushStatus === 'copied'  ? 'bg-blue-500 text-white' :
                                  'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {pushStatus === 'pushing' ? '推送中…' :
                                 pushStatus === 'success'  ? '已推送 ✓' :
                                 pushStatus === 'copied'   ? '已复制' :
                                 '推送到微信'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: copy */}
              {tab === 'copy' && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-5">
                  <div>
                    <p className="text-base font-bold text-zinc-900">创意文案生成</p>
                    <p className="text-xs text-zinc-400 mt-1">用一句话描述你要发什么，我给你 3 个可直接发的版本。</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">发布平台</p>
                    <div className="flex gap-2 flex-wrap">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                            platform === p ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">告诉我你想发什么</p>
                    <div className="flex gap-2">
                      <input
                        value={scene}
                        onChange={(e) => setScene(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && generateCopy()}
                        placeholder="例：周五新出了草莓塔，限量 20 个"
                        className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                      <button
                        onClick={generateCopy}
                        disabled={!scene.trim() || copyLoading}
                        className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0"
                      >
                        {copyLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {copyLoading ? '生成中' : '生成 3 版'}
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">活动/优惠（可选，只有你填了才允许写进文案）</p>
                      <input
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="例：本周五买面包送小饼干（不填=禁止写买二送一/折扣等）"
                        className="w-full text-sm text-zinc-900 placeholder-zinc-300 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1">不填就默认“没有活动”，AI 不会编造买赠/折扣。</p>
                    </div>
                    {copyError && <p className="text-xs text-red-500 mt-1.5">{copyError}</p>}
                  </div>

                  {versions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400">拿不定主意？让 AI 根据本周目标推荐一条最合适的。</p>
                        <button
                          onClick={pickOne}
                          disabled={picking}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all disabled:opacity-40"
                        >
                          {picking ? 'AI在选…' : 'AI帮我选一套'}
                        </button>
                      </div>
                      {pick && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-semibold text-amber-800">推荐：{pick.label}</p>
                          <p className="text-sm text-amber-900 mt-1 leading-relaxed">{pick.reason}</p>
                          <p className="text-xs text-amber-700 mt-2">微调一句：{pick.tweak}</p>
                        </div>
                      )}
                      {versions.map((v, i) => (
                        <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                              i === 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              i === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-zinc-50 text-zinc-700 border-zinc-200'
                            }`}>{v.label}</span>
                            <button
                              onClick={() => copy(v.body, `v-${i}`)}
                              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                              {copied === `v-${i}` ? (
                                <>
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-emerald-600">已复制</span>
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                  </svg>
                                  复制
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{v.body}</p>
                        </div>
                      ))}
                      <p className="text-xs text-zinc-400 text-center pt-1">
                        需要按“更便宜/更高级/更本地”改？直接去 AI 顾问说一句就行。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: image (concept) */}
              {tab === 'image' && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-zinc-900">图片素材库</p>
                      <p className="text-xs text-zinc-400 mt-1">上传素材，或用提示词生成竖版海报（9:16）。</p>
                    </div>
                    <p className="text-xs text-zinc-400">{images.length} / 24</p>
                  </div>

                  {/* 简约两栏：左上传 / 右生成 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-zinc-900">上传素材</p>
                      <input
                        ref={imgInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addImages(e.target.files)}
                      />

                      {/* Google Drive 风格拖拽区 */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => imgInputRef.current?.click()}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && imgInputRef.current?.click()}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(false);
                          addImages(e.dataTransfer?.files ?? null);
                        }}
                        className={`mt-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center select-none cursor-pointer transition-colors ${
                          dragOver ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/60'
                        }`}
                        aria-label="拖拽图片到这里上传"
                      >
                        <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border ${
                          dragOver ? 'border-amber-300 bg-white' : 'border-zinc-200 bg-white'
                        }`}>
                          <span className={`text-2xl leading-none ${dragOver ? 'text-amber-500' : 'text-zinc-400'}`}>+</span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 mt-3">拖拽图片到这里</p>
                        <p className="text-xs text-zinc-400 mt-1">或点击选择文件</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900">AI 生成海报</p>
                        <span className="text-[11px] text-zinc-400">约 10–30 秒</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">输入提示词（可留空，使用默认草稿）。</p>
                      <textarea
                        value={imgPrompt}
                        onChange={(e) => setImgPrompt(e.target.value)}
                        placeholder={imagePromptDraft}
                        rows={5}
                        className="mt-3 w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none focus:border-zinc-400"
                      />
                      {imgGenError && <p className="text-xs text-red-500 mt-2">{imgGenError}</p>}
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={generateImage}
                          disabled={imgGenLoading || (!imgPrompt.trim() && !imagePromptDraft.trim())}
                          className="px-4 py-2.5 bg-white text-emerald-700 text-sm font-semibold rounded-xl border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm"
                        >
                          {imgGenLoading && <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />}
                          {imgGenLoading ? '生成中…' : '生成 9:16'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 素材网格：简约 */}
                  {images.length === 0 ? (
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">还没有素材</p>
                          <p className="text-xs text-zinc-400 mt-1.5">先上传图片，或生成一张海报做样例。</p>
                        </div>
                      </div>

                      {/* 演示模式：常驻橱窗（不计入素材数量） */}
                      {isDemo && (
                        <div className="mt-5">
                          {/* 小窗卡片 + 按键左右滑动（不靠滚动条） */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDemoIdx((v) => Math.max(0, v - 1))}
                              disabled={demoIdx === 0}
                              className="w-9 h-9 rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-30 transition-colors shrink-0"
                              aria-label="上一张"
                            >
                              ‹
                            </button>

                            <div className="flex-1 overflow-hidden">
                              <div
                                className="flex gap-3"
                                style={{
                                  transform: `translateX(-${demoIdx * (170 + 12)}px)`,
                                  transition: 'transform 260ms cubic-bezier(0.25,0.46,0.45,0.94)',
                                }}
                              >
                                {DEMO_IMAGE_SHELF.map((img) => (
                                  <div
                                    key={img.id}
                                    className="shrink-0 w-[170px] rounded-2xl border border-zinc-200 bg-white overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setActiveImg({ name: img.name, url: img.url })}
                                      className="block w-full text-left"
                                      aria-label={`预览 ${img.name}`}
                                    >
                                      <div className="aspect-[3/4] bg-zinc-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="px-3 py-2">
                                        <p className="text-[11px] text-zinc-500 truncate">{img.name}</p>
                                      </div>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDemoIdx((v) => Math.min(DEMO_IMAGE_SHELF.length - 1, v + 1))}
                              disabled={demoIdx >= DEMO_IMAGE_SHELF.length - 1}
                              className="w-9 h-9 rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-30 transition-colors shrink-0"
                              aria-label="下一张"
                            >
                              ›
                            </button>
                          </div>

                          <p className="text-[11px] text-zinc-400 mt-3">
                            演示模式会自带 4 张示例素材（模拟老板已有素材），你可以继续拖拽上传更多。
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {images.map((img) => (
                        <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setActiveImg({ name: img.name, url: img.url })}
                            className="block w-full text-left"
                            aria-label={`预览 ${img.name}`}
                          >
                            <div className="aspect-[3/4] bg-zinc-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2.5">
                              <p className="text-[11px] text-zinc-500 truncate">{img.name}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="移除"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 图片预览弹层（保留：实用） */}
                  {activeImg && (
                    <>
                      <div className="fixed inset-0 z-[80] bg-black/55" onClick={() => setActiveImg(null)} />
                      <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
                        <div className="w-full max-w-[520px] bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl shadow-black/[0.25]">
                          <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                            <p className="text-sm font-semibold text-zinc-900 truncate">{activeImg.name}</p>
                            <button
                              onClick={() => setActiveImg(null)}
                              className="w-8 h-8 rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                              aria-label="关闭预览"
                            >
                              ×
                            </button>
                          </div>
                          <div className="bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={activeImg.url} alt={activeImg.name} className="w-full h-auto" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: video (concept) */}
              {tab === 'video' && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-zinc-900">视频创意工坊</p>
                      <p className="text-xs text-zinc-400 mt-1">把视频素材放进来，AI 自动给短片脚本与镜头拆解（概念）。</p>
                    </div>
                    <ComingSoon label="AI 短片创意" />
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-5">
                    <p className="text-sm font-semibold text-zinc-900">上传视频素材</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isDemo
                        ? '支持 MP4/MOV（演示：仅展示文件名，不做真实处理）。'
                        : '支持 MP4/MOV（当前为概念入口，仅管理文件名列表）。'}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addVideos(e.target.files)}
                      />
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.97]"
                      >
                        选择视频
                      </button>
                      <button
                        disabled
                        className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-300 text-sm font-semibold rounded-xl cursor-not-allowed"
                        title="概念功能：未来将输出短视频脚本、镜头拆解、字幕文案与封面标题"
                      >
                        AI 生成短片创意（即将上线）
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">视频素材列表</p>
                    <p className="text-xs text-zinc-400">{videos.length} / 12</p>
                  </div>

                  {videos.length === 0 ? (
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 text-center">
                      <p className="text-sm font-semibold text-zinc-900">还没有视频素材</p>
                      <p className="text-xs text-zinc-400 mt-1">先放 2-3 条“出炉/切开/拉丝/打包/顾客取货”短片最有效。</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {videos.map((v) => (
                        <div key={v.id} className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 truncate">{v.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">概念：未来将自动给脚本/镜头/字幕/封面</p>
                          </div>
                          <button
                            onClick={() => removeVideo(v.id)}
                            className="text-xs font-semibold text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

