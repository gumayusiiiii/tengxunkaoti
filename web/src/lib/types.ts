export type ShopProfile = {
  store_name: string;
  store_type: string;
  location: string;
  surroundings: string;
  main_products: string;
  price_range: string;
  target_audience: string;
  monthly_budget: string;
  current_platforms: string;
  past_promotions: string;
  stated_goal: string;
  owner_selling_points: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type PlanState = {
  diagnosis: string;
  diagnosisLabel: string;
  mainGoal: string;
  primaryPlatform: string;
  budget: string;
  weeklyActions: string[];
  generatedAt: number;
} | null;

export type ContentVersion = {
  label: string;
  body: string;
};

export type WeeklyReport = {
  weekLabel: string;          // 例：2026年第17周
  /** 老结构（兼容旧数据） */
  summary?: string;            // 整体表现一句话
  highlights?: string[];       // 做对的事（最多3条）
  issues?: string[];           // 需要改进的（最多3条）
  nextAction?: string;         // 下周只需做一件事

  /** 新结构：更像“汇报稿”，更一眼看懂 */
  headline?: string;           // 主标题（更像周报标题）
  kpi?: {
    views: number;
    clicks: number;
    ctr: number | null;        // (%)
    spend: number;             // (元)
    cpc: number | null;        // (元/点击)
  };
  conclusions?: string[];      // 结论（最多3条，必须可行动/可验证）
  action?: {
    what: string;              // 做什么
    where: string;             // 在哪做
    check: string;             // 怎么验收
  };
  missing?: string[];          // 缺的关键业务数据（如到店/下单/客单价）
  generatedAt: number;
} | null;

export type CampaignRecord = {
  id: string;
  name: string;
  goal: string;           // 推广目标
  platform: string;
  status: 'active' | 'paused' | 'planning' | 'ended';
  budget: string;
  startDate: string;
  note: string;
  createdAt: number;
  // 可选效果指标
  views?: number;         // 曝光人数
  clicks?: number;        // 点击次数
  ctr?: number;           // 点击率 (%)
  spend?: number;         // 已花费 (元)
};
