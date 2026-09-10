/**
 * 订单状态统一配置 —— 三端（来访 / 咨询师 / 管理员）唯一的规范来源
 *
 * 规则：
 * 1. 新增订单状态：只在这里加一条，三端界面自动获得统一的文案与配色
 * 2. 调整配色 / 文案：只改这一个文件，禁止在各界面里散落硬编码
 * 3. 三端有特殊文案需求时（如详情页长描述），在各自页面补充 desc 映射，
 *    但 label / color / bg 必须引用本文件
 *
 * 配色规范（纸叠色板）：
 * - 琥珀系（待确认 / 待支付 / 已退款）：字 #D97706 / #B07D2A，底 #FEF3C7 / #FEF9EE
 * - 绿系（待咨询）：字 #3A6228，底 #E4F0DC（项目主绿 #9CB48A 的深浅搭配）
 * - 蓝系（进行中）：字 #2563EB，底 #DBEAFE
 * - 灰系（已完成 / 已取消）：字 #6B7280 / #9CA3AF，底 #F3F4F6 / #F9FAFB
 * - 红系（已拒绝）：字 #DC2626，底 #FEE2E2
 */

export type BookingStatus =
  | "pending_confirmation"
  | "pending_payment"
  | "confirmed" // 历史遗留别名（=待支付）
  | "pending"   // 历史遗留别名（=待确认）
  | "paid"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected"
  | "refunded";

export interface StatusMeta {
  /** 三端统一的短标签（徽章用） */
  label: string;
  /** 徽章文字色 */
  color: string;
  /** 徽章背景色 */
  bg: string;
}

export const BOOKING_STATUSES: Record<BookingStatus, StatusMeta> = {
  pending_confirmation: { label: "待确认",     color: "#D97706", bg: "#FEF3C7" },
  pending_payment:      { label: "待支付(旧)", color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { label: "待支付(旧)", color: "#D97706", bg: "#FEF3C7" }, // 历史遗留别名
  pending:              { label: "待确认",     color: "#D97706", bg: "#FEF3C7" }, // 历史遗留别名
  paid:                 { label: "待咨询",     color: "#3A6228", bg: "#E4F0DC" },
  in_progress:          { label: "进行中",     color: "#2563EB", bg: "#DBEAFE" },
  completed:            { label: "已完成",     color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { label: "已取消",     color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { label: "已拒绝",     color: "#DC2626", bg: "#FEE2E2" },
  refunded:             { label: "已退款",     color: "#B07D2A", bg: "#FEF9EE" },
};

/** 后端合法状态校验共用 */
export const ALL_BOOKING_STATUSES = Object.keys(BOOKING_STATUSES) as BookingStatus[];

/** 未知状态兜底：中性米灰色 */
export function statusMeta(status: string): StatusMeta {
  return (
    BOOKING_STATUSES[status as BookingStatus] ?? {
      label: status,
      color: "#9B8E82",
      bg: "#F5F0EA",
    }
  );
}
