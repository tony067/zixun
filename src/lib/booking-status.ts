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
 * - 绿系（默认主色）：字 #3A6228，底 #E4F0DC —— 大多数状态用它（待咨询 / 已完成）
 * - 陶土橙（待操作 / 注意）：字 #C66B2E，底 #FAE9DD —— 待确认 / 待支付（同总览「待处理订单」图标色系）
 * - 青绿系（进行中）：字 #3A9B8E，底 #E4F2F0（取自身份切换页图标设计色）
 * - 琥珀系（退款类）：字 #B07D2A，底 #FEF9EE
 * - 棕灰系（无效态）：字 #9B8E82，底 #EBE7DF —— 已取消
 * - 红系（已拒绝）：字 #DC2626，底 #FEE2E2
 * - 全平台状态徽章 / 胶囊禁用蓝、紫、黄；同一模块需要区分时才借用上述其他色系；
 *   图标与插画用色不受此约束（如身份切换页多色图标、总览统计卡图标圆圈）
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
  pending_confirmation: { label: "待确认",     color: "#C66B2E", bg: "#FAE9DD" },
  pending_payment:      { label: "待支付",     color: "#C66B2E", bg: "#FAE9DD" },
  confirmed:            { label: "待支付(旧)", color: "#C66B2E", bg: "#FAE9DD" }, // 历史遗留别名
  pending:              { label: "待确认",     color: "#C66B2E", bg: "#FAE9DD" }, // 历史遗留别名
  paid:                 { label: "待咨询",     color: "#3A6228", bg: "#E4F0DC" },
  in_progress:          { label: "进行中",     color: "#3A9B8E", bg: "#E4F2F0" },
  completed:            { label: "已完成",     color: "white", bg: "#9CB48A" },
  cancelled:            { label: "已取消",     color: "#9B8E82", bg: "#EBE7DF" },
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
