'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/AppContext';
import type { ShopProfile } from '@/lib/types';

const WEBHOOK_KEY = 'wechat_webhook_url';
const PUSHPLUS_KEY = 'pushplus_token';

const FIELD_META: { key: keyof ShopProfile; label: string; desc: string }[] = [
  { key: 'store_name',        label: '店铺名称',      desc: '你的店铺叫什么' },
  { key: 'store_type',        label: '产品类型',      desc: '主要卖什么' },
  { key: 'location',          label: '店铺位置',      desc: '在哪个区域，周边环境' },
  { key: 'target_audience',   label: '目标客群',      desc: '最想吸引哪些人' },
  { key: 'monthly_budget',    label: '月推广预算',    desc: '每月打算花多少在推广上' },
  { key: 'current_platforms', label: '现有平台',      desc: '目前在哪里发内容或广告' },
  { key: 'stated_goal',       label: '核心诉求',      desc: '最想解决的推广问题' },
  { key: 'main_products',     label: '主打产品',      desc: '主要产品或招牌商品（选填）' },
  { key: 'price_range',       label: '价格区间',      desc: '产品大概价格范围（选填）' },
  { key: 'owner_selling_points', label: '店铺亮点',   desc: '你认为自己店最大的优势（选填）' },
];

export default function SettingsPage() {
  const { shopProfile, setShopProfile, clearShopProfile } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState<keyof ShopProfile | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // 微信推送配置
  const [pushMode, setPushMode] = useState<'pushplus' | 'wecom'>('pushplus');
  const [pushplusToken, setPushplusToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle');
  const [testDetail, setTestDetail] = useState('');

  useEffect(() => {
    const pp = localStorage.getItem(PUSHPLUS_KEY) ?? '';
    const wh = localStorage.getItem(WEBHOOK_KEY) ?? '';
    setPushplusToken(pp);
    setWebhookUrl(wh);
    if (pp) setPushMode('pushplus');
    else if (wh) setPushMode('wecom');
  }, []);

  const saveConfig = () => {
    localStorage.setItem(PUSHPLUS_KEY, pushplusToken.trim());
    localStorage.setItem(WEBHOOK_KEY, webhookUrl.trim());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  const testPush = async () => {
    setTestStatus('sending');
    setTestDetail('');
    const testReport = {
      weekLabel: '配置测试',
      storeName: shopProfile?.store_name ?? '未命名店铺',
      summary: '推送配置成功！这是来自 AI 推广助手的测试消息。',
      highlights: ['Token 填写正确', 'API 连接正常'],
      issues: ['（这只是测试消息，无需处理）'],
      nextAction: '正式使用：在「效果分析」生成周报后点击推送',
      generatedAt: Date.now(),
    };
    try {
      const body =
        pushMode === 'pushplus'
          ? { pushplusToken: pushplusToken.trim(), report: testReport }
          : { webhookUrl: webhookUrl.trim(), report: testReport };

      const res = await fetch('/api/wechat-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('ok');
        setTestDetail('');
      } else {
        setTestStatus('fail');
        setTestDetail(data.detail ?? data.error ?? '未知错误');
      }
    } catch (e) {
      setTestStatus('fail');
      setTestDetail(String(e));
    } finally {
      setTimeout(() => setTestStatus('idle'), 6000);
    }
  };

  const canTest =
    testStatus !== 'sending' &&
    (pushMode === 'pushplus' ? !!pushplusToken.trim() : !!webhookUrl.trim());

  if (!shopProfile) return null;

  const startEdit = (key: keyof ShopProfile) => {
    setEditing(key);
    setEditValue(shopProfile[key] ?? '');
  };

  const saveEdit = () => {
    if (!editing) return;
    setShopProfile({ ...shopProfile, [editing]: editValue.trim() });
    setEditing(null);
  };

  const handleClear = () => {
    clearShopProfile();
    router.replace('/');
  };

  return (
    <AppLayout title="店铺档案" subtitle="查看和修改你的店铺基本信息">
      <div className="h-full overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 店铺档案卡片 */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-900">基本信息</p>
              <p className="text-xs text-zinc-400 mt-0.5">这些信息会自动注入给 AI，帮助它更准确地了解你的店铺</p>
            </div>

            <div className="divide-y divide-zinc-100">
              {FIELD_META.map(({ key, label, desc }) => {
                const val = shopProfile[key];
                const isEditing = editing === key;

                return (
                  <div key={key} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-500">{label}</p>
                          <span className="text-[10px] text-zinc-300">{desc}</span>
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              rows={2}
                              className="w-full text-sm text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="px-3 py-1.5 text-zinc-500 text-xs hover:text-zinc-700 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm mt-1 leading-relaxed ${val ? 'text-zinc-800' : 'text-zinc-300'}`}>
                            {val || '（未填写）'}
                          </p>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => startEdit(key)}
                          className="text-xs text-zinc-400 hover:text-amber-600 transition-colors shrink-0 pt-0.5"
                        >
                          编辑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 微信推送配置 */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.518 3.274c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.969-.983zm4.905 0c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.969-.983z"/>
                </svg>
                <p className="text-sm font-semibold text-zinc-900">微信推送配置</p>
              </div>
              <p className="text-xs text-zinc-400 mt-1">配置后，周报可一键推送到你的微信</p>
            </div>

            <div className="px-5 py-5 space-y-5">

              {/* 模式切换 */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'pushplus', label: '个人微信', sub: '推荐，免费，扫码即用' },
                  { id: 'wecom',   label: '企业微信群', sub: '需有企业微信账号' },
                ] as const).map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setPushMode(id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      pushMode === id
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${pushMode === id ? 'text-amber-900' : 'text-zinc-700'}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>

              {/* Pushplus Token 输入 */}
              {pushMode === 'pushplus' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600">Pushplus Token</label>
                  <input
                    type="text"
                    value={pushplusToken}
                    onChange={(e) => setPushplusToken(e.target.value)}
                    placeholder="粘贴你的 Token..."
                    className="w-full text-sm text-zinc-900 placeholder-zinc-300 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>
              )}

              {/* 企业微信 Webhook 输入 */}
              {pushMode === 'wecom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600">Webhook 地址</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                    className="w-full text-sm text-zinc-900 placeholder-zinc-300 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              )}

              {/* 保存 + 测试按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={saveConfig}
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-all"
                >
                  {configSaved ? '已保存 ✓' : '保存配置'}
                </button>
                <button
                  onClick={testPush}
                  disabled={!canTest}
                  className={`px-4 py-2 border text-xs font-semibold rounded-xl transition-all ${
                    testStatus === 'ok'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : testStatus === 'fail'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-40'
                  }`}
                >
                  {testStatus === 'sending' && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      发送测试中…
                    </span>
                  )}
                  {testStatus === 'idle' && '发送测试消息'}
                  {testStatus === 'ok' && '✓ 成功！去微信查收'}
                  {testStatus === 'fail' && '✗ 推送失败'}
                </button>
              </div>

              {testStatus === 'fail' && testDetail && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 break-all">{testDetail}</p>
              )}

              {pushMode === 'pushplus' && pushplusToken && (
                <p className="text-[10px] text-zinc-400">
                  已配置 Pushplus · <span className="font-mono">{pushplusToken.slice(0, 10)}…</span>
                </p>
              )}
            </div>
          </div>

          {/* 危险区 */}
          <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-red-100">
              <p className="text-sm font-semibold text-red-700">清除数据</p>
              <p className="text-xs text-red-400 mt-0.5">以下操作不可恢复</p>
            </div>
            <div className="px-5 py-4">
              {!showConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-700">重新建档</p>
                    <p className="text-xs text-zinc-400 mt-0.5">清除所有数据，重新填写店铺信息</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors"
                  >
                    清除并重建
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-red-700">确定要清除所有数据吗？</p>
                  <p className="text-xs text-zinc-400">包括店铺信息、聊天记录、推广方案、效果数据，全部清除且无法恢复。</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
                    >
                      确认清除
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 text-zinc-500 text-sm hover:text-zinc-700 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
