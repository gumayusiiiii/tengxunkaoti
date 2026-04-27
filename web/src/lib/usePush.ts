'use client';

import { useState } from 'react';

export type PushStatus = 'idle' | 'pushing' | 'success' | 'copied' | 'error';

type PushReport = {
  weekLabel: string;
  storeName: string;
  summary: string;
  highlights: string[];
  issues: string[];
  nextAction: string;
  generatedAt: number;
};

export function usePush() {
  const [status, setStatus] = useState<PushStatus>('idle');

  const push = async (report: PushReport, fallbackText?: string) => {
    setStatus('pushing');

    const pushplusToken = localStorage.getItem('pushplus_token') ?? '';
    const webhookUrl    = localStorage.getItem('wechat_webhook_url') ?? '';

    const body = pushplusToken
      ? { pushplusToken, report }
      : { webhookUrl: webhookUrl || undefined, report };

    const plain = fallbackText ??
      `【${report.weekLabel}】${report.storeName}\n${report.summary}\n\n做对了：\n${report.highlights.join('\n')}\n\n下周重点：${report.nextAction}`;

    try {
      const res = await fetch('/api/wechat-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        await navigator.clipboard.writeText(plain).catch(() => {});
        setStatus('copied');
      }
    } catch {
      await navigator.clipboard.writeText(plain).catch(() => {});
      setStatus('copied');
    }

    setTimeout(() => setStatus('idle'), 4500);
  };

  return { push, status };
}
