'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CampaignRecord } from '@/lib/types';
import { DEMO_CAMPAIGNS, DEMO_PLAN } from '@/lib/demoData';

const AD_IMAGES = [
  '/demo/ad-cases/ad1.png',
  '/demo/ad-cases/ad2.png',
  '/demo/ad-cases/ad3.jpeg',
  '/demo/ad-cases/ad4.png',
  '/demo/ad-cases/ad5.png',
] as const;

const N = AD_IMAGES.length;
const MID = (N - 1) / 2;

const STATUS_LABEL: Record<CampaignRecord['status'], string> = {
  active: '运行中',
  paused: '暂停中',
  planning: '计划中',
  ended: '已结束',
};

/** 非演示：叠牌缺项目时用中性示意，不出现演示案例名 */
const NEUTRAL_DECK_FILLERS: CampaignRecord[] = Array.from({ length: N }, (_, j) => ({
  id: `deck-neutral-${j}`,
  name: `推广项目 ${j + 1}`,
  goal: '在「广告项目库」创建项目后将替换此处示意',
  platform: '—',
  status: 'planning' as const,
  budget: '—',
  startDate: '—',
  note: '',
  createdAt: Date.now() - j * 1000,
}));

function mergeCampaignsForDeck(campaigns: CampaignRecord[], useDemoFill: boolean): CampaignRecord[] {
  const seen = new Set<string>();
  const out: CampaignRecord[] = [];
  const sorted = [...campaigns].sort((a, b) => b.createdAt - a.createdAt);
  for (const c of sorted) {
    if (out.length >= AD_IMAGES.length) break;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  if (out.length < AD_IMAGES.length) {
    const filler = useDemoFill ? DEMO_CAMPAIGNS : NEUTRAL_DECK_FILLERS;
    for (const c of filler) {
      if (out.length >= AD_IMAGES.length) break;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
  }
  return out.slice(0, AD_IMAGES.length);
}

function DeckCardTextBlock({
  c,
  night,
  showMeta,
}: {
  c: CampaignRecord;
  night: boolean;
  showMeta: boolean;
}) {
  const label = night ? 'text-amber-200/90' : 'text-amber-800/90';
  const title = night ? 'text-white' : 'text-zinc-900';
  const sub = night ? 'text-zinc-400' : 'text-zinc-600';
  const badge = night
    ? 'border-white/10 bg-white/5 text-zinc-200'
    : 'border-zinc-200 bg-zinc-50 text-zinc-800';
  const budget = night ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <div className={`space-y-1.5 ${showMeta ? '' : 'pt-0.5'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>广告项目库</p>
      <p className={`text-sm font-semibold leading-snug ${showMeta ? 'line-clamp-3' : 'line-clamp-2'} ${title}`}>{c.name}</p>
      <p className={`text-[11px] leading-snug ${showMeta ? 'line-clamp-4' : 'line-clamp-2'} ${sub}`}>
        {c.goal} · {c.platform}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>{STATUS_LABEL[c.status]}</span>
        <span className={`text-[10px] ${budget}`}>{c.budget}</span>
      </div>
      {showMeta && c.note ? (
        <p className={`text-[10px] leading-relaxed ${night ? 'text-zinc-500' : 'text-zinc-500'}`}>备注：{c.note}</p>
      ) : null}
    </div>
  );
}

function CaseCard({
  src,
  c,
  stackClass,
  stackStyle,
  showMeta,
  imgClass,
  night,
  hidePreviewImage,
}: {
  src: string;
  c: CampaignRecord;
  stackClass: string;
  stackStyle: CSSProperties;
  showMeta: boolean;
  imgClass: string;
  night: boolean;
  /** 非演示：不展示示例广告图，仅文字区（避免未投放时出现演示画面） */
  hidePreviewImage: boolean;
}) {
  const shell = night
    ? [
        'border-white/15 bg-zinc-900/55',
        showMeta ? 'shadow-black/45 ring-1 ring-white/12' : 'shadow-black/30',
      ].join(' ')
    : [
        'border-zinc-900/10 bg-white/92 shadow-md shadow-zinc-900/8',
        showMeta ? 'shadow-lg shadow-zinc-900/12 ring-1 ring-zinc-900/8' : '',
      ].join(' ');

  const panel = night
    ? 'border-t border-white/10 bg-zinc-950/95'
    : 'border-t border-zinc-200 bg-white';

  const label = night ? 'text-amber-200/90' : 'text-amber-800/90';
  const title = night ? 'text-white' : 'text-zinc-900';
  const sub = night ? 'text-zinc-400' : 'text-zinc-600';
  const badge = night
    ? 'border-white/10 bg-white/5 text-zinc-200'
    : 'border-zinc-200 bg-zinc-50 text-zinc-800';
  const budget = night ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <article
      className={[
        'overflow-hidden rounded-2xl shadow-xl',
        shell,
        stackClass,
        'transition-[transform,box-shadow] duration-[520ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] will-change-transform',
      ].join(' ')}
      style={stackStyle}
    >
      <div className={night ? 'relative bg-zinc-950' : 'relative bg-zinc-50'}>
        {hidePreviewImage ? (
          <div
            className={[
              imgClass,
              'flex flex-col overflow-hidden',
              night ? 'bg-zinc-900/85' : 'bg-zinc-100',
              showMeta ? 'justify-start' : 'justify-end',
            ].join(' ')}
          >
            <div className={`min-h-0 flex-1 px-3 ${showMeta ? 'py-4' : 'py-3'}`}>
              <DeckCardTextBlock c={c} night={night} showMeta={showMeta} />
            </div>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={imgClass} />
            <div
              className={[
                `${panel} transition-all duration-500 ease-out`,
                showMeta ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden border-t-transparent',
              ].join(' ')}
            >
              <div className="space-y-1.5 px-3 py-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>广告项目库</p>
                <p className={`text-sm font-semibold leading-snug line-clamp-2 ${title}`}>{c.name}</p>
                <p className={`text-[11px] leading-snug line-clamp-2 ${sub}`}>
                  {c.goal} · {c.platform}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  <span className={`text-[10px] ${budget}`}>{c.budget}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/** 昼夜两套外壳 + 叠牌 transform；展开铺满；无底部说明文案 */
export default function AdCaseShowcase({
  campaigns,
  focusLine,
  useDemoFallback = false,
}: {
  campaigns: CampaignRecord[];
  focusLine?: string | null;
  /** 仅演示模式为 true 时，才用内置 DEMO 补全叠牌与主标文案 */
  useDemoFallback?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [night, setNight] = useState(false);
  const rows = useMemo(() => mergeCampaignsForDeck(campaigns, useDemoFallback), [campaigns, useDemoFallback]);
  const deckRef = useRef<HTMLDivElement>(null);
  const [band, setBand] = useState({ cw: 168, step: 132 });

  const line =
    (focusLine && focusLine.trim()) ||
    (useDemoFallback ? DEMO_PLAN?.mainGoal : '') ||
    '在本月推广方案里写下唯一主目标，我们会把它放在这里，与具体动作对齐。';

  useEffect(() => {
    const read = () => setNight(document.body.classList.contains('theme-night'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const pad = 28;
      const avail = Math.max(260, w - pad);
      const gap = Math.max(10, Math.min(18, Math.floor(avail * 0.02)));
      const cw = Math.min(210, Math.max(108, Math.floor((avail - (N - 1) * gap) / N)));
      const step = cw + gap;
      setBand({ cw, step });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const stackShift = 8;

  const shell = night
    ? 'border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/55 text-white shadow-lg shadow-black/25'
    : [
        /* 与夜间同一套结构：细边线 + 左上浅/中间沉 + 右下琥珀角，换为亮底氛围 */
        'border border-zinc-900/10 bg-gradient-to-br from-white via-zinc-100 to-amber-100/55',
        'text-zinc-900 shadow-lg shadow-zinc-900/10',
      ].join(' ');

  const gridBg: CSSProperties = night
    ? {
        backgroundImage: [
          'linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '28px 28px',
      }
    : {
        backgroundImage: [
          'linear-gradient(to right, rgba(39,39,42,0.125) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(39,39,42,0.125) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '28px 28px',
      };

  const overlay = open
    ? night
      ? 'bg-zinc-950/75 backdrop-blur-2xl'
      : 'bg-white/78 backdrop-blur-2xl ring-1 ring-zinc-900/8'
    : 'bg-transparent';

  const heroCls = night
    ? 'text-2xl font-bold leading-[1.3] tracking-[-0.03em] text-white sm:text-[1.75rem] lg:text-[1.9rem] xl:text-[2.05rem]'
    : 'text-2xl font-bold leading-[1.3] tracking-[-0.03em] text-zinc-900 sm:text-[1.75rem] lg:text-[1.9rem] xl:text-[2.05rem]';

  return (
    <div
      className={['relative overflow-hidden rounded-3xl transition-[box-shadow,background-color] duration-300', shell].join(
        ' ',
      )}
      style={{ minHeight: 360 }}
    >
      {/* 氛围光：与主渐变叠画，昼夜对称「一角暖光 + 对侧压色」 */}
      {night ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-3xl"
          aria-hidden
          style={{
            background: [
              'radial-gradient(ellipse 78% 52% at 100% 0%, rgba(251, 191, 36, 0.14), transparent 54%)',
              'radial-gradient(ellipse 65% 48% at 0% 100%, rgba(69, 26, 3, 0.45), transparent 55%)',
            ].join(', '),
          }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-3xl"
          aria-hidden
          style={{
            background: [
              'radial-gradient(ellipse 78% 52% at 100% 0%, rgba(251, 191, 36, 0.18), transparent 54%)',
              'radial-gradient(ellipse 68% 50% at 0% 100%, rgba(254, 243, 199, 0.55), transparent 56%)',
              'radial-gradient(ellipse 72% 48% at 100% 100%, rgba(251, 191, 36, 0.12), transparent 52%)',
            ].join(', '),
          }}
        />
      )}

      {/* 方格网：必须在氛围之上、内容之下，昼夜同一 28px 节奏 */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-3xl"
        style={gridBg}
        aria-hidden
      />

      <div className="relative z-[2] px-4 py-6 sm:px-7 sm:py-8">
        <div
          className={[
            'pointer-events-none absolute inset-0 z-0 rounded-2xl transition-all duration-500 ease-out',
            overlay,
          ].join(' ')}
          aria-hidden
        />

        <div
          className={[
            'relative z-[1] flex min-h-[340px] flex-col gap-8 sm:min-h-[380px]',
            open ? '' : 'lg:flex-row lg:items-stretch lg:gap-10',
          ].join(' ')}
        >
          <div
            className={[
              'relative min-w-0 transition-[width] duration-500 ease-out',
              open ? 'w-full' : 'w-full lg:w-1/2',
            ].join(' ')}
          >
            <div
              ref={deckRef}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className={[
                'relative mx-auto w-full transition-[min-height,max-width] duration-500',
                open ? 'min-h-[440px] max-w-none sm:min-h-[460px]' : 'h-[300px] max-w-[min(100%,520px)] sm:h-[330px]',
              ].join(' ')}
            >
              {AD_IMAGES.map((src, i) => {
                const c = rows[i] ?? NEUTRAL_DECK_FILLERS[i];
                const offset = (i - MID) * stackShift;
                const rot = -5.5 + i * 2.6;
                const ty = i * 4;
                const txOpen = (i - MID) * band.step;
                const rotT = open ? 0 : rot;
                const tx = open ? txOpen : offset;

                return (
                  <CaseCard
                    key={src}
                    src={src}
                    c={c}
                    night={night}
                    hidePreviewImage={!useDemoFallback}
                    stackClass={`absolute left-1/2 top-1/2 ${open ? '' : 'w-[min(48vw,200px)] sm:w-[218px]'}`}
                    stackStyle={{
                      width: open ? `${band.cw}px` : undefined,
                      /* 索引越大越靠上 → ad5 为封面 */
                      zIndex: open ? 20 + i : 12 + i,
                      transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotT}deg)`,
                    }}
                    showMeta={open}
                    imgClass={[
                      'block w-full transition-[aspect-ratio] duration-500 ease-out',
                      useDemoFallback ? 'object-cover' : '',
                      open ? 'aspect-[4/3]' : 'aspect-[3/4]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                );
              })}
            </div>
          </div>

          {!open && (
            <div className="relative z-[1] flex w-full min-w-0 flex-col justify-center lg:w-1/2 lg:pl-2 xl:pl-6">
              <p className={heroCls}>{line}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
