import { NextResponse } from 'next/server';

// ─── 企业微信 Markdown 格式 ──────────────────────────────────────────────────
function buildMarkdown(report: ReportPayload): string {
  const date = new Date(report.generatedAt).toLocaleDateString('zh-CN');
  const highlights = report.highlights.map((h, i) => `> ${i + 1}. ${h}`).join('\n');
  const issues = report.issues.map((is, i) => `> ${i + 1}. ${is}`).join('\n');
  return `**【${report.weekLabel} 推广复盘报告】**
> 店铺：${report.storeName}　　生成时间：${date}

**整体表现**
${report.summary}

**✅ 做对了**
${highlights}

**⚠️ 需要改进**
${issues}

**🎯 下周只做这一件事**
> ${report.nextAction}

---
*由 AI 推广助手根据店铺数据自动生成*`;
}

// ─── Pushplus / Server酱 共用 Markdown 内容 ─────────────────────────────────
function buildServerChanDesp(report: ReportPayload): string {
  const date = new Date(report.generatedAt).toLocaleDateString('zh-CN');
  const highlights = report.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const issues = report.issues.map((is, i) => `${i + 1}. ${is}`).join('\n');
  return `**店铺：${report.storeName}**　生成时间：${date}

---

**整体表现**

${report.summary}

**✅ 做对了**

${highlights}

**⚠️ 需要改进**

${issues}

**🎯 下周只做这一件事**

${report.nextAction}

---
*由 AI 推广助手根据店铺数据自动生成*`;
}

type ReportPayload = {
  weekLabel: string;
  storeName: string;
  summary: string;
  highlights: string[];
  issues: string[];
  nextAction: string;
  generatedAt: number;
};

export async function POST(req: Request) {
  const body = await req.json();
  const report: ReportPayload | undefined = body.report;

  // ── 1. Pushplus 推送（个人微信）──────────────────────────────────────────
  const pushplusToken: string =
    (typeof body.pushplusToken === 'string' && body.pushplusToken.trim())
      ? body.pushplusToken.trim()
      : (process.env.PUSHPLUS_TOKEN ?? '');

  if (pushplusToken) {
    if (!report) {
      return NextResponse.json({ error: 'report is required' }, { status: 400 });
    }
    try {
      const title = `${report.weekLabel} 推广复盘 · ${report.storeName}`;
      const content = buildServerChanDesp(report); // 同样是 Markdown
      const res = await fetch('https://www.pushplus.plus/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pushplusToken, title, content, template: 'markdown' }),
      });
      const data = await res.json();
      if (data.code === 200) {
        return NextResponse.json({ success: true, channel: 'pushplus' });
      }
      return NextResponse.json(
        { error: 'Pushplus 推送失败', detail: data.msg ?? JSON.stringify(data) },
        { status: 400 }
      );
    } catch (err) {
      return NextResponse.json(
        { error: 'Pushplus 请求失败', detail: String(err) },
        { status: 500 }
      );
    }
  }

  // ── 2. 企业微信 Webhook（企业用户）────────────────────────────────────────
  const webhookUrl: string =
    (typeof body.webhookUrl === 'string' && body.webhookUrl.trim())
      ? body.webhookUrl.trim()
      : (process.env.WECHAT_WEBHOOK_URL ?? '');

  if (webhookUrl) {
    let content: string;
    let msgtype: 'markdown' | 'text' = 'markdown';

    if (report) {
      content = buildMarkdown(report);
    } else if (typeof body.text === 'string') {
      content = body.text;
      msgtype = 'text';
    } else {
      return NextResponse.json({ error: 'report or text is required' }, { status: 400 });
    }

    try {
      const payload =
        msgtype === 'markdown'
          ? { msgtype: 'markdown', markdown: { content } }
          : { msgtype: 'text', text: { content } };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.errcode === 0) {
        return NextResponse.json({ success: true, channel: 'wecom' });
      }
      return NextResponse.json(
        { error: '企业微信返回错误', detail: data.errmsg, code: data.errcode },
        { status: 400 }
      );
    } catch (err) {
      return NextResponse.json(
        { error: '推送失败，请检查网络或 Webhook 地址', detail: String(err) },
        { status: 500 }
      );
    }
  }

  // ── 3. 两者都未配置 ────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      error: 'no_channel_configured',
      hint: '请在「店铺设置 → 微信推送配置」中填写 Server酱 SendKey 或企业微信 Webhook',
    },
    { status: 503 }
  );
}
