"""
陈姐烘焙 AI 广告顾问 — 微信机器人
使用 WxAuto 监听微信消息，调用 Minimax API 自动回复。
运行前提：微信 PC 版已打开并登录。
"""

import time
import re
import json
import os
import requests

# ── 配置区（按需修改）────────────────────────────────────────────────────────

MINIMAX_API_KEY = "sk-cp-CJZbD1-adp0CmyDWJ_pi4gDRJbFgaJJ3_gNeYpVgcM1Rr-Dhb2HJ_FLVzI7d0m6n-BeY_8XRqe8eCbXQVin9DJEKyuqxF7o5TJI8sMktx5wYPnAMHbH4om8"
MINIMAX_URL    = "https://api.minimaxi.com/v1/chat/completions"
MINIMAX_MODEL  = "MiniMax-M2.7"

# 要监听的微信联系人或群聊名称（列表，可以写多个）
# 填你的微信昵称、备注名，或群名——必须和微信里显示的完全一致
LISTEN_TARGETS = [
    "文件传输助手",   # 测试用：先发给自己
    # "陈老板",       # 真实客户的微信昵称
    # "烘焙创业交流群", # 群聊名
]

# 触发前缀（可选）：只有以这个词开头的消息才触发 AI 回复
# 留空 = 所有消息都触发
TRIGGER_PREFIX = ""   # 例如设置为"@小推 " 则只回复 @小推 开头的消息

# 对话记忆：每个联系人保留最近几轮对话
MAX_HISTORY = 6   # 条数

# ── 读取 System Prompt ──────────────────────────────────────────────────────

def load_system_prompt() -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "..", "prompts", "advisor_system.md"
    )
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            content = f.read()
        # 提取最后一个 ===PROMPT START=== 到 ===PROMPT END=== 之间的内容
        # （文件开头有一行引用了这两个标记作为说明，用 rfind 找最后一个真正的标记）
        start_marker = "===PROMPT START==="
        end_marker   = "===PROMPT END==="
        start_idx = content.rfind(start_marker)
        end_idx   = content.rfind(end_marker)
        if start_idx != -1 and end_idx > start_idx:
            return content[start_idx + len(start_marker):end_idx].strip()
        return content  # fallback：用全文
    except FileNotFoundError:
        return "你是一个专业的广告投放顾问，帮助小店老板用白话理解推广策略，回复简洁不超过150字。"

SYSTEM_PROMPT = load_system_prompt()
print(f"✅ System Prompt 加载成功（{len(SYSTEM_PROMPT)} 字符）")

# ── 对话历史管理 ─────────────────────────────────────────────────────────────

history: dict[str, list[dict]] = {}  # { contact_name: [{"role": ..., "content": ...}] }

def get_history(name: str) -> list[dict]:
    return history.get(name, [])

def add_to_history(name: str, role: str, content: str):
    if name not in history:
        history[name] = []
    history[name].append({"role": role, "content": content})
    # 保留最近 MAX_HISTORY 条
    if len(history[name]) > MAX_HISTORY:
        history[name] = history[name][-MAX_HISTORY:]

# ── 调用 Minimax API ─────────────────────────────────────────────────────────

def call_minimax(contact: str, user_msg: str) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += get_history(contact)
    messages.append({"role": "user", "content": user_msg})

    try:
        resp = requests.post(
            MINIMAX_URL,
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MINIMAX_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 400,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data["choices"][0]["message"]["content"]
        # 去掉 <think>...</think> 块（Minimax 推理模型会输出）
        clean = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
        return clean or "（AI 暂时没有输出，请重试）"
    except Exception as e:
        return f"⚠️ AI 回复失败：{e}"

# ── 处理单条消息 ──────────────────────────────────────────────────────────────

def handle_message(chat, msg_content: str, sender: str):
    content = msg_content.strip()

    # 触发前缀过滤
    if TRIGGER_PREFIX and not content.startswith(TRIGGER_PREFIX):
        return
    if TRIGGER_PREFIX:
        content = content[len(TRIGGER_PREFIX):].strip()

    if not content:
        return

    print(f"\n📩 [{sender}] 说：{content}")

    # 加入用户历史
    add_to_history(sender, "user", content)

    # 调用 AI
    reply = call_minimax(sender, content)
    print(f"🤖 回复：{reply[:80]}{'…' if len(reply) > 80 else ''}")

    # 发送回复
    try:
        chat.SendMsg(reply)
        add_to_history(sender, "assistant", reply)
    except Exception as e:
        print(f"❌ 发送失败：{e}")

# ── 主循环 ───────────────────────────────────────────────────────────────────

def main():
    try:
        from wxauto import WeChat
    except ImportError:
        print("❌ 请先安装 wxauto：pip install wxauto")
        return

    print("🔗 正在连接微信桌面端…")

    # 先用 win32 把微信主窗口置顶，避免 SetWindowPos 失败
    try:
        import win32gui, win32con
        def _bring_wechat_front(hwnd, _):
            title = win32gui.GetWindowText(hwnd)
            cls   = win32gui.GetClassName(hwnd)
            if title == "微信" and "Qt" in cls:
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                win32gui.SetForegroundWindow(hwnd)
        win32gui.EnumWindows(_bring_wechat_front, None)
        time.sleep(0.8)
    except Exception as e:
        print(f"   (窗口置前失败，继续尝试：{e})")

    try:
        wx = WeChat()
    except Exception as e:
        print(f"❌ 无法连接微信：{e}")
        print("   请确认微信 PC 版主界面可见（不要最小化到任务栏托盘）。")
        return

    print(f"✅ 已连接：{wx.nickname}")
    print(f"📋 监听目标：{LISTEN_TARGETS}")
    print("─" * 50)

    # 注册监听对象
    for target in LISTEN_TARGETS:
        try:
            wx.AddListenChat(who=target, savepic=False)
            print(f"   + 已添加监听：{target}")
        except Exception as e:
            print(f"   ⚠️ 无法添加监听 [{target}]：{e}（请确认名称与微信完全一致）")

    print("\n🚀 Bot 已启动，等待消息… （按 Ctrl+C 停止）\n")

    while True:
        try:
            msgs = wx.GetListenMessage()
            for chat in msgs:
                one_msgs = msgs.get(chat)
                for msg in one_msgs:
                    # type == 'friend' 表示是对方发的（不是自己发的）
                    if msg.type == "friend":
                        handle_message(chat, msg.content, chat.who)
        except KeyboardInterrupt:
            print("\n👋 Bot 已停止。")
            break
        except Exception as e:
            print(f"⚠️ 循环异常（自动继续）：{e}")

        time.sleep(1)  # 每秒检查一次

if __name__ == "__main__":
    main()
