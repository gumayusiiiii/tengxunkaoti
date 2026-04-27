import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContextSnapshot } from '@/lib/chatRequestBody';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatMode = 'advisor' | 'task';

const ADVISOR_CHAR_LIMIT = 220;

function extractBlock(raw: string, startMarker: string, endMarker: string) {
  const start = raw.indexOf(startMarker);
  const end = raw.indexOf(endMarker);
  if (start >= 0 && end > start) return raw.slice(start + startMarker.length, end).trim();
  return raw.trim();
}

function applyProfile(template: string, profile: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (key === 'CONTEXT_SNAPSHOT') return '{{CONTEXT_SNAPSHOT}}';
    const v = profile?.[key];
    if (v === undefined || v === null) return '暂未提供';
    const s = String(v).trim();
    return s.length === 0 ? '暂未提供' : s;
  });
}

function injectContextSnapshot(template: string, snapshot: string) {
  return template.replace(/\{\{CONTEXT_SNAPSHOT\}\}/g, snapshot);
}

function buildContextSnapshotText(ctx: ContextSnapshot | undefined | null): string {
  if (!ctx) {
    return '（本请求未附带站内存档。）';
  }
  const lines: string[] = [];
  if (ctx.isDemo) {
    lines.push('【提示】当前为演示模式：以下站内存档均为演示数据，用于体验流程。');
  }
  if (ctx.planState) {
    lines.push(
      `· 方案/诊断：${ctx.planState.diagnosisLabel}（象限 ${ctx.planState.diagnosis}）；主平台 ${ctx.planState.primaryPlatform}；主目标：${ctx.planState.mainGoal}；预算分配：${ctx.planState.budget}；周行动：${(ctx.planState.weeklyActions ?? []).join('；')}`
    );
  } else {
    lines.push('· 方案/诊断：暂无（用户尚未在「推广方案」页生成。）');
  }
  if (ctx.weeklyReport) {
    lines.push(
      `· 最近周报：${ctx.weeklyReport.weekLabel} — ${ctx.weeklyReport.summary} 下周重点：${ctx.weeklyReport.nextAction}（亮点/问题项见站内，此处不展开）`
    );
  } else {
    lines.push('· 最近周报：暂无。');
  }
  if (ctx.campaigns?.length) {
    const short = ctx.campaigns
      .map(
        (c) =>
          `${c.name}｜${c.goal}｜${c.platform}｜${c.status}｜预算 ${c.budget}${
            c.views != null || c.spend != null
              ? `｜数据：曝光${c.views ?? '—'} 点击${c.clicks ?? '—'} 花费${c.spend ?? '—'}`
              : ''
          }`
      )
      .join(' / ');
    lines.push(`· 广告/项目：${short}`);
  } else {
    lines.push('· 广告/项目：暂无记录。');
  }
  return lines.join('\n');
}

/**
 * 过滤推理模型输出的 <think>...</think> 块。
 * 因为 chunk 可能在 tag 中间被切断，需要跨 chunk 维护状态。
 */
function filterThinkBlocks(text: string, insideThink: boolean): [string, boolean] {
  let result = '';
  let i = 0;
  let inside = insideThink;

  while (i < text.length) {
    if (inside) {
      const closeIdx = text.indexOf('</think>', i);
      if (closeIdx === -1) break;
      i = closeIdx + '</think>'.length;
      inside = false;
    } else {
      const openIdx = text.indexOf('<think>', i);
      if (openIdx === -1) {
        result += text.slice(i);
        break;
      }
      result += text.slice(i, openIdx);
      i = openIdx + '<think>'.length;
      inside = true;
    }
  }

  return [result, inside];
}

function clipToRemaining(text: string, remaining: number): string {
  if (remaining <= 0) return '';
  return Array.from(text).slice(0, remaining).join('');
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    messages?: ChatMessage[];
    shopProfile?: Record<string, unknown>;
    mode?: ChatMode;
    contextSnapshot?: ContextSnapshot;
  } | null;

  if (!body || !Array.isArray(body.messages)) {
    return Response.json({ error: 'bad_request', hint: 'body.messages 必须是数组，且每项含 role/content' }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'missing_env: MINIMAX_API_KEY' }, { status: 500 });
  }

  const baseUrl = process.env.MINIMAX_BASE_URL ?? 'https://api.minimaxi.com';
  const model = process.env.MINIMAX_MODEL ?? 'MiniMax-M2.7';
  const mode: ChatMode = body.mode === 'task' ? 'task' : 'advisor';

  const advisorPath = path.join(process.cwd(), 'prompts', 'advisor_system.md');
  const taskPath = path.join(process.cwd(), 'prompts', 'task_brief.md');
  const rawFile = await readFile(mode === 'advisor' ? advisorPath : taskPath, 'utf-8');
  const template = extractBlock(rawFile, '===PROMPT START===', '===PROMPT END===');
  const snapshotText = buildContextSnapshotText(body.contextSnapshot ?? null);

  let systemPrompt = applyProfile(template, body.shopProfile ?? {});
  systemPrompt = injectContextSnapshot(systemPrompt, snapshotText);

  const recentMessages = body.messages.slice(-20);
  const isAdvisor = mode === 'advisor';

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function fetchUpstreamOnce(signal: AbortSignal) {
    return await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: isAdvisor ? 0.4 : 0.45,
        // task 模式主要用于结构化输出，token 不需要太夸张，减少上游压力
        max_tokens: isAdvisor ? 240 : 1800,
        messages: [{ role: 'system', content: systemPrompt }, ...recentMessages],
      }),
      signal,
    });
  }

  // 上游 529（拥挤）时做退避重试，显著降低“分析失败”概率
  const ac = new AbortController();
  const upstreamTimeout = setTimeout(() => ac.abort(), 70000);
  let upstream: Response | null = null;
  let lastDetails = '';
  const delays = [500, 1200]; // 两次退避（总共最多 3 次尝试）
  for (let attempt = 0; attempt < 1 + delays.length; attempt++) {
    upstream = await fetchUpstreamOnce(ac.signal);
    if (upstream.ok) break;
    lastDetails = await upstream.text().catch(() => '');
    if (upstream.status === 529 && attempt < delays.length) {
      await sleep(delays[attempt] + Math.floor(Math.random() * 250));
      continue;
    }
    break;
  }
  clearTimeout(upstreamTimeout);

  if (!upstream || !upstream.ok) {
    const status = upstream?.status ?? 0;
    const details = lastDetails || (upstream ? await upstream.text().catch(() => '') : '');
    // 仍然统一向前端返回 502，但把真实上游状态码带出去，便于定位
    return Response.json({ error: 'upstream_error', status, details }, { status: 502 });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  (async () => {
    const reader = upstream.body!.getReader();
    let insideThink = false;
    let lineBuffer = '';
    let emittedChars = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            await writer.write(encoder.encode(line + '\n'));
            continue;
          }

          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            continue;
          }

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(payload);
          } catch {
            await writer.write(encoder.encode(line + '\n'));
            continue;
          }

          const choices = parsed?.choices as { delta?: { content?: string } }[];
          const raw = (choices?.[0]?.delta?.content as string) ?? '';

          const [clean, nextInside] = filterThinkBlocks(raw, insideThink);
          insideThink = nextInside;

          let outContent = clean;
          if (isAdvisor) {
            const allowed = ADVISOR_CHAR_LIMIT - emittedChars;
            outContent = clipToRemaining(clean, allowed);
            emittedChars += Array.from(outContent).length;
          }

          if (choices?.[0]?.delta) {
            (choices[0].delta as { content?: string }).content = outContent;
          }

          await writer.write(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
        }
      }
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
