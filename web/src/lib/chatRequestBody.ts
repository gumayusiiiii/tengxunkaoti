import type { CampaignRecord, PlanState, WeeklyReport, ShopProfile } from './types';

export type ChatApiMode = 'advisor' | 'task';

export type ContextSnapshot = {
  isDemo?: boolean;
  planState: PlanState;
  weeklyReport: WeeklyReport;
  campaigns: Array<{
    name: string;
    goal: string;
    platform: string;
    status: string;
    budget: string;
    views?: number;
    clicks?: number;
    ctr?: number;
    spend?: number;
  }>;
};

/**
 * 统一构造 /api/chat 的 body，便于顾问基于「店铺档案 + 站内存档」回答。
 * mode=task 用于 JSON/长文生成，避免与顾问的短回复截断规则冲突。
 */
export function buildChatRequestBody(
  shopProfile: ShopProfile,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  options: {
    mode?: ChatApiMode;
    isDemo?: boolean;
    planState?: PlanState | null;
    weeklyReport?: WeeklyReport | null;
    campaigns?: CampaignRecord[];
  } = {}
) {
  const mode: ChatApiMode = options.mode ?? 'advisor';
  const c = options.campaigns ?? [];
  const contextSnapshot: ContextSnapshot = {
    isDemo: options.isDemo ?? false,
    planState: options.planState ?? null,
    weeklyReport: options.weeklyReport ?? null,
    campaigns: c.slice(0, 12).map((x) => ({
      name: x.name,
      goal: x.goal,
      platform: x.platform,
      status: x.status,
      budget: x.budget,
      views: x.views,
      clicks: x.clicks,
      ctr: x.ctr,
      spend: x.spend,
    })),
  };
  return { messages, shopProfile, mode, contextSnapshot };
}
