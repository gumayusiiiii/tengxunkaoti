import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  // 可选：用高德 Web 服务做地点联想（不配置也能正常用，只是没有联想）
  const amapKey = process.env.AMAP_WEB_KEY;
  if (!amapKey) {
    // 轻量兜底：把用户输入原样返回，避免前端空白
    return NextResponse.json({ suggestions: [q] });
  }

  try {
    // 高德 input tips：可指定 city=深圳，提高命中率
    const url = new URL('https://restapi.amap.com/v3/assistant/inputtips');
    url.searchParams.set('key', amapKey);
    url.searchParams.set('keywords', q);
    url.searchParams.set('city', '深圳');
    url.searchParams.set('citylimit', 'true');
    url.searchParams.set('datatype', 'all');

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`amap http ${res.status}`);
    const data = await res.json();

    const tips = Array.isArray(data?.tips) ? data.tips : [];
    const suggestions = tips
      .map((t: any) => {
        const name = String(t?.name ?? '').trim();
        const dist = String(t?.district ?? '').trim();
        const addr = String(t?.address ?? '').trim();
        const parts = [dist, addr].filter(Boolean).join(' ');
        return parts ? `${name}（${parts}）` : name;
      })
      .filter((s: string) => s.length >= 2)
      .slice(0, 8);

    // 去重
    const uniq = Array.from(new Set(suggestions));
    return NextResponse.json({ suggestions: uniq.length ? uniq : [q] });
  } catch {
    return NextResponse.json({ suggestions: [q] });
  }
}

