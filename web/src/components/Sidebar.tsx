'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const nav = [
  {
    href: '/workbench',
    label: '工作台',
    desc: '今日概览与行动焦点',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: '/studio',
    label: '推广工坊',
    desc: '方案 + 文案 + 素材',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path fillRule="evenodd" d="M4 3a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H9l-3.5 2.333A1 1 0 014 20v-1H6a2 2 0 01-2-2V3zm4 3a1 1 0 000 2h6a1 1 0 100-2H8zm0 4a1 1 0 000 2h6a1 1 0 100-2H8z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: '效果分析',
    desc: '填数据，读懂广告成效',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '设置',
    desc: '店铺档案与推送配置',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

/* ── 单个导航条目 ── */
function NavItem({
  item,
  active,
  expanded,
}: {
  item: (typeof nav)[number];
  active: boolean;
  expanded: boolean;
}) {
  return (
    <div>
      <Link
        href={item.href}
        className={`nav-item relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors duration-150 ${
          active
            ? 'bg-amber-50 text-amber-700'
            : 'text-zinc-400 hover:text-zinc-700'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-500 rounded-r-full" />
        )}
        <span className={active ? 'text-amber-600' : ''}>{item.icon}</span>
        <span
          className={`text-sm whitespace-nowrap ${active ? 'font-semibold text-amber-900' : 'font-medium'}`}
          style={{
            maxWidth: expanded ? 140 : 0,
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-width 320ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
            transitionDelay: expanded ? '50ms' : '0ms',
          }}
        >
          {item.label}
        </span>
      </Link>
    </div>
  );
}

/* ── 侧边栏主体 ── */
export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const sidebarW = expanded ? 212 : 64;

  // 切换展开时关掉 tooltip
  const toggle = () => {
    setExpanded((v) => !v);
  };

  return (
    <>
      <aside
        className="flex flex-col shrink-0 border-r border-zinc-100 bg-white h-dvh sticky top-0 overflow-hidden"
        style={{
          width: sidebarW,
          transition: 'width 320ms cubic-bezier(0.4,0,0.2,1)',
          zIndex: 20,
        }}
      >
        {/* Logo 行 */}
        <div className="flex items-center h-14 border-b border-zinc-100 shrink-0 px-3.5 gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <div
            className="flex-1 min-w-0"
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 200ms ease',
              transitionDelay: expanded ? '80ms' : '0ms',
              overflow: 'hidden',
            }}
          >
            <p className="text-sm font-bold text-zinc-900 leading-none whitespace-nowrap">小推</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 whitespace-nowrap">AI 广告助手</p>
          </div>
          <button
            onClick={toggle}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            title={expanded ? '收起' : '展开'}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3.5 h-3.5"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 px-2 mt-4 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/workbench' && pathname.startsWith(item.href));
            return (
              <NavItem
                key={item.href}
                item={item}
                active={active}
                expanded={expanded}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
}
