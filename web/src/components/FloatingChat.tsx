'use client';

import { useRef, useState, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { buildChatRequestBody } from '@/lib/chatRequestBody';
import { streamChat } from '@/lib/streamChat';
import type { ChatMessage } from '@/lib/types';

function uid() { return Math.random().toString(36).slice(2); }

const STARTERS = [
  '我现在最该做什么？',
  '帮我分析一下店里最大的问题',
  '帮我写一版小红书文案',
  '我的广告好像没什么效果',
];

export default function FloatingChat() {
  const { shopProfile, chatHistory, setChatHistory, planState, weeklyReport, campaigns } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [netStatus, setNetStatus] = useState<'idle' | 'connecting' | 'streaming' | 'retrying' | 'error'>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming || !shopProfile) return;
    setInput('');
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('isDemo') === '1';

    const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: Date.now() };
    const assistantId = uid();
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() };

    setChatHistory((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setNetStatus('connecting');

    try {
      await streamChat({
        body: buildChatRequestBody(shopProfile, [...chatHistory, userMsg].map(({ role, content }) => ({ role, content })), {
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
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m)
          );
        },
      });
    } catch {
      setChatHistory((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: '暂时无法回复，请重试。' } : m)
      );
      setNetStatus('error');
    } finally {
      setStreaming(false);
      if (netStatus !== 'error') setNetStatus('idle');
    }
  };

  if (!shopProfile) return null;

  return (
    <>
      {/* 浮动触发按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 顾问"
        className={`fixed bottom-6 right-6 z-50 w-13 h-13 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
          open
            ? 'bg-zinc-900 rotate-[15deg]'
            : 'bg-amber-500 hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-xl'
        }`}
        style={{ width: 52, height: 52 }}
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* 聊天面板 */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-[360px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden transition-all duration-200 origin-bottom-right text-zinc-900 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: 500 }}
      >
        {/* 面板头 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900">小推 · AI 顾问</p>
            <p className="text-xs text-zinc-400">
              {netStatus === 'connecting' ? '正在连接…' :
               netStatus === 'retrying'    ? '连接慢，正在重试…' :
               netStatus === 'streaming'   ? '正在生成…' :
               netStatus === 'error'       ? '刚刚失败了，点一次重试' :
               '随时问，像聊天一样'}
            </p>
          </div>
          {chatHistory.length > 0 && (
            <button
              onClick={() => setChatHistory([])}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100"
            >
              清空
            </button>
          )}
        </div>

        {/* 消息区：min-h-0 避免 flex 子项被内容撑高后整列无法滚动 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col justify-end pb-2 space-y-2">
              <p className="text-xs text-zinc-400 text-center mb-1">选一个问题开始</p>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs text-zinc-600 bg-zinc-50 hover:bg-amber-50 hover:text-amber-900 border border-zinc-200 hover:border-amber-200 rounded-xl px-3 py-2.5 transition-all duration-150 active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <>
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <svg viewBox="0 0 20 20" fill="white" className="w-2.5 h-2.5">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] min-w-0 px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-zinc-900 text-white rounded-br-sm'
                        : msg.content
                        ? 'bg-zinc-900/92 text-zinc-50 rounded-bl-sm border border-white/10 shadow-sm shadow-black/20'
                        : 'bg-zinc-900/92 border border-white/10'
                    }`}
                  >
                    {msg.content || (
                      <span className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/65 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/65 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/65 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* 输入区 */}
        <div className="shrink-0 border-t border-zinc-100 px-3 py-2.5 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={'随便问，比如"最近客流少了怎么办"'}
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none text-sm text-zinc-900 placeholder-zinc-300 bg-transparent outline-none py-1.5 max-h-24 overflow-y-auto disabled:opacity-50"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 flex items-center justify-center transition-all duration-150 active:scale-90"
          >
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 translate-x-px">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 背景蒙层（仅移动端） */}
      {open && (
        <div
          className="fixed inset-0 z-30 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
