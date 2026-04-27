'use client';

import { useRef, useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/AppContext';
import { buildChatRequestBody } from '@/lib/chatRequestBody';
import { streamChat } from '@/lib/streamChat';
import type { ChatMessage } from '@/lib/types';

function uid() {
  return Math.random().toString(36).slice(2);
}

const STARTERS = [
  '我想推广，但完全不知道从哪里开始',
  '帮我分析一下我的店现在最缺什么',
  '帮我写一版小红书文案',
  '我投了广告，感觉没什么效果，为什么？',
];

export default function ChatPage() {
  const { shopProfile, chatHistory, setChatHistory, planState, weeklyReport, campaigns } = useApp();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [netStatus, setNetStatus] = useState<'idle' | 'connecting' | 'streaming' | 'retrying' | 'error'>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streaming]);

  const send = async (text: string) => {
    if (!text.trim() || streaming || !shopProfile) return;
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('isDemo') === '1';
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text.trim(), timestamp: Date.now() };
    const aiMsg: ChatMessage = { id: uid(), role: 'assistant', content: '', timestamp: Date.now() };

    setChatHistory((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
    setStreaming(true);
    setNetStatus('connecting');

    try {
      await streamChat({
        body: buildChatRequestBody(shopProfile, [...chatHistory, userMsg].slice(-20).map(({ role, content }) => ({ role, content })), {
          mode: 'advisor',
          isDemo,
          planState,
          weeklyReport,
          campaigns,
        }),
        firstTokenTimeoutMs: 4500,
        totalTimeoutMs: 45000,
        retryOnce: true,
        onStatus: (s) => {
          if (s === 'connecting') setNetStatus('connecting');
          if (s === 'streaming') setNetStatus('streaming');
          if (s === 'retrying') setNetStatus('retrying');
          if (s === 'error') setNetStatus('error');
        },
        onDelta: (delta) => {
          setChatHistory((prev) =>
            prev.map((m) => m.id === aiMsg.id ? { ...m, content: m.content + delta } : m)
          );
        },
      });
    } catch {
      setChatHistory((prev) =>
        prev.map((m) => m.id === aiMsg.id ? { ...m, content: '网络异常，请检查连接后重试。' } : m)
      );
      setNetStatus('error');
    } finally {
      setStreaming(false);
      if (netStatus !== 'error') setNetStatus('idle');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const isEmpty = chatHistory.length === 0;

  return (
    <AppLayout title="AI 顾问" subtitle="你的专属推广策略顾问">
      <div className="flex flex-col h-full">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 pb-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-amber-500">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">你好，我是小推</p>
                <p className="text-sm text-zinc-500 mt-1">告诉我你现在最想解决什么，我来帮你制定方案。</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <div
              key={msg.id}
              className={`msg-enter flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-sm'
                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
                {/* 打字光标：最后一条 AI 消息且正在流式输出时显示 */}
                {streaming && msg.role === 'assistant' && i === chatHistory.length - 1 && (
                  <span className="cursor-blink" />
                )}
              </div>
            </div>
          ))}

          {/* 加载态（AI 还没有开始输出时） */}
          {streaming && chatHistory[chatHistory.length - 1]?.content === '' && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 输入框 */}
        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 focus-within:border-zinc-400 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="输入你的问题，或者直接告诉我你想做什么推广…"
              disabled={streaming}
              className="flex-1 resize-none text-sm text-zinc-900 placeholder-zinc-400 bg-transparent focus:outline-none min-h-[24px] max-h-[120px] disabled:opacity-50"
              style={{ height: '24px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="shrink-0 w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white disabled:opacity-30 hover:bg-zinc-800 transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 ml-1">Enter 发送 · Shift+Enter 换行</p>
        </div>
      </div>
    </AppLayout>
  );
}
