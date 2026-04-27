export type StreamChatOptions = {
  url?: string;
  body: unknown;
  /** 首个 token 超时（ms），到点会触发一次重试 */
  firstTokenTimeoutMs?: number;
  /** 总超时（ms），到点直接中断 */
  totalTimeoutMs?: number;
  /** 是否自动重试一次 */
  retryOnce?: boolean;
  onDelta?: (delta: string) => void;
  onStatus?: (s: 'connecting' | 'streaming' | 'retrying' | 'done' | 'error' | 'aborted') => void;
};

async function readErrorText(res: Response) {
  try {
    const t = await res.text();
    return t?.slice(0, 1200) ?? '';
  } catch {
    return '';
  }
}

async function streamOnce(opts: StreamChatOptions, signal: AbortSignal) {
  const url = opts.url ?? '/api/chat';
  opts.onStatus?.('connecting');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts.body),
    signal,
  });

  if (!res.ok || !res.body) {
    const details = await readErrorText(res);
    throw new Error(`请求失败（${res.status}）${details ? `：${details}` : ''}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';
  let full = '';
  let gotFirst = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!gotFirst) {
      gotFirst = true;
      opts.onStatus?.('streaming');
    }

    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          opts.onDelta?.(delta);
        }
      } catch {
        // ignore chunk parse errors
      }
    }
  }

  return { full, gotFirst };
}

/**
 * 稳定的 SSE 流式请求：
 * - 首 token 超时自动重试一次（可选）
 * - 总超时强制中断
 * - 返回 full 文本，失败抛错（包含 HTTP 状态/响应体片段）
 */
export async function streamChat(opts: StreamChatOptions) {
  const firstTokenTimeoutMs = opts.firstTokenTimeoutMs ?? 4500;
  const totalTimeoutMs = opts.totalTimeoutMs ?? 45000;
  const retryOnce = opts.retryOnce ?? true;

  const run = async (attempt: 1 | 2) => {
    const ac = new AbortController();
    const totalTimer = setTimeout(() => ac.abort(), totalTimeoutMs);
    let firstTimer: ReturnType<typeof setTimeout> | null = null;
    let firstTimedOut = false;

    try {
      firstTimer = setTimeout(() => {
        firstTimedOut = true;
        ac.abort();
      }, firstTokenTimeoutMs);

      const r = await streamOnce(opts, ac.signal);
      return r.full;
    } catch (e: any) {
      if (ac.signal.aborted) {
        if (firstTimedOut && retryOnce && attempt === 1) throw new Error('__FIRST_TOKEN_TIMEOUT__');
        throw new Error('请求超时或被中断，请重试。');
      }
      throw e;
    } finally {
      clearTimeout(totalTimer);
      if (firstTimer) clearTimeout(firstTimer);
    }
  };

  try {
    const full = await run(1);
    opts.onStatus?.('done');
    return full;
  } catch (e: any) {
    if (String(e?.message) === '__FIRST_TOKEN_TIMEOUT__') {
      opts.onStatus?.('retrying');
      const full = await run(2);
      opts.onStatus?.('done');
      return full;
    }
    opts.onStatus?.('error');
    throw e;
  }
}

