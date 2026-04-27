'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { getIsDemoFromStorage } from '@/lib/isDemo';
import Sidebar from './Sidebar';
import FloatingChat from './FloatingChat';

function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (open) {
      t = setTimeout(() => setMounted(true), 10);
    } else {
      setMounted(false);
    }
    return () => { if (t) clearTimeout(t); };
  }, [open]);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="帮助"
        className="w-7 h-7 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center"
      >
        ?
      </button>

      {(open || mounted) && (
        <div
          className="pointer-events-none absolute left-0 top-[38px] z-[60] w-[360px] max-w-[70vw]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: `translateY(${mounted ? 0 : -6}px)`,
            transition: mounted
              ? 'opacity 180ms cubic-bezier(0.25,0.46,0.45,0.94), transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)'
              : 'opacity 120ms ease, transform 120ms ease',
          }}
        >
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-black/[0.06] p-4">
            <p className="text-xs font-semibold text-zinc-900">这个页面能做什么？</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLayout({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { isLoggedIn, shopProfile, campaigns } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const sync = () => setIsDemo(getIsDemoFromStorage());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('xlt-demo-mode', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('xlt-demo-mode', sync);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !shopProfile) router.replace('/workbench');
  }, [isLoggedIn, shopProfile, router]);

  const showHelp =
    pathname === '/studio' ||
    pathname === '/plan' ||
    pathname === '/content' ||
    pathname === '/dashboard';
  const helpText = useMemo(() => {
    if (pathname === '/dashboard') {
      return '「效果分析」负责把广告数据翻译成生意结果：哪里有效、哪里浪费。\n用法：先选范围 → 点「AI 解读」看结论与本周动作；点「生成周报」一键做复盘。\n说明：只用你项目库里的曝光/点击/花费，不会编造到店与下单。';
    }
    return '「推广工坊」把方案和内容放在一处：\n- AI 提供推广方案：给本月目标+本周行动\n- 创意文案生成：一句话生成可直接发布的文案\n- 图片素材库：上传素材，未来可一键生图并自动提炼提示词（概念）\n- 视频创意工坊：上传视频，未来自动给短片脚本/镜头拆解（概念）';
  }, [pathname]);

  const breadcrumb: Record<string, string> = {
    '/workbench': '工作台',
    '/studio': '推广工坊',
    '/plan': '推广工坊',
    '/content': '推广工坊',
    '/dashboard': '效果分析',
    '/chat': 'AI 顾问',
    '/settings': '店铺设置',
  };
  const section = breadcrumb[pathname] ?? '';
  const totalViews = useMemo(() => (campaigns ?? []).reduce((s, c) => s + (c.views ?? 0), 0), [campaigns]);
  const activeCount = useMemo(() => (campaigns ?? []).filter((c) => c.status === 'active').length, [campaigns]);

  if (!isLoggedIn || !shopProfile) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* 顶部栏 */}
        <header className="shrink-0 h-14 flex items-center justify-between px-6 bg-white border-b border-zinc-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              {section && section !== title && (
                <>
                  <span className="text-zinc-400 shrink-0">{section}</span>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-zinc-300 shrink-0">
                    <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </>
              )}
              <span className="font-semibold text-zinc-900 truncate">{title}</span>
              {showHelp && <HelpTooltip text={helpText} />}
            </div>
            {subtitle && (
              <span className="text-xs text-zinc-400 hidden md:block truncate">{subtitle}</span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}
            {(pathname === '/studio' || pathname === '/dashboard') && (
              <>
                {/* iOS 灵动岛：固定在右上角，展开不挤布局 */}
                <div className="relative">
                  <div className="group">
                    <div
                      className={[
                        // 用 fixed 避免与 header/内容区产生“挤压/错位”
                        'fixed top-3 right-6 z-[80]',
                        'overflow-hidden',
                        'rounded-[999px] border border-zinc-200',
                        'bg-zinc-900 text-white shadow-sm',
                        'backdrop-blur-md',
                        // iOS 风格：更温柔的“过渡 + 呼吸”
                        'dynamic-island',
                        'transition-[width,height,border-radius,box-shadow] duration-[640ms]',
                        'ease-[cubic-bezier(0.2,0.9,0.2,1)]',
                        // default size（略加宽，便于店名视觉居中）
                        'w-[156px] h-9',
                        // hover size（只展示“店名 + 店面预览”）
                        'group-hover:w-[360px] group-hover:h-[168px] group-hover:rounded-[32px] group-hover:shadow-xl group-hover:shadow-black/[0.14]',
                        // 小屏兜底
                        'max-w-[calc(100vw-24px)]',
                      ].join(' ')}
                      style={{ transform: 'translateZ(0)' }}
                    >
                      {/* 默认态：店名几何居中，呼吸灯绝对定位不占 flex 宽度 */}
                      <div className="absolute inset-0 z-[1] transition-opacity duration-300 ease-out group-hover:pointer-events-none group-hover:opacity-0">
                        <div className="relative flex h-full w-full items-center justify-center px-3 pr-7">
                          <span className="max-w-[calc(100%-18px)] translate-x-[5px] truncate text-center text-[13px] font-extrabold tracking-wide text-stone-100 antialiased drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                            {shopProfile.store_name}
                          </span>
                          <span className="island-status-led-wrap" title="运行中" aria-hidden>
                            <span className="island-status-led-halo island-status-led-halo--a" />
                            <span className="island-status-led-halo island-status-led-halo--b" />
                            <span className="island-status-led-core" />
                          </span>
                        </div>
                      </div>

                      {/* 展开态内容 */}
                      <div className="absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 dynamic-island-panel">
                        <div className="pt-4 pr-4 pl-2.5 pb-4">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-extrabold tracking-wide text-stone-100 antialiased drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                              {shopProfile.store_name}
                            </p>
                          </div>

                          <div className="mt-3 flex items-stretch gap-3">
                            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                              {isDemo ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src="/demo/chenjie/bs1.jpg"
                                  alt="店面预览"
                                  className="w-full h-[96px] object-cover"
                                />
                              ) : (
                                <div className="flex h-[96px] w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.03] px-3 text-center text-[11px] leading-snug text-white/55">
                                  可在店铺设置中补充门头或产品图
                                </div>
                              )}
                            </div>

                            <div className="w-[132px] rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col justify-center gap-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] text-white/65 font-semibold">曝光</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M8 3a.75.75 0 01.75.75v6.69l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V3.75A.75.75 0 018 3z" clipRule="evenodd" transform="rotate(180 8 8)" />
                                  </svg>
                                  上升
                                </span>
                              </div>
                              <p className="text-xl font-bold text-white metric-num leading-none">
                                {isDemo && totalViews === 0 ? '8,377' : totalViews.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-white/65 font-semibold mt-1">
                                已上线项目：
                                <span className="text-white metric-num">{isDemo && activeCount === 0 ? 2 : activeCount}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-hidden page-enter">{children}</main>
      </div>

      {/* 全局浮动 AI 对话（排除 /chat 页本身） */}
      {pathname !== '/chat' && <FloatingChat />}
    </div>
  );
}
