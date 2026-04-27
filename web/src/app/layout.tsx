import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/AppContext';
import ThemeClient from '@/components/ThemeClient';

export const metadata: Metadata = {
  title: '小推 · AI 投放助手',
  description: '让小店老板用最少的钱，让更多附近的人知道这家店',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      {/* 回档：把 theme-warm 改成空字符串即可恢复原冷色 */}
      <body className="theme-warm">
        <ThemeClient />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
