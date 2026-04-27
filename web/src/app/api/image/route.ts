import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = (body?.prompt ?? '').trim();
  if (!prompt) return NextResponse.json({ error: 'bad_request', hint: 'prompt 不能为空' }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'missing_env: OPENAI_API_KEY' }, { status: 500 });

  // 9:16 社媒竖版，OpenAI Images 常用 1024x1792
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 90000);
  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        // gpt-image-1 的固定尺寸里竖版常用 1024x1536（前端可再裁成 9:16）
        size: '1024x1536',
        n: 1,
        // GPT Image 模型默认返回 b64_json；response_format 仅适用于 dall-e-*。
        output_format: 'jpeg',
        quality: 'medium',
      }),
      signal: ac.signal,
    });
  } catch (e: any) {
    clearTimeout(t);
    const aborted = ac.signal.aborted;
    return NextResponse.json(
      { error: aborted ? 'upstream_timeout' : 'upstream_fetch_failed', details: String(e?.message ?? '') },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(t);
  }

  if (!upstream.ok) {
    const raw = await upstream.text().catch(() => '');
    try {
      const j = JSON.parse(raw);
      const msg = j?.error?.message ?? '';
      const code = j?.error?.code ?? '';
      return NextResponse.json(
        { error: 'openai_error', status: upstream.status, code, message: msg },
        { status: 502 }
      );
    } catch {
      return NextResponse.json(
        { error: 'upstream_error', status: upstream.status, details: raw.slice(0, 1200) },
        { status: 502 }
      );
    }
  }

  const json = (await upstream.json().catch(() => null)) as any;
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ error: 'bad_upstream_payload' }, { status: 502 });

  return NextResponse.json({ b64 }, { status: 200 });
}

