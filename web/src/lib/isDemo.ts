/**
 * 演示模式标记（localStorage）。仅客户端可读，SSR 视为 false。
 * 同标签页内切换演示时派发 `xlt-demo-mode`，供顶栏等订阅刷新。
 */
export const DEMO_LS_KEY = 'isDemo';

export function getIsDemoFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DEMO_LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function notifyDemoModeChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('xlt-demo-mode'));
}
